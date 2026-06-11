import emailHandler from './_email-shield.js';
import ipHandler from './_ip-lookup.js';
import scraperHandler from './_scraper.js';
import vatHandler from './_vat-validator.js';
import previewHandler from './_link-preview.js';
import dnsHandler from './_dns-lookup.js';
import schemaHandler from './_schema-extractor.js';
import passwordHandler from './_password-validator.js';
import uaHandler from './_ua-parser.js';
import exchangeRatesHandler from './_exchange-rates.js';
import shortenHandler from './_shorten.js';
import redirectHandler from './_redirect.js';
import barcodeHandler from './_barcode.js';
import healthHandler from './_health.js';
import fuelTrackerHandler from './_fuel-tracker.js';
import sslHandler from './_ssl-checker.js';

const handlers = {
  'email-shield': emailHandler,
  'ip-lookup': ipHandler,
  'scraper': scraperHandler,
  'vat-validator': vatHandler,
  'link-preview': previewHandler,
  'dns-lookup': dnsHandler,
  'schema-extractor': schemaHandler,
  'password-validator': passwordHandler,
  'ua-parser': uaHandler,
  'exchange-rates': exchangeRatesHandler,
  'shorten': shortenHandler,
  'redirect': redirectHandler,
  'barcode': barcodeHandler,
  'health': healthHandler,
  'fuel-prices': fuelTrackerHandler,
  'ssl-checker': sslHandler
};

// In-memory rate limiting for playground traffic
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_PLAYGROUND_REQUESTS_PER_MINUTE = 20;

function isRateLimited(ip) {
  const now = Date.now();
  
  // Prevent memory leaks
  if (rateLimitCache.size > 10000) {
    rateLimitCache.clear();
  }

  const userData = rateLimitCache.get(ip);
  if (!userData) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return false;
  }

  userData.count++;
  return userData.count > MAX_PLAYGROUND_REQUESTS_PER_MINUTE;
}

export default async function handler(req, res) {
  const { service } = req.query;
  const cleanService = (service || '').trim().toLowerCase().replace(/\/$/, '');
  const targetHandler = handlers[cleanService];

  if (!targetHandler) {
    return res.status(404).json({
      error: `API Service "${service || 'unknown'}" not found.`
    });
  }

  // Security Guard: Prevent developers from bypassing RapidAPI
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  const host = req.headers['host'] || '';
  const proxySecret = req.headers['x-rapidapi-proxy-secret'] || req.headers['x-amphy-secret'] || '';

  const incomingRapidSecret = req.headers['x-rapidapi-proxy-secret'] || '';
  const incomingCustomSecret = req.headers['x-amphy-secret'] || '';

  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('3000');
  
  // Verify request is from our own dashboard website
  const isFromPlayground = (referer && referer.includes(host)) || (origin && origin.includes(host));

  // Verify request is routed via RapidAPI gateway (supports single secret or comma-separated list of secrets)
  const expectedSecrets = process.env.RAPIDAPI_PROXY_SECRET
    ? process.env.RAPIDAPI_PROXY_SECRET.split(',').map(s => s.trim())
    : [];
  const isFromRapidAPI = expectedSecrets.length > 0 && 
    (expectedSecrets.includes(incomingRapidSecret) || expectedSecrets.includes(incomingCustomSecret));

  // Protect against referer spoofing in scripts
  if (isFromPlayground && !isLocal && !isFromRapidAPI) {
    const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown';
    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the playground test limit of 20 requests per minute. To use this API in production, please subscribe on RapidAPI.'
      });
    }
  }

  if (!isLocal && !isFromPlayground && !isFromRapidAPI && cleanService !== 'health') {
    if (req.query?.debug === 'true' || req.headers['debug'] === 'true') {
      return res.status(401).json({
        error: 'Direct API access is restricted.',
        debug_diagnostics: {
          incoming_headers: req.headers,
          detected_proxy_secret: incomingCustomSecret || incomingRapidSecret,
          expected_secrets_list: expectedSecrets,
          env_raw_value: process.env.RAPIDAPI_PROXY_SECRET ? `${process.env.RAPIDAPI_PROXY_SECRET.substring(0, 4)}...` : 'not_set',
          match_success: isFromRapidAPI,
          is_local: isLocal,
          is_from_playground: isFromPlayground
        }
      });
    }
    return res.status(401).json({
      error: 'Direct API access is restricted.',
      message: 'To use this API in your applications, you must subscribe on RapidAPI: https://rapidapi.com/user/Amphy2000'
    });
  }

  try {
    return await targetHandler(req, res);
  } catch (err) {
    console.error(`Error executing handler for service "${cleanService}":`, err);
    return res.status(500).json({
      error: `Internal server error executing service "${cleanService}"`,
      details: err.message
    });
  }
}
