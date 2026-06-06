import emailHandler from './api/email-shield.js';
import ipHandler from './api/ip-lookup.js';
import scraperHandler from './api/scraper.js';
import vatHandler from './api/vat-validator.js';
import previewHandler from './api/link-preview.js';

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

  console.log("\n==================================================");
  console.log("ALL TESTS COMPLETED!");
  console.log("==================================================");
}

main().catch(console.error);
