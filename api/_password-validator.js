import crypto from 'crypto';

// Helper to evaluate password complexity and recommendations
function evaluatePassword(password) {
  const length = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  const recommendations = [];

  // 1. Length rule
  if (length >= 8) {
    score++;
  } else {
    recommendations.push('Increase length to at least 8 characters.');
  }

  // 2. Case variance rule
  if (hasUpper && hasLower) {
    score++;
  } else {
    recommendations.push('Include both uppercase and lowercase letters.');
  }

  // 3. Number rule
  if (hasNumber) {
    score++;
  } else {
    recommendations.push('Include at least one number (0-9).');
  }

  // 4. Special character rule
  if (hasSpecial) {
    score++;
  } else {
    recommendations.push('Include at least one special character (e.g. !, @, #, $, %, etc.).');
  }

  // Bonus: If password is long (14+ characters) and has at least two classes, boost score by 1
  if (length >= 14 && score < 4 && score >= 2) {
    score++;
  }

  const labels = ['VERY_WEAK', 'WEAK', 'MEDIUM', 'STRONG', 'VERY_STRONG'];
  const label = labels[score];

  return {
    score,
    strength_label: label,
    length,
    has_uppercase: hasUpper,
    has_lowercase: hasLower,
    has_number: hasNumber,
    has_special: hasSpecial,
    recommendations
  };
}

// Helper to query Have I Been Pwned using k-Anonymity
async function checkBreach(sha1Hash) {
  const prefix = sha1Hash.substring(0, 5);
  const suffix = sha1Hash.substring(5);

  const hibpUrl = `https://api.pwnedpasswords.com/range/${prefix}`;

  try {
    const response = await fetch(hibpUrl, {
      headers: {
        'User-Agent': 'Vercel-Password-Validator-API/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HIBP API responded with status ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const parts = line.split(':');
      const cleanSuffix = parts[0].trim();
      const count = parseInt(parts[1], 10) || 0;

      if (cleanSuffix === suffix) {
        return { pwned: true, leak_count: count };
      }
    }

    return { pwned: false, leak_count: 0 };
  } catch (err) {
    console.error('Failed to query Have I Been Pwned API:', err);
    return { pwned: null, error: err.message };
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let plainPassword = null;
  let sha1Hash = null;

  // 1. Check for Pre-hashed Mode (GET with ?hash=...)
  if (req.method === 'GET' && req.query?.hash) {
    const rawHash = req.query.hash.trim().toUpperCase();
    // Validate SHA-1 format (40 hexadecimal characters)
    if (!/^[0-9A-F]{40}$/.test(rawHash)) {
      return res.status(400).json({
        error: 'Invalid hash format. Must be a 40-character hexadecimal SHA-1 string.'
      });
    }
    sha1Hash = rawHash;
  }
  // 2. Check for Plain Text in Query (GET with ?password=...)
  else if (req.method === 'GET' && req.query?.password) {
    plainPassword = req.query.password;
  }
  // 3. Check for Plain Text in JSON Body (POST)
  else if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // Fallback or ignore
      }
    }
    plainPassword = body?.password || null;
  }

  // If we couldn't resolve a password or a hash, fail
  if (!plainPassword && !sha1Hash) {
    return res.status(400).json({
      error: 'Please provide either a "password" parameter (plain text via POST body or GET query) or a "hash" parameter (SHA-1 via GET query).'
    });
  }

  // 4. Calculate SHA-1 locally if plain text was supplied
  if (plainPassword) {
    sha1Hash = crypto
      .createHash('sha1')
      .update(plainPassword)
      .digest('hex')
      .toUpperCase();
  }

  // 5. Query HIBP database using secure prefix range lookup
  const breachResult = await checkBreach(sha1Hash);

  // 6. Format Response
  const isPwned = breachResult.pwned === true;
  let threatLevel = 'safe';
  let recommendation = 'ALLOW_REGISTRATION';
  let reason = 'Password is secure and has not been detected in any known data breaches.';

  if (isPwned) {
    threatLevel = breachResult.leak_count > 100 ? 'high' : 'medium';
    recommendation = 'REJECT_REGISTRATION';
    reason = `Password has been compromised in data breaches. It was leaked ${breachResult.leak_count.toLocaleString()} times.`;
  } else if (breachResult.pwned === null) {
    threatLevel = 'unknown';
    recommendation = 'FLAG_FOR_REVIEW';
    reason = `Unable to verify data breach status: ${breachResult.error}. Password complexity was verified.`;
  }

  const responseJson = {
    success: true,
    mode: plainPassword ? 'plain_text' : 'sha1_hash',
    breach_analysis: {
      pwned: isPwned,
      leak_count: breachResult.leak_count || 0,
      threat_level: threatLevel,
      recommendation,
      reason
    },
    sha1_hash: sha1Hash,
    timestamp: new Date().toISOString()
  };

  // Only append complexity report if we have the raw password (not in hash mode)
  if (plainPassword) {
    responseJson.strength_report = evaluatePassword(plainPassword);
  }

  return res.status(200).json(responseJson);
}
