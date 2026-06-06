# Disposable & Burner Email Shield — Developer Integration Guide & Best Practices

Prevent spam signups, bot registrations, and free-trial abuse at your application's gateway. This guide outlines how to integrate the **Disposable & Burner Email Shield API** into your user signup flow and best practices for configuration.

---

## 1. Architectural Overview

The Email Shield API runs a multi-layered check to evaluate registration quality in under a millisecond:

```
[ User Inputs Email ]
         |
         v
[ Syntax Regex Check ] ---> (Fail) ---> [ Reject Format ]
         |
         v
[ Whitelist Check ]   ---> (Match: Gmail/Outlook/etc.) ---> [ ALLOW (Instant <1ms) ]
         |
         v
[ Subdomain Analysis ] -> (Extract parent domains)
         |
         v
[ GitHub Blocklist ]  ---> (Match: 3,000+ burner domains) ---> [ REJECT ]
         |
         v
[ DNS MX Lookup ]     ---> (Optional: check active servers) -> (None) -> [ REJECT ]
         |
         v
[ ALLOW REGISTRATION ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /email-shield`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `email` | String | **Yes** | — | The email address to verify (e.g. `user@mailinator.com`). |
| `check_dns` | String | *No* | `false` | Set to `true` to run a live DNS MX lookup verifying if the domain is valid and active. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function verifyUserEmail(email) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://disposable-burner-email-shield.p.rapidapi.com/email-shield?email=${encodeURIComponent(email)}&check_dns=true`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'disposable-burner-email-shield.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // result.recommendation will be 'ALLOW_REGISTRATION' or 'REJECT_REGISTRATION'
}
```

### Python (Requests)
```python
import requests

def verify_user_email(email):
    url = "https://disposable-burner-email-shield.p.rapidapi.com/email-shield"
    querystring = {"email": email, "check_dns": "true"}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "disposable-burner-email-shield.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://disposable-burner-email-shield.p.rapidapi.com/email-shield?email=user%40tempmail.com&check_dns=true' \
	--header 'x-rapidapi-host: disposable-burner-email-shield.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Best Practices for Registration Flows

1.  **Fail-Open Fallback (Timeout Handling):**
    When checking MX records (`check_dns=true`), DNS lookups rely on external network resolution. Set a client-side timeout of **1.5 seconds**. If your server doesn't receive a response within 1.5 seconds, fail-open (allow the user to proceed) to ensure you do not block legitimate users during rare network outages.
2.  **Displaying UI Validation Feedback:**
    Instead of showing a generic error like *"Registration failed"*, display clear, helpful hints to real users who might have mistyped their email address:
    *   **Disposable Domain:** *"Temporary burner email addresses are not supported. Please register with a permanent email provider."*
    *   **Invalid Domain (MX Fail):** *"We were unable to verify your email server. Please check your domain spelling."*
3.  **Sanitize Inputs:**
    Always `.trim().toLowerCase()` the user's input before sending it to the API to maximize whitelist match rates.
