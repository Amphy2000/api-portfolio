# User-Agent Parser & Device Detector — Developer Integration Guide & Best Practices

Parse, analyze, and classify any HTTP User-Agent string. The **User-Agent Parser & Device Detector API** extracts detailed information about the client's browser, operating system, hardware device, rendering engine, and CPU architecture, alongside pre-calculated helper flags for quick classification (mobile, tablet, desktop, bot, etc.).

---

## 1. Architectural Overview

The API processes incoming User-Agent strings, runs parser heuristics, checks bot patterns, and normalizes the client profile:

```
[ Incoming Request ]
         |
         +---> Query Parameter `?ua=...` present?
         |          |
         |          +---> (Yes) -> Use custom UA string
         |          +---> (No)  -> Fallback to `User-Agent` HTTP header
         v
[ UAParser Engine ] --------> Extract Browser (Name, Version, Major)
         |
         +------------------> Extract OS (Name, Version)
         |
         +------------------> Extract Device (Vendor, Model, Type)
         |
         +------------------> Extract Engine & CPU Details
         v
[ Bot Regex Matcher ] ------> Match against crawler/spider signatures (is_bot)
         |
         v
[ Classification Helper ] --> Calculate device categories (is_mobile, is_tablet, etc.)
         |
         v
[ Standardized JSON Response ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /ua-parser`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ua` | String | No | *(Request Header)* | The User-Agent string to parse. If omitted, the API automatically falls back to parsing the client's own `User-Agent` HTTP header. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function parseUserAgent(uaString = null) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const baseUrl = 'https://user-agent-parser-device-detector.p.rapidapi.com/ua-parser';
  const url = uaString ? `${baseUrl}?ua=${encodeURIComponent(uaString)}` : baseUrl;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'user-agent-parser-device-detector.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains browser, os, device, engine, cpu, and classification
}
```

### Python (Requests)
```python
import requests

def parse_user_agent(ua_string=None):
    url = "https://user-agent-parser-device-detector.p.rapidapi.com/ua-parser"
    querystring = {"ua": ua_string} if ua_string else {}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "user-agent-parser-device-detector.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
# Parse a custom User-Agent string
curl --request GET \
	--url 'https://user-agent-parser-device-detector.p.rapidapi.com/ua-parser?ua=Mozilla%2F5.0%20(iPhone%3B%20CPU%20iPhone%20OS%2017_0%20like%20Mac%20OS%20X)%20AppleWebKit%2F605.1.15%20(KHTML%2C%20like%20Gecko)%20Version%2F17.0%20Mobile%2F15E148%20Safari%2F604.1' \
	--header 'x-rapidapi-host: user-agent-parser-device-detector.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'

# Auto-detect caller's User-Agent string
curl --request GET \
	--url 'https://user-agent-parser-device-detector.p.rapidapi.com/ua-parser' \
	--header 'x-rapidapi-host: user-agent-parser-device-detector.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Use Cases & Best Practices

1.  **Dynamic Web App Content Optimization:**
    Tailor your UI components by inspecting the classification flags:
    ```javascript
    if (result.classification.is_mobile) {
      // Load touch-optimized mobile interface
    } else if (result.classification.is_tablet) {
      // Load flexible grid layout
    } else {
      // Load full desktop application features
    }
    ```
2.  **Traffic Analytics & Analytics Dashboards:**
    Aggregate `browser.name` and `os.name` across user requests to compile comprehensive analytics dashboards showing OS share, browser popularities, and device models.
3.  **Bot Traffic Filtering:**
    Protect your servers or clean up analytics data by discarding request metrics when `classification.is_bot` is `true`. The API integrates standard crawler identifiers alongside custom social media crawler checks (WhatsApp, Telegram, Facebook, etc.).
4.  **Automatic Header Parsing (Zero Configuration):**
    For client-side apps, do not worry about retrieving user-agents manually. Fetch the endpoint without query arguments, and the backend will parse the browser using the incoming connection's request headers.
