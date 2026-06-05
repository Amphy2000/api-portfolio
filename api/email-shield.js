// A built-in list of the most common disposable email domains to start.
// You can easily connect this to a database like Supabase as your list grows.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'sharklasers.com',
  'dispostable.com', 'yopmail.com', '10minutemail.com', 'trashmail.com',
  'getairmail.com', 'maildrop.cc', 'temp-mail.org', 'mailnesia.com',
  'mintemail.com', 'generator.email', 'disposable.com', 'throwawaymail.com',
  'tempmailaddress.com', 'burnermail.io', 'guerrillamailblock.com', 'guerrillamail.de'
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required (e.g. ?email=user@tempmail.com)' });
  }

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
  const match = email.trim().toLowerCase().match(emailRegex);

  if (!match) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const domain = match[1];
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  return res.status(200).json({
    success: true,
    email: email.trim().toLowerCase(),
    domain: domain,
    is_disposable: isDisposable,
    recommendation: isDisposable ? 'REJECT_REGISTRATION' : 'ALLOW_REGISTRATION',
    timestamp: new Date().toISOString()
  });
}
