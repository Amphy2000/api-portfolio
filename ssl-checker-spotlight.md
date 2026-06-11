# SSL Certificate Validity Checker — Developer Integration Guide & Best Practices

Check the status, validity, days remaining, cipher settings, and full CA chain of any host's SSL/TLS certificate in real-time. The **SSL Certificate Validity Checker API** enables developers and monitoring scripts to audit certificates programmatically over TLS connections.

---

## 1. Architectural Overview

The API initiates a secure handshake using Node.js's native `tls` layer directly from Vercel edge/serverless worker instances:

```
[ User Inputs Domain & Port ]
              |
              v
[ Sanitizer & Normalizer ] ----> Resolves raw protocol details, cleans URL paths
              |
              v
[ TLS Handshake Socket ] ------> Connects with SNI enabled & rejectUnauthorized: false
              |
              v
[ Cert Info Extraction ] -------> Reads Peer Certificate, cipher attributes, TLS version
              |
              v
[ Date & Expiry Processor ] ----> Computes days remaining and expiration indicators
              |
              v
[ Chain Iteration Loop ] -------> Recursively traverses intermediate parent CAs
              |
              v
[ Standardized JSON Response ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /ssl-checker`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `domain` | String | **Yes** | — | The target domain name (e.g. `google.com`), raw URL (e.g. `https://google.com/about`), or IPv4 host. |
| `port` | Number | No | `443` | The SSL port to query (must be a valid integer between 1 and 65535). |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function checkSslCertificate(domainName, portNumber = 443) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://ssl-certificate-validity-checker.p.rapidapi.com/ssl-checker?domain=${encodeURIComponent(domainName)}&port=${portNumber}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'ssl-certificate-validity-checker.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains certificate validity, days remaining, cipher, and CA chain
}
```

### Python (Requests)
```python
import requests

def check_ssl_certificate(domain_name, port_number=443):
    url = "https://ssl-certificate-validity-checker.p.rapidapi.com/ssl-checker"
    querystring = {"domain": domain_name, "port": str(port_number)}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "ssl-certificate-validity-checker.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://ssl-certificate-validity-checker.p.rapidapi.com/ssl-checker?domain=google.com&port=443' \
	--header 'x-rapidapi-host: ssl-certificate-validity-checker.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Best Practices for SSL Auditing

1. **Uptime & SSL Expiration Alerts:**
   Configure a recurring cron task (e.g. daily) to query the domain of your servers. Check the `certificate.days_remaining` property. If it is less than **14 days**, trigger an alert (email, Slack, Webhook) to remind your operations team to renew.
2. **Accepting Self-Signed Certificates during Inspections:**
   The API returns `authorized: false` and the specific verification error (e.g. `UNABLE_TO_VERIFY_LEAF_SIGNATURE`) for untrusted/self-signed certs, but still returns the complete certificate properties. This allows you to audit internal dev/sandbox certificates that aren't signed by a public Root CA.
3. **Tracking Intermediate Certificate Chains:**
   The `chain` array lists intermediate certificate authority details recursively. This is useful for auditing whether your servers are serving the complete certificate chain (omitting intermediates can cause trust errors on mobile devices or specific web browsers).
