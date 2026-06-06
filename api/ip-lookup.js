import { promises as dns } from 'dns';

// In-memory cache for Tor Exit Nodes
let torExitNodes = null;
let lastTorFetchTime = 0;
const TOR_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// In-memory cache for IP Geolocation lookups to stay within rate limits
const ipCache = new Map();
const IP_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache for individual IPs

// Keywords associated with commercial data centers, hosting providers, or VPNs
const DATACENTER_KEYWORDS = [
  'amazon', 'aws', 'google cloud', 'google llc', 'microsoft', 'azure', 
  'digitalocean', 'digital ocean', 'linode', 'ovh', 'hetzner', 'choopa', 
  'm247', 'colocrossing', 'hostgator', 'bluehost', 'godaddy', 'leaseweb', 
  'vultr', 'cogent', 'hurricane electric', 'fastly', 'cloudflare', 'akamai', 
  'alibaba', 'softlayer', 'ipvolume', 'quadranet', 'zenlayer', 'constant hosting',
  'layeronline', 'hd-servers', 'contabo', 'scaleway', 'leaseweb', 'singlehop', 
  'psychz', 'quadranet', 'liquidxux', 'datacenter', 'hosting', 'server', 'cloud',
  'vpn', 'proxy', 'tor exit', 'protonvpn', 'nordvpn', 'expressvpn', 'mullvad'
];

// Fetch active Tor exit nodes
async function getTorExitNodes() {
  const now = Date.now();
  if (torExitNodes && (now - lastTorFetchTime < TOR_CACHE_TTL)) {
    return torExitNodes;
  }

  try {
    const response = await fetch('https://check.torproject.org/torbulkexitlist');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const IPs = new Set(
      text.split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip && !ip.startsWith('#'))
    );
    torExitNodes = IPs;
    lastTorFetchTime = now;
    return torExitNodes;
  } catch (err) {
    console.error('Failed to fetch Tor exit nodes list:', err);
    return torExitNodes || new Set(); // return previous cache if available, or empty set
  }
}

