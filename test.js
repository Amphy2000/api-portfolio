import handler from './api/email-shield.js';

async function runTest(email, checkDns = 'false') {
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

  await handler(req, res);
  console.log(`\n========================================`);
  console.log(`INPUT: ${email} (check_dns=${checkDns})`);
  console.log(`STATUS: ${res.status_code}`);
  console.log(`RESPONSE:`);
  console.log(JSON.stringify(res.body, null, 2));
}

async function main() {
  console.log("Starting Email Shield API tests (ES Modules)...");

  // 1. Whitelist Test
  await runTest('investor@gmail.com');

  // 2. Disposable Blocklist Test
  await runTest('scammer@mailinator.com');

  // 3. Nested Subdomain Blocklist Test
  await runTest('bot@sub.temp-mail.org');

  // 4. DNS MX Check on Active Domain
  await runTest('support@google.com', 'true');

  // 5. DNS MX Check on Invalid/Fake Domain
  await runTest('admin@thisdomaindefinitelydoesnotexist12345.xyz', 'true');

  // 6. Invalid Syntax Test
  await runTest('not-an-email');
}

main().catch(console.error);
