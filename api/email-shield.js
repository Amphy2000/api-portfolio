import { promises as dns } from 'dns';

// Cache for disposable email domains
let cachedDomains = null;
let lastFetchedTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Fallback static list of the most common disposable email domains
const FALLBACK_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'sharklasers.com',
  'dispostable.com', 'yopmail.com', '10minutemail.com', 'trashmail.com',
  'getairmail.com', 'maildrop.cc', 'temp-mail.org', 'mailnesia.com',
  'mintemail.com', 'generator.email', 'disposable.com', 'throwawaymail.com',
  'tempmailaddress.com', 'burnermail.io', 'guerrillamailblock.com', 'guerrillamail.de'
]);

// Whitelist of major legitimate email providers to prevent false positives
const WHITELIST_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'zoho.com', 'protonmail.com', 'proton.me', 'yandex.com',
  'mail.com', 'gmx.com', 'live.com', 'msn.com', 'me.com', 'mac.com'
]);

// Helper to fetch disposable domains from a highly active GitHub repository
async function getDisposableDomains() {
  const now = Date.now();
  if (cachedDomains && (now - lastFetchedTime < CACHE_TTL)) {
    return { domains: cachedDomains, source: 'in-memory-cache' };
  }

  try {
    const response = await fetch('https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/refs/heads/main/disposable_email_blocklist.conf');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    
    const domains = text.split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(line => line && !line.startsWith('#'));
    
    cachedDomains = new Set(domains);
    lastFetchedTime = now;
    return { domains: cachedDomains, source: 'github-raw' };
  } catch (err) {
    console.error('Failed to fetch disposable email domains from GitHub:', err);
    // If cache already has data from a previous fetch, continue using it even if expired
    if (cachedDomains) {
      return { domains: cachedDomains, source: 'expired-in-memory-cache' };
    }
    return { domains: FALLBACK_DOMAINS, source: 'static-backup' };
  }
}

// Helper to check sub-domains recursively (e.g. sub.tempmail.com -> check tempmail.com)
function isDomainDisposable(domain, disposableSet) {
  if (disposableSet.has(domain)) return true;

  const parts = domain.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length - 1; i++) {
      const parentDomain = parts.slice(i).join('.');
      if (disposableSet.has(parentDomain)) return true;
    }
  }
  return false;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email, check_dns } = req.query;

  if (!email) {
    return res.status(400).json({ 
      error: 'Email parameter is required (e.g. ?email=user@tempmail.com)' 
    });
  }

  // Basic email syntax validation regex
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
  const match = email.trim().toLowerCase().match(emailRegex);

  if (!match) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const domain = match[1];

  // 1. Fast path: check if domain is whitelisted
  if (WHITELIST_DOMAINS.has(domain)) {
    return res.status(200).json({
      success: true,
      email: cleanEmail,
      domain: domain,
      is_disposable: false,
      is_whitelisted: true,
      recommendation: 'ALLOW_REGISTRATION',
      reason: 'Legitimate email provider (whitelisted).',
      disposable_list_source: 'none',
      cached: true,
      timestamp: new Date().toISOString()
    });
  }

  // 2. Fetch/resolve disposable domains list
  const { domains: disposableSet, source: listSource } = await getDisposableDomains();
  const isDisposable = isDomainDisposable(domain, disposableSet);

  let dnsDetails = null;
  let recommendation = isDisposable ? 'REJECT_REGISTRATION' : 'ALLOW_REGISTRATION';
  let reason = isDisposable 
    ? 'Disposable email domain detected.' 
    : 'Legitimate email domain (passed verification checks).';

  // 3. Optional DNS lookup (MX check)
  if (check_dns === 'true') {
    try {
      const mxRecords = await dns.resolveMx(domain);
      const sortedMx = (mxRecords || [])
        .sort((a, b) => a.priority - b.priority)
        .map(r => r.exchange.toLowerCase());

      const hasMx = sortedMx.length > 0;
      
      dnsDetails = {
        has_mx_records: hasMx,
        mx_records: sortedMx,
        is_valid_domain: hasMx
      };

      if (!hasMx) {
        recommendation = 'REJECT_REGISTRATION';
        reason = 'Domain has no active MX records; cannot receive emails.';
      }
    } catch (err) {
      dnsDetails = {
        has_mx_records: false,
        mx_records: [],
        is_valid_domain: false,
        dns_error: err.message
      };
      recommendation = 'REJECT_REGISTRATION';
      reason = `DNS query failed: ${err.code || 'Domain does not resolve'}. Email address is likely invalid.`;
    }
  }

  return res.status(200).json({
    success: true,
    email: cleanEmail,
    domain: domain,
    is_disposable: isDisposable,
    is_whitelisted: false,
    recommendation: recommendation,
    reason: reason,
    dns_analysis: dnsDetails,
    disposable_list_source: listSource,
    cached: listSource !== 'github-raw',
    timestamp: new Date().toISOString()
  });
}
