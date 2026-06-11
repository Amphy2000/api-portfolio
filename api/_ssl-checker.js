import tls from 'tls';
import { URL } from 'url';

// Clean and extract hostname from raw input (URLs, IPs, etc.)
function extractHostname(input) {
  let cleaned = input.trim().toLowerCase();

  // Prepend protocol if missing so URL constructor can parse it properly
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    return parsed.hostname;
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

  const { domain, port } = req.query;

  if (!domain) {
    return res.status(400).json({
      error: 'Domain parameter is required (e.g. ?domain=google.com)'
    });
  }

  const hostname = extractHostname(domain);
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/i;
  // Support IPv4 or domain formats
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

  if (!hostname || (!domainRegex.test(hostname) && !ipRegex.test(hostname))) {
    return res.status(400).json({
      error: 'Invalid domain name, URL, or IP address format.'
    });
  }

  const targetPort = parseInt(port, 10) || 443;
  if (targetPort < 1 || targetPort > 65535) {
    return res.status(400).json({
      error: 'Invalid port number (must be between 1 and 65535).'
    });
  }

  // Run the SSL connection
  try {
    const certDetails = await getSSLCertificate(hostname, targetPort);
    return res.status(200).json(certDetails);
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to retrieve SSL/TLS certificate details',
      details: err.message
    });
  }
}

function getSSLCertificate(hostname, port) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const socket = tls.connect({
      host: hostname,
      port: port,
      servername: hostname, // Enables Server Name Indication (SNI)
      rejectUnauthorized: false // Retrieve cert info even if it is expired or untrusted
    }, () => {
      if (resolved) return;
      resolved = true;

      const cert = socket.getPeerCertificate(true); // true includes full chain

      if (!cert || Object.keys(cert).length === 0) {
        socket.destroy();
        reject(new Error('No certificate details returned by the server.'));
        return;
      }

      // Check validation authorization status
      const authorized = socket.authorized;
      const authorizationError = socket.authorizationError;

      // Extract protocol details
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();

      socket.destroy();

      // Parse dates
      const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
      const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
      const now = new Date();

      let daysRemaining = null;
      if (validTo) {
        const diffTime = validTo.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const isExpired = daysRemaining !== null && daysRemaining <= 0;

      // Parse SAN (Subject Alternative Names)
      let sans = [];
      if (cert.subjectaltname) {
        sans = cert.subjectaltname
          .split(',')
          .map(s => s.trim().replace(/^DNS:/, ''))
          .filter(Boolean);
      }

      // Construct raw certificate details
      const response = {
        success: true,
        domain: hostname,
        port: port,
        authorized: authorized,
        error: authorized ? null : authorizationError || 'Verification failed',
        valid: authorized && !isExpired,
        protocol: protocol,
        cipher: cipher ? { name: cipher.name, version: cipher.version } : null,
        certificate: {
          subject: {
            common_name: cert.subject?.CN || null,
            organization: cert.subject?.O || null,
            organizational_unit: cert.subject?.OU || null,
            country: cert.subject?.C || null,
            locality: cert.subject?.L || null,
            state: cert.subject?.S || null
          },
          issuer: {
            common_name: cert.issuer?.CN || null,
            organization: cert.issuer?.O || null,
            country: cert.issuer?.C || null
          },
          valid_from: validFrom ? validFrom.toISOString() : null,
          valid_to: validTo ? validTo.toISOString() : null,
          days_remaining: daysRemaining,
          is_expired: isExpired,
          serial_number: cert.serialNumber || null,
          fingerprint: cert.fingerprint || null,
          fingerprint256: cert.fingerprint256 || null,
          subject_alternative_names: sans
        },
        timestamp: now.toISOString()
      };

      // Construct certificate chain summaries (if any)
      if (cert.issuerCertificate) {
        const chain = [];
        let currentCert = cert.issuerCertificate;
        // Limit chain depth to prevent infinite loops (e.g. self-signed recursive links)
        let depth = 0;
        while (currentCert && depth < 10) {
          chain.push({
            subject: {
              common_name: currentCert.subject?.CN || null,
              organization: currentCert.O || null,
              country: currentCert.C || null
            },
            issuer: {
              common_name: currentCert.issuer?.CN || null,
              organization: currentCert.issuer?.O || null
            },
            valid_to: currentCert.valid_to ? new Date(currentCert.valid_to).toISOString() : null
          });
          // Check if parent certificate points back to itself
          if (currentCert.issuerCertificate === currentCert) break;
          currentCert = currentCert.issuerCertificate;
          depth++;
        }
        response.chain = chain;
      } else {
        response.chain = [];
      }

      resolve(response);
    });

    // Handle connection error
    socket.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      reject(err);
    });

    // Set timeout to avoid hanging connections
    socket.setTimeout(6000);
    socket.on('timeout', () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      reject(new Error('Connection timed out. Target host did not respond within 6 seconds.'));
    });
  });
}
