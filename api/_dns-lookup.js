import { promises as dns } from 'dns';

// Safe DNS resolver wrapper to catch ENODATA/ENOTFOUND errors gracefully
async function safeResolve(resolveFn, hostname) {
  try {
    return await resolveFn(hostname);
  } catch (err) {
    // Return empty array for missing records or unresolved hostnames
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND' || err.code === 'EREFUSED') {
      return [];
    }
    // Log other unexpected errors but return null to keep API robust
    console.error(`DNS resolve error for ${hostname}:`, err);
    return null;
  }
}

// Clean and extract a valid hostname from URL or raw input
function extractHostname(input) {
  let cleaned = input.trim().toLowerCase();

  // Prepend protocol if missing so URL constructor can parse paths/ports
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    let host = parsed.hostname;
    
    // Remove brackets for IPv6 hosts if resolved as URLs (unlikely in DNS inputs)
    host = host.replace(/[\[\]]/g, '');
    
    return host;
  } catch (err) {
    return null;
  }
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
      error: 'Domain parameter is required (e.g. ?domain=google.com)'
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
    // Resolve DNS records in parallel for low latency
    const [
      aRecords,
      aaaaRecords,
      mxRecords,
      txtRecords,
      nsRecords,
      cnameRecords,
      dmarcTxtRecords
    ] = await Promise.all([
      safeResolve(dns.resolve4, hostname),                      // A (IPv4)
      safeResolve(dns.resolve6, hostname),                      // AAAA (IPv6)
      safeResolve(dns.resolveMx, hostname),                     // MX
      safeResolve(dns.resolveTxt, hostname),                    // TXT
      safeResolve(dns.resolveNs, hostname),                     // NS
      safeResolve(dns.resolveCname, hostname),                  // CNAME
      safeResolve(dns.resolveTxt, `_dmarc.${hostname}`)         // DMARC TXT
    ]);

    // 1. Analyze SPF Records
    let spfRecord = null;
    let spfPolicy = 'none';
    let spfIncludes = [];

    if (Array.isArray(txtRecords)) {
      for (const record of txtRecords) {
        const fullRecord = record.join('');
        if (fullRecord.startsWith('v=spf1')) {
          spfRecord = fullRecord;
          
          // Determine SPF policy
          if (fullRecord.includes('-all')) spfPolicy = 'hardfail';
          else if (fullRecord.includes('~all')) spfPolicy = 'softfail';
          else if (fullRecord.includes('?all')) spfPolicy = 'neutral';
          else if (fullRecord.includes('+all')) spfPolicy = 'pass';

          // Extract includes
          const matches = fullRecord.match(/include:[^\s]+/g);
          if (matches) {
            spfIncludes = matches.map(inc => inc.substring(8));
          }
          break;
        }
      }
    }

    // 2. Analyze DMARC Records
    let dmarcRecord = null;
    let dmarcPolicy = 'none';
    let dmarcRua = null;

    if (Array.isArray(dmarcTxtRecords)) {
      for (const record of dmarcTxtRecords) {
        const fullRecord = record.join('');
        if (fullRecord.startsWith('v=DMARC1')) {
          dmarcRecord = fullRecord;

          // Extract policy parameter (p=none, quarantine, reject)
          const pMatch = fullRecord.match(/p=([^;\s]+)/);
          if (pMatch) {
            dmarcPolicy = pMatch[1].toLowerCase();
          }

          // Extract reporting URI (rua=mailto:...)
          const ruaMatch = fullRecord.match(/rua=mailto:([^;\s]+)/);
          if (ruaMatch) {
            dmarcRua = ruaMatch[1];
          }
          break;
        }
      }
    }

    return res.status(200).json({
      success: true,
      domain: hostname,
      records: {
        A: aRecords || [],
        AAAA: aaaaRecords || [],
        MX: mxRecords ? mxRecords.map(r => ({ exchange: r.exchange.toLowerCase(), priority: r.priority })) : [],
        TXT: txtRecords ? txtRecords.map(r => r.join('')) : [],
        NS: nsRecords ? nsRecords.map(n => n.toLowerCase()) : [],
        CNAME: cnameRecords ? cnameRecords.map(c => c.toLowerCase()) : []
      },
      diagnostics: {
        email_security: {
          spf: {
            configured: spfRecord !== null,
            raw: spfRecord,
            policy: spfPolicy,
            includes: spfIncludes
          },
          dmarc: {
            configured: dmarcRecord !== null,
            raw: dmarcRecord,
            policy: dmarcPolicy,
            rua: dmarcRua
          },
          is_fully_secure: (spfRecord !== null && dmarcRecord !== null && dmarcPolicy !== 'none')
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to run DNS diagnostics lookup',
      details: err.message
    });
  }
}
