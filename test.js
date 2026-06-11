import emailHandler from './api/_email-shield.js';
import ipHandler from './api/_ip-lookup.js';
import scraperHandler from './api/_scraper.js';
import vatHandler from './api/_vat-validator.js';
import previewHandler from './api/_link-preview.js';
import dnsHandler from './api/_dns-lookup.js';
import schemaHandler from './api/_schema-extractor.js';
import passwordHandler from './api/_password-validator.js';
import uaHandler from './api/_ua-parser.js';
import exchangeRatesHandler from './api/_exchange-rates.js';
import shortenHandler from './api/_shorten.js';
import redirectHandler from './api/_redirect.js';
import fuelTrackerHandler from './api/_fuel-tracker.js';
import sslHandler from './api/_ssl-checker.js';

// Mock global fetch for schema tests
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (url === 'https://mock-schema-test.com/product') {
    return {
      ok: true,
      status: 200,
      text: async () => `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Super Coffee Maker",
                "description": "Brew the best espresso at home.",
                "brand": "EspressoCorp",
                "sku": "EC-101",
                "image": "https://example.com/coffee.jpg",
                "offers": {
                  "@type": "Offer",
                  "price": "89.99",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "reviewCount": "120"
                }
              }
            </script>
          </head>
          <body>Mock Product Page</body>
        </html>
      `
    };
  }
  if (url === 'https://mock-schema-test.com/recipe') {
    return {
      ok: true,
      status: 200,
      text: async () => `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Recipe",
                "name": "Chocolate Chip Cookies",
                "description": "Classic homemade cookies.",
                "recipeIngredient": ["2 cups flour", "1 cup chocolate chips", "1 cup sugar"],
                "recipeInstructions": [
                  { "@type": "HowToStep", "text": "Mix dry ingredients." },
                  { "@type": "HowToStep", "text": "Bake at 350F for 10 minutes." }
                ]
              }
            </script>
          </head>
          <body>Mock Recipe Page</body>
        </html>
      `
    };
  }
  return originalFetch(url, options);
};

