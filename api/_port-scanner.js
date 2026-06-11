import net from 'net';
import dns from 'dns';

// Helper to extract hostname from URL or string
function extractHostname(hostStr) {
  let host = hostStr.trim();
  if (host.includes('://')) {
    try {
      const parsed = new URL(host);
      host = parsed.hostname;
    } catch (e) {
      host = host.split('://')[1].split('/')[0].split(':')[0];
    }
  } else {
    host = host.split('/')[0].split(':')[0];
  }
  return host;
}

// SSRF prevention: Check if IPv4 address is private or local
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;

  // 10.0.0.0/8 (Private Class A)
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 (Private Class B)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 (Private Class C)
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 169.254.0.0/16 (Link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0/8 (Broadcast/Local)
  if (parts[0] === 0) return true;

  return false;
}

// SSRF prevention: Check if IPv6 address is private or local
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase().trim();
  if (normalized === '::1' || normalized === '::') return true;
  if (
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fe90:') ||
    normalized.startsWith('fea0:') ||
    normalized.startsWith('feb0:')
  ) {
    return true;
  }
  if (normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) return true;
  return false;
}

const COMMON_SERVICES = {
  21: { name: 'ftp', desc: 'File Transfer Protocol' },
  22: { name: 'ssh', desc: 'Secure Shell' },
  23: { name: 'telnet', desc: 'Telnet (unencrypted text)' },
  25: { name: 'smtp', desc: 'Simple Mail Transfer Protocol' },
  53: { name: 'dns', desc: 'Domain Name System' },
  80: { name: 'http', desc: 'Hypertext Transfer Protocol' },
  110: { name: 'pop3', desc: 'Post Office Protocol v3' },
  143: { name: 'imap', desc: 'Internet Message Access Protocol' },
  443: { name: 'https', desc: 'Hypertext Transfer Protocol Secure' },
  465: { name: 'smtps', desc: 'Simple Mail Transfer Protocol Secure' },
  587: { name: 'smtp-submission', desc: 'SMTP Message Submission' },
  993: { name: 'imaps', desc: 'Internet Message Access Protocol Secure' },
  995: { name: 'pop3s', desc: 'Post Office Protocol v3 Secure' },
  3306: { name: 'mysql', desc: 'MySQL Database Server' },
  3389: { name: 'rdp', desc: 'Remote Desktop Protocol' },
  5432: { name: 'postgres', desc: 'PostgreSQL Database Server' },
  8080: { name: 'http-proxy', desc: 'HTTP Alternate / Web Proxy' }
};

const DEFAULT_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3389, 8080];

function checkPort(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = 'closed';
    let banner = null;
    let completed = false;

    socket.setTimeout(timeout);

    socket.once('connect', () => {
      status = 'open';
      // If we connected, wait a tiny bit to check for banner data (e.g. SSH, SMTP).
      socket.setTimeout(250);
    });

    socket.on('data', (data) => {
      banner = data.toString('utf8').trim().substring(0, 128);
      cleanup();
    });

    socket.on('timeout', () => {
      if (status === 'open') {
        cleanup();
      } else {
        status = 'filtered';
        cleanup();
      }
    });

    socket.on('error', () => {
      status = 'closed';
      cleanup();
    });

    function cleanup() {
      if (completed) return;
      completed = true;
      try {
        socket.destroy();
      } catch (e) {}

      const serviceInfo = COMMON_SERVICES[port] || { name: 'unknown', desc: 'Unknown Service' };
      resolve({
        port,
        status,
        service: serviceInfo.name,
        description: serviceInfo.desc,
        banner: banner || null
      });
    }

    try {
      socket.connect(port, host);
    } catch (err) {
      status = 'closed';
      cleanup();
    }
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { host, ports, timeout: queryTimeout } = req.query;

  if (!host) {
    return res.status(400).json({
      error: 'Host parameter is required (e.g. ?host=google.com)'
    });
  }

  const cleanHost = extractHostname(host);
  if (!cleanHost) {
    return res.status(400).json({
      error: 'Invalid target host format.'
    });
  }

  // Resolve hostname to IP address
  let targetIp = null;
  try {
    const lookup = await dns.promises.lookup(cleanHost);
    targetIp = lookup.address;
  } catch (err) {
    return res.status(400).json({
      error: `Could not resolve host "${cleanHost}": ${err.message}`
    });
  }

  // SSRF Protection: Block local and private addresses
  const isIPv6 = targetIp.includes(':');
  const isPrivate = isIPv6 ? isPrivateIPv6(targetIp) : isPrivateIPv4(targetIp);

  if (isPrivate) {
    return res.status(400).json({
      error: 'Access restricted',
      message: 'Scanning local or private network addresses is not allowed.'
    });
  }

  // Parse ports parameter
  let portsToScan = DEFAULT_PORTS;
  if (ports) {
    portsToScan = ports
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p !== '')
      .map(Number)
      .filter((p) => !isNaN(p) && p >= 1 && p <= 65535);

    portsToScan = [...new Set(portsToScan)];

    if (portsToScan.length === 0) {
      return res.status(400).json({
        error: 'Invalid ports parameter. Please provide a comma-separated list of integers between 1 and 65535.'
      });
    }

    if (portsToScan.length > 20) {
      return res.status(400).json({
        error: 'Port scan limit exceeded. You can scan up to 20 ports per request.'
      });
    }
  }

  // Parse timeout parameter
  let timeout = 1000;
  if (queryTimeout) {
    const parsedTimeout = Number(queryTimeout);
    if (!isNaN(parsedTimeout) && parsedTimeout >= 200 && parsedTimeout <= 3000) {
      timeout = parsedTimeout;
    }
  }

  const startTime = Date.now();

  try {
    // Run all scans in parallel
    const scanResults = await Promise.all(
      portsToScan.map((port) => checkPort(targetIp, port, timeout))
    );

    const scanDurationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      target: {
        host: cleanHost,
        ip: targetIp,
        family: isIPv6 ? 'IPv6' : 'IPv4'
      },
      ports: scanResults,
      scan_duration_ms: scanDurationMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Scan execution failed',
      details: err.message
    });
  }
}
