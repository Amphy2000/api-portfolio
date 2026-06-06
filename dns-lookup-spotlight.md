# DNS Record Lookup & Domain Diagnostics — Developer Integration Guide & Best Practices

Resolve standard DNS records, verify SPF/DMARC configurations, and validate domain setups in real-time. The **DNS Record Lookup & Domain Diagnostics API** lets you query all key DNS records (A, AAAA, MX, TXT, NS, CNAME) in a single fast request and parses domain email security status.

---

## 1. Architectural Overview

The API processes DNS lookups in parallel directly from Vercel's edge network using native system resolvers:

```
[ User Inputs Domain / URL ]
             |
             v
[ Sanitizer & Normalizer ] ---> Auto-extracts hostname (strips paths & protocols)
             |
             v
[ Parallel DNS Lookups ] -----> Executes Promises concurrently: A, AAAA, MX, TXT, NS, CNAME
             |
             v
[ DMARC Lookup Query ] -------> Queries TXT records specifically for _dmarc.domain
             |
             v
[ Security Record Analyzer ] --> Parses SPF & DMARC configurations to check policy strength
             |
             v
[ Standardized JSON Response ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /dns-lookup`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `domain` | String | **Yes** | — | The target domain name (e.g. `github.com`) or full URL (e.g. `https://github.com/about`). The API automatically sanitizes paths to extract the clean host. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function lookupDns(domainName) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://dns-record-lookup-diagnostics.p.rapidapi.com/dns-lookup?domain=${encodeURIComponent(domainName)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'dns-record-lookup-diagnostics.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains raw records and email security diagnostics
}
```

### Python (Requests)
```python
import requests

def lookup_dns(domain_name):
    url = "https://dns-record-lookup-diagnostics.p.rapidapi.com/dns-lookup"
    querystring = {"domain": domain_name}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "dns-record-lookup-diagnostics.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://dns-record-lookup-diagnostics.p.rapidapi.com/dns-lookup?domain=github.com' \
	--header 'x-rapidapi-host: dns-record-lookup-diagnostics.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Domain Diagnostics Best Practices

1.  **Domain Verification Wizards:**
    If you are building a domain verification UI (e.g. checking if a user added `CNAME` or `TXT` records to point to your service):
    *   Query this API and match the resolved records against your required verification values.
    *   If a match is found, update the configuration state. If not, present the user with the current records returned by the API so they can troubleshoot.
2.  **Evaluating Email Delivery Security:**
    The `diagnostics.email_security` object helps evaluate domain email health:
    *   **SPF (`spf.configured`):** Check if an SPF record is active. Ensure the policy is either `softfail` (`~all`) or `hardfail` (`-all`) for protection.
    *   **DMARC (`dmarc.configured`):** Check if a DMARC policy is active. A domain is considered `is_fully_secure: true` only when both SPF and DMARC are configured and the DMARC policy is either `quarantine` or `reject` (rather than `none`).
3.  **Low Latency lookup caching:**
    DNS lookups bypass slow HTTP connections and usually resolve in under 10ms. Because DNS propagation can take time, we recommend checking without caching on your side during setup wizard screens, but caching results for **1 hour** during passive diagnostics checks.