// Fallback chain to perform IP lookup using multiple free API providers
async function performIpLookup(ip) {
  const cached = ipCache.get(ip);
  if (cached && (Date.now() - cached.timestamp < IP_CACHE_TTL)) {
    return { data: cached.data, cached: true };
  }

  // 1. Primary: ip-api.com (Allows 45 requests/min)
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success') {
        const result = {
          country: json.country || 'Unknown',
          country_code: json.countryCode || 'Unknown',
          region: json.regionName || 'Unknown',
          city: json.city || 'Unknown',
          zip: json.zip || 'Unknown',
          latitude: json.lat || 0.0,
          longitude: json.lon || 0.0,
          timezone: json.timezone || 'Unknown',
          isp: json.isp || 'Unknown',
          org: json.org || 'Unknown',
          as: json.as || 'Unknown',
          source: 'ip-api'
        };
        ipCache.set(ip, { data: result, timestamp: Date.now() });
        return { data: result, cached: false };
      }
    }
  } catch (err) {
    console.warn(`ip-api.com lookup failed for ${ip}, trying fallback:`, err.message);
  }

  // 2. Secondary Fallback: ipapi.co (Allows 1,000 requests/day)
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (res.ok) {
      const json = await res.json();
      if (!json.error) {
        const result = {
          country: json.country_name || 'Unknown',
          country_code: json.country_code || 'Unknown',
          region: json.region || 'Unknown',
          city: json.city || 'Unknown',
          zip: json.postal || 'Unknown',
          latitude: json.latitude || 0.0,
          longitude: json.longitude || 0.0,
          timezone: json.timezone || 'Unknown',
          isp: json.org || 'Unknown', // org contains ASN/ISP in ipapi.co
          org: json.org || 'Unknown',
          as: json.asn || 'Unknown',
          source: 'ipapi-co'
        };
        ipCache.set(ip, { data: result, timestamp: Date.now() });
        return { data: result, cached: false };
      }
    }
  } catch (err) {
    console.warn(`ipapi.co lookup failed for ${ip}, trying fallback:`, err.message);
  }

  // 3. Tertiary Fallback: ipinfo.io (Allows 50,000 requests/month)
  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json`);
    if (res.ok) {
      const json = await res.json();
      const [lat, lon] = (json.loc || '0.0,0.0').split(',').map(Number);
      const result = {
        country: json.country || 'Unknown', // Note: returns 2-char code
        country_code: json.country || 'Unknown',
        region: json.region || 'Unknown',
        city: json.city || 'Unknown',
        zip: json.postal || 'Unknown',
        latitude: lat || 0.0,
        longitude: lon || 0.0,
        timezone: json.timezone || 'Unknown',
        isp: json.org || 'Unknown',
        org: json.org || 'Unknown',
        as: json.org || 'Unknown', // org usually contains ASXXXX name
        source: 'ipinfo-io'
      };
      ipCache.set(ip, { data: result, timestamp: Date.now() });
      return { data: result, cached: false };
    }
  } catch (err) {
    console.error(`All IP lookup APIs failed for ${ip}:`, err.message);
  }

  // Final fallback (Dummy empty response)
  const fallback = {
    country: 'Unknown',
    country_code: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    zip: 'Unknown',
    latitude: 0.0,
    longitude: 0.0,
    timezone: 'UTC',
    isp: 'Unknown Network',
    org: 'Unknown Network',
    as: 'Unknown',
    source: 'failed-resolution'
  };
  return { data: fallback, cached: false };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let ip = req.query.ip;

  // Auto-detect client IP if parameter is not supplied
  if (!ip) {
    const forwarded = req.headers['x-forwarded-for'];
    ip = forwarded ? forwarded.split(',')[0].trim() : req.headers['x-real-ip'] || req.socket.remoteAddress;
  }

  // Handle IPv6 loopback / Localhost checking locally
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    ip = '8.8.8.8'; // Default to Google DNS IP for local testing
  }

  // Basic IP Validation (IPv4 / IPv6 syntax)
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return res.status(400).json({ error: `Invalid IP address format: ${ip}` });
  }

  // 1. Get Geolocation Details via fallback chain
  const { data: geo, cached: geoCached } = await performIpLookup(ip);

  // 2. Get Tor Exit Nodes list and check IP
  const torNodes = await getTorExitNodes();
  const isTorNode = torNodes.has(ip);

  // 3. Analyze connection details for VPN / Data Center signals
  const asnString = String(geo.as || '').toLowerCase();
  const ispString = String(geo.isp || '').toLowerCase();
  const orgString = String(geo.org || '').toLowerCase();

  const matchesDatacenter = DATACENTER_KEYWORDS.some(kw => 
    asnString.includes(kw) || ispString.includes(kw) || orgString.includes(kw)
  );

  const isVpnOrProxy = isTorNode || matchesDatacenter;
  const isDatacenter = matchesDatacenter && !isTorNode;

  // 4. Formulate threat assessment and recommendations
  let threatLevel = 'low';
  let recommendation = 'ALLOW_ACCESS';
  let reason = 'Residential or verified cellular IP (low threat profile).';

  if (isTorNode) {
    threatLevel = 'high';
    recommendation = 'BLOCK_ACCESS';
    reason = 'IP belongs to a public Tor exit node (anonymous proxy). Blocked for security compliance.';
  } else if (isDatacenter) {
    threatLevel = 'medium';
    recommendation = 'FLAG_FOR_REVIEW';
    reason = 'IP resolved to a commercial datacenter / hosting provider (highly indicative of VPN, proxy, or bot).';
  }

  return res.status(200).json({
    success: true,
    ip: ip,
    location: {
      country: geo.country,
      country_code: geo.country_code,
      region: geo.region,
      city: geo.city,
      zip: geo.zip,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: geo.timezone
    },
    connection: {
      asn: geo.as,
      isp: geo.isp,
      org: geo.org
    },
    security: {
      is_vpn_or_proxy: isVpnOrProxy,
      is_datacenter: isDatacenter,
      is_tor: isTorNode,
      threat_level: threatLevel,
      recommendation: recommendation,
      reason: reason
    },
    cached: geoCached,
    resolution_source: geo.source,
    timestamp: new Date().toISOString()
  });
}
