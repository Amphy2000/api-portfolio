# Password Strength & Breach Checker — Developer Integration Guide & Best Practices

Enforce secure registration gates, measure password complexity in real-time, and run zero-knowledge leak checks against 10+ billion compromised credentials. The **Password Strength & Breach Checker API** provides complexity metrics and verifies if a password was leaked in past data breaches without exposing raw passwords.

---

## 1. Architectural Overview

The API validates passwords using a local strength evaluator and queries the Have I Been Pwned database via a secure, privacy-preserving k-Anonymity protocol:

```
[ User Enters Password ]
            |
            v
[ POST Raw Password / GET Pre-hashed SHA-1 ]
            |
            v
[ Local Strength Analyzer ] ----> Evaluates uppercase/lowercase/digits/special/length
            |
            v
[ Local SHA-1 Hashing Engine ] -> Computes complete 40-char SHA-1 hex hash
            |
            v
[ k-Anonymity Range Query ] ---> Sends ONLY first 5 characters (prefix) to HIBP API
            |
            v
[ Local Suffix Matcher ] -------> Compares remaining 35 characters locally against results
            |
            v
[ Return Combined Verdict JSON ]
```

---

## 2. API Reference & Parameters

### Endpoint
`POST /password-validator` *(Highly recommended for raw passwords)*  
`GET /password-validator` *(Recommended for pre-hashed checks)*

### Request Parameters

#### Plain Text mode (`POST`)
*   **Body Type:** `application/json`
*   **Body Parameters:**
    *   `password` (String, Required): The plain text password to check.
    
#### Hash Check mode (`GET`)
*   **Query Parameters:**
    *   `hash` (String, Required): The 40-character hexadecimal SHA-1 hash of the password. (e.g. `AAF4C61DDCC5E8A2DABEDE0F3B482CD9AEA9434D` for the password `hello`).

---

## 3. Code Integration Examples

### Node.js - Secure Pre-hashed Check (GET)
Compute the SHA-1 hash locally in your application and send only the hash to the API for absolute zero-knowledge security:
```javascript
import crypto from 'crypto';

async function verifyPasswordSecurely(plainPassword) {
  // Compute SHA-1 locally
  const hash = crypto.createHash('sha1').update(plainPassword).digest('hex').toUpperCase();
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://password-strength-breach-checker.p.rapidapi.com/password-validator?hash=${hash}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'password-strength-breach-checker.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains breach_analysis: pwned: true/false, leak_count
}
```

### Python - Raw Password Check (POST)
```python
import requests

def verify_raw_password(plain_password):
    url = "https://password-strength-breach-checker.p.rapidapi.com/password-validator"
    payload = {"password": plain_password}
    headers = {
        "content-type": "application/json",
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "password-strength-breach-checker.p.rapidapi.com"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```

### cURL (POST)
```bash
curl --request POST \
	--url 'https://password-strength-breach-checker.p.rapidapi.com/password-validator' \
	--header 'content-type: application/json' \
	--header 'x-rapidapi-host: password-strength-breach-checker.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \
	--data '{"password":"password123"}'
```

---

## 4. Key Security & Compliance Guidelines

1.  **Enforcing the Data Breach Block:**
    If a password is confirmed as breached (`breach_analysis.pwned: true`), it is highly recommended to block registration and display a clear prompt:
    
    *UI Alert:* *"This password has been found in a public data leak. For your account security, please choose a different password."*
2.  **Privacy First (Zero-Knowledge):**
    If your enterprise team requires strict compliance standards, compute the SHA-1 hash inside your own server using your programming language's native cryptographic library, and send only the `hash` query parameter to the `GET` endpoint. This guarantees our API never sees or handles plain text user passwords.
3.  **Local Match Uptime Fallback:**
    If the HIBP servers are down, the API returns `pwned: null` along with a `FLAG_FOR_REVIEW` recommendation. In this case, you should fallback to checking password complexity alone (`strength_report.score >= 3`) to keep registration online.
