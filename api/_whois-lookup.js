import net from 'net';
import { URL } from 'url';

// Clean and extract hostname from raw input
function extractHostname(input) {
  let cleaned = input.trim().toLowerCase();

  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    let host = parsed.hostname;
    // Strip "www." if present to query clean domain WHOIS details
    host = host.replace(/^www\./, '');
    return host;
  } catch (err) {
    return null;
  }
}

// Perform WHOIS query over TCP port 43
function rawWhoisQuery(server, domain) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const socket = net.connect({ host: server, port: 43 }, () => {
      socket.write(domain + '\r\n');
    });

    let buffer = '';
    socket.on('data', (data) => {
      buffer += data.toString();
    });

    socket.on('end', () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(buffer);
    });

    socket.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      reject(err);
    });

    socket.setTimeout(6000);
    socket.on('timeout', () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      reject(new Error(`Connection to WHOIS server ${server} timed out after 6 seconds.`));
    });
  });
}

// Find referral server in IANA response
function findReferralServer(ianaText) {
  const lines = ianaText.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(?:refer|whois|referral server):\s*([^\s]+)/i);
    if (match) {
      const server = match[1].trim();
      if (server && !server.includes('whois.iana.org')) {
        return server;
      }
    }
  }
  return null;
}

// Get fallback registry WHOIS server based on TLD
function getFallbackServer(domain) {
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  const defaults = {
    com: 'whois.verisign-grs.com',
    net: 'whois.verisign-grs.com',
    org: 'whois.pir.org',
    info: 'whois.afilias.net',
    biz: 'whois.nic.biz',
    us: 'whois.nic.us',
    uk: 'whois.nic.uk',
    io: 'whois.nic.io',
    co: 'whois.nic.co',
    ca: 'whois.cira.ca',
    de: 'whois.denic.de',
    app: 'whois.nic.google',
    dev: 'whois.nic.google',
    me: 'whois.nic.me',
    ai: 'whois.nic.ai'
  };
  return defaults[tld] || null;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({
      error: 'Domain parameter is required (e.g. ?domain=github.com)'
    });
  }

  const hostname = extractHostname(domain);
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/i;

  if (!hostname || !domainRegex.test(hostname)) {
    return res.status(400).json({
      error: 'Invalid domain name or URL format.'
    });
  }

  try {
    // 1. Query IANA Root Server
    let referralServer = null;
    let ianaOutput = '';
    try {
      ianaOutput = await rawWhoisQuery('whois.iana.org', hostname);
      referralServer = findReferralServer(ianaOutput);
    } catch (err) {
      console.warn(`IANA lookup failed for ${hostname}:`, err.message);
    }

    // Use TLD fallback if IANA didn't specify a server or failed
    if (!referralServer) {
      referralServer = getFallbackServer(hostname) || 'whois.internic.net';
    }

    // 2. Query authoritative registry server
    let registryOutput = '';
    try {
      registryOutput = await rawWhoisQuery(referralServer, hostname);
    } catch (err) {
      // If primary query fails, try falling back to InterNIC for com/net
      if (referralServer !== 'whois.internic.net' && (hostname.endsWith('.com') || hostname.endsWith('.net'))) {
        try {
          registryOutput = await rawWhoisQuery('whois.internic.net', hostname);
        } catch {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // 3. Parse WHOIS response text
    const whoisText = registryOutput || ianaOutput;
    const details = parseWhoisData(whoisText);

    return res.status(200).json({
      success: true,
      domain: hostname,
      query_server: referralServer,
      registrar: details.registrar,
      dates: details.dates,
      name_servers: details.name_servers,
      status: details.status,
      raw: whoisText,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to complete WHOIS lookup query',
      details: err.message
    });
  }
}

function parseWhoisData(text) {
  const details = {
    registrar: { name: null, url: null },
    dates: { created: null, expires: null, updated: null, days_remaining: null },
    name_servers: [],
    status: []
  };

  if (!text) return details;

  const lines = text.split('\n');
  const nsSet = new Set();
  const statusSet = new Set();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%') || line.startsWith('#') || line.startsWith('*')) {
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const rawKey = line.substring(0, colonIdx).trim().toLowerCase();
    const rawVal = line.substring(colonIdx + 1).trim();

    if (!rawVal) continue;

    // Registrar parsing
    if (
      rawKey === 'registrar' ||
      rawKey === 'sponsoring registrar' ||
      rawKey === 'registrar name' ||
      rawKey === 'registrar organization'
    ) {
      if (!details.registrar.name) details.registrar.name = rawVal;
    }
    else if (rawKey === 'registrar referral url' || rawKey === 'registrar url') {
      if (!details.registrar.url) details.registrar.url = rawVal;
    }

    // Dates parsing
    else if (
      rawKey === 'creation date' ||
      rawKey === 'created on' ||
      rawKey === 'created date' ||
      rawKey === 'registered on' ||
      rawKey === 'created'
    ) {
      if (!details.dates.created) details.dates.created = parseDate(rawVal);
    }
    else if (
      rawKey === 'registry expiry date' ||
      rawKey === 'expiration date' ||
      rawKey === 'expiration on' ||
      rawKey === 'expires on' ||
      rawKey === 'expires'
    ) {
      if (!details.dates.expires) details.dates.expires = parseDate(rawVal);
    }
    else if (
      rawKey === 'updated date' ||
      rawKey === 'last updated on' ||
      rawKey === 'last updated' ||
      rawKey === 'updated'
    ) {
      if (!details.dates.updated) details.dates.updated = parseDate(rawVal);
    }

    // Name Servers parsing
    else if (rawKey === 'name server' || rawKey === 'nameservers' || rawKey === 'nserver') {
      // Split by whitespace in case multiple name servers are list on one line
      const servers = rawVal.split(/[\s,]+/).map(s => s.toLowerCase().replace(/\.$/, '')).filter(Boolean);
      servers.forEach(s => nsSet.add(s));
    }

    // Status parsing
    else if (rawKey === 'domain status' || rawKey === 'status') {
      const statuses = rawVal.split(/[\s,]+/).filter(Boolean);
      statuses.forEach(s => statusSet.add(s));
    }
  }

  details.name_servers = Array.from(nsSet);
  details.status = Array.from(statusSet);

  // Compute days remaining
  if (details.dates.expires) {
    const exp = new Date(details.dates.expires);
    const diff = exp.getTime() - Date.now();
    details.dates.days_remaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return details;
}

function parseDate(val) {
  if (!val) return null;
  // Strip timezone notes like "(UTC)" if appended to dates
  const cleaned = val.replace(/\s*\(.*\)\s*$/, '').trim();
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
