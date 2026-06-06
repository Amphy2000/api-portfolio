import { UAParser } from 'ua-parser-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { ua } = req.query;

  // Use custom user-agent string if query is passed, otherwise fallback to request header
  const uaString = ua ? ua.trim() : req.headers['user-agent'] || '';

  if (!uaString) {
    return res.status(400).json({
      error: 'User-Agent string parameter is required (?ua=...) or request must include a User-Agent header.'
    });
  }

  try {
    const parser = new UAParser(uaString);
    const result = parser.getResult();

    const deviceType = result.device.type || null;

    // Detect bots using simple, high-accuracy regex lookup
    const isBot = /bot|spider|crawl|slurp|tracker|facebookexternalhit|whatsapp|telegrambot/i.test(uaString);

    // Convenience classification helpers
    const isMobile = deviceType === 'mobile';
    const isTablet = deviceType === 'tablet';
    const isTv = deviceType === 'smarttv';
    const isConsole = deviceType === 'console';
    
    // If it's not a mobile, tablet, TV, console, or bot, we classify it as a desktop client
    const isDesktop = !isMobile && !isTablet && !isTv && !isConsole && !isBot;

    return res.status(200).json({
      success: true,
      user_agent: uaString,
      browser: {
        name: result.browser.name || 'Unknown',
        version: result.browser.version || 'Unknown',
        major: result.browser.major || 'Unknown'
      },
      os: {
        name: result.os.name || 'Unknown',
        version: result.os.version || 'Unknown'
      },
      device: {
        vendor: result.device.vendor || 'Generic',
        model: result.device.model || 'Unknown',
        type: deviceType || (isBot ? 'bot' : 'desktop')
      },
      engine: {
        name: result.engine.name || 'Unknown',
        version: result.engine.version || 'Unknown'
      },
      cpu: {
        architecture: result.cpu.architecture || 'Unknown'
      },
      classification: {
        is_mobile: isMobile,
        is_tablet: isTablet,
        is_desktop: isDesktop,
        is_smart_tv: isTv,
        is_console: isConsole,
        is_bot: isBot
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to parse User-Agent string',
      details: err.message
    });
  }
}
