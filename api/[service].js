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
  'fuel-prices': fuelTrackerHandler
};

export default async function handler(req, res) {
  const { service } = req.query;
  const targetHandler = handlers[service];

  if (!targetHandler) {
    return res.status(404).json({
      error: `API Service "${service || 'unknown'}" not found.`
    });
  }

  // Security Guard: Prevent developers from bypassing RapidAPI
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  const host = req.headers['host'] || '';
  const proxySecret = req.headers['x-rapidapi-proxy-secret'] || '';

  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('3000');
  
  // Verify request is from our own dashboard website
  const isFromPlayground = (referer && referer.includes(host)) || (origin && origin.includes(host));

  // Verify request is routed via RapidAPI gateway
  const expectedSecret = process.env.RAPIDAPI_PROXY_SECRET;
  const isFromRapidAPI = expectedSecret && proxySecret === expectedSecret;

  if (!isLocal && !isFromPlayground && !isFromRapidAPI) {
    return res.status(401).json({
      error: 'Direct API access is restricted.',
      message: 'To use this API in your applications, you must subscribe on RapidAPI: https://rapidapi.com/user/Amphy2000'
    });
  }

  try {
    return await targetHandler(req, res);
  } catch (err) {
    console.error(`Error executing handler for service "${service}":`, err);
    return res.status(500).json({
      error: `Internal server error executing service "${service}"`,
      details: err.message
    });
  }
}
