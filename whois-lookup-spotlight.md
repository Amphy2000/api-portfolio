# WHOIS Domain Lookup & Ownership Checker — Developer Integration Guide & Best Practices

Retrieve registry registration status, registrar details, registration dates (creation, update, and expiration), domain status, and nameservers for any domain. The **WHOIS Domain Lookup API** executes raw TCP sockets against authoritative registry servers to fetch domain ownership metadata.

---

## 1. Architectural Overview

The API resolves domains recursively using native Node.js TCP `net` sockets:

```
[ User Inputs Domain / URL ]
              |
              v
[ Sanitizer & Normalizer ] ----> Extracts clean domain, strips subdomains/paths/protocols
              |
              v
[ Root WHOIS Query ] ----------> Connects to whois.iana.org (port 43) to find the TLD registry
              |
              v
[ Referral Server Parser ] ----> Parses the 'refer' or 'whois' server out of the IANA output
              |
              v
[ Authoritative Query ] -------> Executes TCP socket query against TLD registry server (e.g. Verisign)
              |
              v
[ WHOIS Record Parser ] -------> Normalizes text output to extract registrar, dates, status, nameservers
              |
              v
[ Standardized JSON Response ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /whois-lookup`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `domain` | String | **Yes** | — | The target domain name (e.g. `github.com`) or raw URL (e.g. `https://github.com/some/path`). |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function lookupWhois(domainName) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://domain-whois-lookup-ownership-checker.p.rapidapi.com/whois-lookup?domain=${encodeURIComponent(domainName)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'domain-whois-lookup-ownership-checker.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains registrar name, registry dates, days remaining, nameservers
}
```

### Python (Requests)
```python
import requests

def lookup_whois(domain_name):
    url = "https://domain-whois-lookup-ownership-checker.p.rapidapi.com/whois-lookup"
    querystring = {"domain": domain_name}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "domain-whois-lookup-ownership-checker.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://domain-whois-lookup-ownership-checker.p.rapidapi.com/whois-lookup?domain=github.com' \
	--header 'x-rapidapi-host: domain-whois-lookup-ownership-checker.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key WHOIS Lookup Best Practices

1.  **Checking Domain Expiration & Age:**
    Use `dates.days_remaining` to detect domains expiring soon (e.g. less than 30 days) to alert administrators. Use `dates.created` to calculate the total age of the domain, which is a major factor in spam scoring and email deliverability checks.
2.  **Tracking Domain Hijacks or DNS Changes:**
    Periodically query your critical domains and verify that the `name_servers` array match your expected values (e.g., Cloudflare, AWS, etc.). A sudden change in nameservers or registrar without authorization can signal a domain hijack.
3.  **Handling Registry Rate Limits:**
    Public WHOIS servers enforce strict rate limits on IP addresses (often 100–1000 queries per day). Because Vercel serverless worker instances share IP pools, queries might occasionally get rate-limited. We highly recommend caching WHOIS records for **24 hours** in your application to avoid hitting registry blocks.
