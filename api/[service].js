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
  'health': healthHandler
};

export default async function handler(req, res) {
  const { service } = req.query;
  const targetHandler = handlers[service];

  if (!targetHandler) {
    return res.status(404).json({
      error: `API Service "${service || 'unknown'}" not found.`
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
