import emailHandler from './api/email-shield.js';
import ipHandler from './api/ip-lookup.js';

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
  // Test 2.1: Query Google Public DNS (expect Google LLC and datacenter detection)
  await runIpTest('8.8.8.8');
  
  // Test 2.2: Query Cloudflare Public DNS (expect Cloudflare ISP and datacenter detection)
  await runIpTest('1.1.1.1');

  // Test 2.3: Query invalid IP address (expect 400 Bad Request)
  await runIpTest('not-an-ip');

  // Test 2.4: Auto-detect IP (expect local lookup fallback to 8.8.8.8 because of local ip headers)
  await runIpTest(null);

  console.log("\n==================================================");
  console.log("ALL TESTS COMPLETED!");
  console.log("==================================================");
}

main().catch(console.error);