// Helper to run email shield test
async function runEmailTest(email, checkDns = 'false') {
  const req = {
    method: 'GET',
    query: { email, check_dns: checkDns }
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await emailHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`EMAIL TEST: ${email} (check_dns=${checkDns})`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
}

// Helper to run IP lookup test
async function runIpTest(ipVal) {
  const req = {
    method: 'GET',
    query: ipVal ? { ip: ipVal } : {},
    headers: {
      'x-forwarded-for': '8.8.8.8',
      'x-real-ip': '8.8.8.8'
    },
    socket: {
      remoteAddress: '8.8.8.8'
    }
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await ipHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`IP TEST: ${ipVal || 'AUTO (Detected Client IP)'}`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
}

// Helper to run Web Scraper test
async function runScraperTest(targetUrl, mode = 'standard') {
  const req = {
    method: 'GET',
    query: { url: targetUrl, mode }
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await scraperHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`SCRAPER TEST: ${targetUrl} (mode=${mode})`);
  console.log(`STATUS: ${res.status_code}`);
  
  // Truncate markdown snippet for cleaner logging
  if (res.body && res.body.markdown) {
    const snippet = res.body.markdown.substring(0, 300) + '... [TRUNCATED]';
    console.log(`RESPONSE:`, JSON.stringify({
      ...res.body,
      markdown: snippet
    }, null, 2));
  } else {
    console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
  }
}

// Helper to run VAT Validator test
async function runVatTest(vatVal) {
  const req = {
    method: 'GET',
    query: vatVal ? { vat: vatVal } : {}
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await vatHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`VAT TEST: ${vatVal || 'MISSING_PARAM'}`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
}

// Helper to run Link Preview test
async function runPreviewTest(targetUrl) {
  const req = {
    method: 'GET',
    query: { url: targetUrl }
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await previewHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`PREVIEW TEST: ${targetUrl}`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
}

// Helper to run DNS Lookup test
async function runDnsTest(domainVal) {
  const req = {
    method: 'GET',
    query: { domain: domainVal }
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await dnsHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`DNS TEST: ${domainVal || 'MISSING_PARAM'}`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
}

// Helper to run Schema Extractor test
async function runSchemaTest(targetUrl) {
  const req = {
    method: 'GET',
    query: { url: targetUrl }
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await schemaHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`SCHEMA TEST: ${targetUrl}`);
  console.log(`STATUS: ${res.status_code}`);
  
  if (res.body && res.body.raw_schemas) {
    const rawCount = res.body.raw_schemas.length;
    console.log(`RESPONSE:`, JSON.stringify({
      ...res.body,
      raw_schemas: `[Array of ${rawCount} raw schema blocks]`
    }, null, 2));
  } else {
    console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
  }
}

// Helper to run Password Validator test
async function runPasswordTest(method, payload) {
  const req = {
    method: method,
    query: method === 'GET' ? payload : {},
    body: method === 'POST' ? payload : {}
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await passwordHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`PASSWORD TEST: Method=${method}, Payload=${JSON.stringify(payload)}`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
}

// Helper to run User-Agent Parser test
async function runUaTest(uaVal) {
  const req = {
    method: 'GET',
    query: uaVal ? { ua: uaVal } : {},
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await uaHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`UA TEST: ${uaVal || 'AUTO (Detected Client UA)'}`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
}

// Helper to run Multi-Currency & Crypto Exchange Rates test
async function runExchangeRatesTest(base, symbols) {
  const query = {};
  if (base) query.base = base;
  if (symbols) query.symbols = symbols;

  const req = {
    method: 'GET',
    query
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => {
      res.headers[name] = val;
    },
    status: (code) => {
      res.status_code = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    end: () => {
      return res;
    }
  };

  await exchangeRatesHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`EXCHANGE RATES TEST: base=${base || 'DEFAULT (USD)'}, symbols=${symbols || 'ALL'}`);
  console.log(`STATUS: ${res.status_code}`);
  
  if (res.body && res.body.rates) {
    // Only print first 5 rates to avoid spamming the log
    const keys = Object.keys(res.body.rates);
    const slicedRates = {};
    keys.slice(0, 5).forEach(k => {
      slicedRates[k] = res.body.rates[k];
    });
    console.log(`RESPONSE:`, JSON.stringify({
      ...res.body,
      rates: {
        ...slicedRates,
        ...(keys.length > 5 ? { _plus_more: `${keys.length - 5} other currencies...` } : {})
      }
    }, null, 2));
  } else {
    console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
  }
}

// Helper to run URL Shortener & Link Analytics test
async function runShortenerTests() {
  console.log(`\n----------------------------------------`);
  console.log(`URL SHORTENER & ANALYTICS TESTS`);
  
  // 1. Create short link
  const createReq = {
    method: 'POST',
    body: { url: 'https://example.com/analytics-test-target-page' },
    headers: { host: 'localhost:3000' }
  };
  const createRes = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => { createRes.headers[name] = val; },
    status: (code) => { createRes.status_code = code; return createRes; },
    json: (data) => { createRes.body = data; return createRes; }
  };

  await shortenHandler(createReq, createRes);
  console.log(`\n1. CREATE SHORT URL:`);
  console.log(`STATUS: ${createRes.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(createRes.body, null, 2));

  const slug = createRes.body?.slug;
  if (!slug) {
    console.log(`Aborting redirect/analytics tests because slug creation failed.`);
    return;
  }

  // 2. Perform redirect (click 1)
  const redirReq1 = {
    method: 'GET',
    query: { slug },
    headers: {
      'referer': 'https://twitter.com/share',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Chrome/120.0.0.0 Safari/604.1'
    }
  };
  const redirRes1 = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => { redirRes1.headers[name] = val; },
    status: (code) => { redirRes1.status_code = code; return redirRes1; },
    json: (data) => { redirRes1.body = data; return redirRes1; },
    writeHead: (code, headers) => {
      redirRes1.status_code = code;
      redirRes1.headers = { ...redirRes1.headers, ...headers };
    },
    end: () => {}
  };

  await redirectHandler(redirReq1, redirRes1);
  console.log(`\n2. REDIRECT CLICK 1 (from Twitter/iOS Safari):`);
  console.log(`STATUS: ${redirRes1.status_code}`);
  console.log(`REDIRECT LOCATION: ${redirRes1.headers.Location}`);

  // 3. Perform redirect (click 2)
  const redirReq2 = {
    method: 'GET',
    query: { slug },
    headers: {
      'referer': 'https://github.com/project',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Firefox/120.0'
    }
  };
  const redirRes2 = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => { redirRes2.headers[name] = val; },
    status: (code) => { redirRes2.status_code = code; return redirRes2; },
    json: (data) => { redirRes2.body = data; return redirRes2; },
    writeHead: (code, headers) => {
      redirRes2.status_code = code;
      redirRes2.headers = { ...redirRes2.headers, ...headers };
    },
    end: () => {}
  };

  await redirectHandler(redirReq2, redirRes2);
  console.log(`\n3. REDIRECT CLICK 2 (from GitHub/Windows Firefox):`);
  console.log(`STATUS: ${redirRes2.status_code}`);
  console.log(`REDIRECT LOCATION: ${redirRes2.headers.Location}`);

  // 4. Fetch analytics
  const statsReq = {
    method: 'GET',
    query: { slug }
  };
  const statsRes = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => { statsRes.headers[name] = val; },
    status: (code) => { statsRes.status_code = code; return statsRes; },
    json: (data) => { statsRes.body = data; return statsRes; }
  };

  await shortenHandler(statsReq, statsRes);
  console.log(`\n4. GET ANALYTICS FOR SLUG "${slug}":`);
  console.log(`STATUS: ${statsRes.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(statsRes.body, null, 2));

  // 5. Test validation errors
  const errReq = {
    method: 'POST',
    body: { url: 'not-a-valid-url' }
  };
  const errRes = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => { errRes.headers[name] = val; },
    status: (code) => { errRes.status_code = code; return errRes; },
    json: (data) => { errRes.body = data; return errRes; }
  };
  await shortenHandler(errReq, errRes);
  console.log(`\n5. CREATE WITH INVALID URL:`);
  console.log(`STATUS: ${errRes.status_code}`);
  console.log(`RESPONSE:`, JSON.stringify(errRes.body, null, 2));
}

// Helper to run Fuel Price Tracker tests
async function runFuelTest(state, type) {
  const query = {};
  if (state) query.state = state;
  if (type) query.type = type;

  const req = {
    method: 'GET',
    query
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => { res.headers[name] = val; },
    status: (code) => { res.status_code = code; return res; },
    json: (data) => { res.body = data; return res; },
    send: (data) => { res.body = data; return res; },
    end: () => { return res; }
  };

  await fuelTrackerHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`FUEL PRICE TEST: state=${state || 'NONE'}, type=${type || 'NONE'}`);
  console.log(`STATUS: ${res.status_code}`);

  if (res.body && res.body.state_averages && !state && !type) {
    // Truncate state averages to print only first 3 states to avoid massive spam
    const codes = Object.keys(res.body.state_averages);
    const slicedStates = {};
    codes.slice(0, 3).forEach(c => {
      slicedStates[c] = res.body.state_averages[c];
    });
    console.log(`RESPONSE:`, JSON.stringify({
      ...res.body,
      state_averages: {
        ...slicedStates,
        _plus_more: `${codes.length - 3} other states...`
      }
    }, null, 2));
  } else if (res.body && res.body.state_averages && type) {
    // Truncate state averages when type is requested
    const codes = Object.keys(res.body.state_averages);
    const slicedStates = {};
    codes.slice(0, 3).forEach(c => {
      slicedStates[c] = res.body.state_averages[c];
    });
    console.log(`RESPONSE:`, JSON.stringify({
      ...res.body,
      state_averages: {
        ...slicedStates,
        _plus_more: `${codes.length - 3} other states...`
      }
    }, null, 2));
  } else {
    console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
  }
}

// Helper to run SSL Certificate Checker tests
async function runSslTest(domainVal, portVal) {
  const query = {};
  if (domainVal) query.domain = domainVal;
  if (portVal) query.port = portVal;

  const req = {
    method: 'GET',
    query
  };

  const res = {
    status_code: 200,
    headers: {},
    body: null,
    setHeader: (name, val) => { res.headers[name] = val; },
    status: (code) => { res.status_code = code; return res; },
    json: (data) => { res.body = data; return res; },
    send: (data) => { res.body = data; return res; },
    end: () => { return res; }
  };

  await sslHandler(req, res);
  console.log(`\n----------------------------------------`);
  console.log(`SSL CERTIFICATE TEST: domain=${domainVal || 'NONE'}, port=${portVal || 'NONE'}`);
  console.log(`STATUS: ${res.status_code}`);
  
  if (res.body && res.body.success) {
    const chainLength = res.body.chain ? res.body.chain.length : 0;
    console.log(`RESPONSE:`, JSON.stringify({
      ...res.body,
      chain: `[Array of ${chainLength} intermediate certificates]`,
      certificate: {
        ...res.body.certificate,
        subject_alternative_names: (res.body.certificate?.subject_alternative_names || []).slice(0, 5)
      }
    }, null, 2));
  } else {
    console.log(`RESPONSE:`, JSON.stringify(res.body, null, 2));
  }
}

async function main() {
  console.log("==================================================");
  console.log("RUNNING PORTFOLIO API TEST SUITE (ES MODULES)");
  console.log("==================================================");

  // SECTION 1: EMAIL SHIELD TESTS
  console.log("\n>>> Running Email Shield tests...");
  await runEmailTest('investor@gmail.com');
  await runEmailTest('scammer@mailinator.com');
  await runEmailTest('bot@sub.temp-mail.org');
  await runEmailTest('support@google.com', 'true');
  await runEmailTest('admin@thisdomaindefinitelydoesnotexist12345.xyz', 'true');
  await runEmailTest('not-an-email');

  // SECTION 2: IP LOOKUP TESTS
  console.log("\n>>> Running IP Geolocation & VPN Detector tests...");
  await runIpTest('8.8.8.8');
  await runIpTest('1.1.1.1');
  await runIpTest('not-an-ip');
  await runIpTest(null);

  // SECTION 3: WEB SCRAPER TESTS
  console.log("\n>>> Running AI Web Scraper & Markdown Extractor tests...");
  await runScraperTest('https://example.com');
  await runScraperTest('https://example.com', 'text_only');
  await runScraperTest('not-a-valid-url');

  // SECTION 4: VAT VALIDATOR TESTS
  console.log("\n>>> Running VAT & Company Validator tests...");
  await runVatTest('IE6388047V'); // Valid Google Ireland
  await runVatTest('GR998370712'); // Greek VAT mapping
  await runVatTest('DE123456789'); // Invalid VAT
  await runVatTest('US123456789'); // Invalid country code
  await runVatTest('123456789'); // Missing country code
  await runVatTest(null); // Missing parameter

  // SECTION 5: LINK PREVIEW TESTS
  console.log("\n>>> Running Rich Link Preview & OG Extractor tests...");
  await runPreviewTest('https://example.com');
  await runPreviewTest('https://github.com');
  await runPreviewTest('not-a-valid-url');
  await runPreviewTest(null);

  // SECTION 6: DNS LOOKUP TESTS
  console.log("\n>>> Running DNS Record Lookup & Diagnostics tests...");
  await runDnsTest('gmail.com'); // Google Mail (should have SPF and DMARC config)
  await runDnsTest('https://github.com/some/path'); // GitHub URL parsing
  await runDnsTest('not-a-valid-domain-12345.xyz'); // Invalid domain
  await runDnsTest(null); // Missing parameter

  // SECTION 7: SCHEMA EXTRACTOR TESTS
  console.log("\n>>> Running Structured Schema JSON-LD Parser tests...");
  await runSchemaTest('https://mock-schema-test.com/product'); // Mock Product schema
  await runSchemaTest('https://mock-schema-test.com/recipe'); // Mock Recipe schema
  await runSchemaTest('https://example.com'); // Has no schemas
  await runSchemaTest('not-a-valid-url');
  await runSchemaTest(null);

  // SECTION 8: PASSWORD VALIDATOR TESTS
  console.log("\n>>> Running Password Strength & Breach Checker tests...");
  await runPasswordTest('POST', { password: 'password123' }); // Compromised weak
  await runPasswordTest('POST', { password: 'CorrectHorseBatteryStaple2026!' }); // Secure strong
  await runPasswordTest('GET', { hash: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d' }); // SHA-1 of 'hello' (compromised)
  await runPasswordTest('GET', { hash: 'invalid-hash' }); // Invalid format
  await runPasswordTest('GET', null); // Missing parameters

  // SECTION 9: USER-AGENT PARSER TESTS
  console.log("\n>>> Running User-Agent Parser & Device Detector tests...");
  await runUaTest('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'); // iOS Safari Mobile
  await runUaTest('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'); // Android Chrome Mobile
  await runUaTest('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'); // Googlebot
  await runUaTest(null); // Fallback to headers

  // SECTION 10: MULTI-CURRENCY & CRYPTO EXCHANGE RATES TESTS
  console.log("\n>>> Running Multi-Currency & Crypto Exchange Rates tests...");
  await runExchangeRatesTest(null, null); // Default: base=USD, all symbols
  await runExchangeRatesTest('EUR', 'USD,GBP,BTC,ETH'); // Base EUR, filtered symbols
  await runExchangeRatesTest('BTC', 'USD,EUR,GBP'); // Base Crypto, filtered symbols
  await runExchangeRatesTest('INVALID', 'USD'); // Invalid base currency
  await runExchangeRatesTest('USD', 'INVALID_SYM'); // Invalid symbols

  // SECTION 11: URL SHORTENER & LINK ANALYTICS TESTS
  await runShortenerTests();

  // SECTION 12: PROGRAMMATIC SEO FUEL PRICE TRACKER TESTS
  console.log("\n>>> Running Fuel Price Tracker tests...");
  await runFuelTest(null, null); // Default: return all averages and national averages
  await runFuelTest('TX', null); // Search by state code TX
  await runFuelTest('California', 'diesel'); // Search by state full name and type diesel
  await runFuelTest(null, 'regular'); // Filter all states by type regular
  await runFuelTest('INVALID_STATE', null); // Invalid state error handling
  await runFuelTest('NY', 'invalid_type'); // NY invalid type

  // SECTION 13: SSL CERTIFICATE CHECKER TESTS
  console.log("\n>>> Running SSL Certificate Checker tests...");
  await runSslTest('google.com', '443'); // Valid trusted domain
  await runSslTest('https://github.com/some/path'); // Valid domain extracted from URL
  await runSslTest('invalid-domain-name-12345.xyz', '443'); // Unresolvable/invalid domain
  await runSslTest('google.com', 'invalid_port'); // Invalid port format
  await runSslTest(null, null); // Missing parameter

  console.log("\n==================================================");
  console.log("ALL TESTS COMPLETED!");
  console.log("==================================================");
}

main().catch(console.error);
