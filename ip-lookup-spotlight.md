# IP Geolocation & VPN/Proxy Detector — Developer Integration Guide & Best Practices

Analyze visitor traffic quality, secure checks, target localized content, and prevent fraud. The **IP Geolocation & VPN/Proxy Detector API** resolves any IP address (IPv4 or IPv6) in real-time, providing comprehensive geographic coordinates, ISP details, and a high-accuracy security threat score.

---

## 1. Architectural Overview

The API processes lookups through a cached, self-healing network chain designed for high availability:

```
[ User Inputs IP / Auto-detects ]
               |
               v
[ Syntax Regex Check (IPv4 / IPv6) ] -> (Invalid) -> [ Return 400 Bad Request ]
               |
               v
[ Check In-Memory Cache (10m TTL) ] ---> (Hit) ----> [ Return Location & Security ]
               |
               v
[ Tor Exit Node Check (1h TTL Cache) ] -> (Match) --> [ Threat: HIGH / Recommendation: BLOCK ]
               |
               v
[ Fallback IP Lookup APIs Chain ]
  1. ip-api.com  (Primary)
  2. ipapi.co    (Secondary)
  3. ipinfo.io   (Tertiary)
               |
               v
[ ASN Heuristic Scanner ] -------------> (Match Datacenter ISP) -> [ Threat: MEDIUM / FLAG_FOR_REVIEW ]
               |
               v
[ Return Location & Security JSON ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /ip-lookup`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ip` | String | *No* | *Auto-detected* | The target IPv4 or IPv6 address (e.g. `8.8.8.8`). If omitted, the API automatically detects the caller's IP address. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function lookupIP(ipAddress) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://ip-geolocation-vpn-proxy-shield.p.rapidapi.com/ip-lookup?ip=${encodeURIComponent(ipAddress)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'ip-geolocation-vpn-proxy-shield.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result;
}
```

### Python (Requests)
```python
import requests

def lookup_ip(ip_address):
    url = "https://ip-geolocation-vpn-proxy-shield.p.rapidapi.com/ip-lookup"
    querystring = {"ip": ip_address}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "ip-geolocation-vpn-proxy-shield.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://ip-geolocation-vpn-proxy-shield.p.rapidapi.com/ip-lookup?ip=8.8.8.8' \
	--header 'x-rapidapi-host: ip-geolocation-vpn-proxy-shield.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Security & Fraud Indicators

The API evaluates the risk profile of each IP address under the `security` property:

1.  **Tor Exit Node (`is_tor: true`):**
    *   **Threat Level:** `high`
    *   **Action:** `BLOCK_ACCESS`
    *   **Description:** Public exit nodes are strictly used for anonymizing traffic. This is highly indicative of bots, automated scraping, or users attempting to bypass identity checks.
2.  **Commercial Datacenter (`is_datacenter: true`):**
    *   **Threat Level:** `medium`
    *   **Action:** `FLAG_FOR_REVIEW`
    *   **Description:** The IP address resolves to a data center ASN (like Amazon Web Services, Google Cloud, DigitalOcean, Linode, OVH, etc.) rather than a residential ISP (like Comcast or AT&T). This signals that the client is running a server bot, web crawler, proxy, or VPN.
