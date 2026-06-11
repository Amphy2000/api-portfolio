# Port Scanner & Network Diagnostics — Developer Integration Guide & Best Practices

Check a target host (IP address or domain name) for open TCP ports, determine service identity, perform banner grabbing to identify software versions, and run safety audits. The **Port Scanner & Network Diagnostics API** helps developers diagnose network access, check server health, and implement automated security checks.

---

## 1. Architectural Overview

The API processes host scanning asynchronously with parallel connection workers:

```
[ User Inputs Host & Ports ]
             |
             v
[ Host Sanitizer ] -----------> Extracts clean hostname/IP (removes protocols, ports, and paths)
             |
             v
[ DNS Resolver ] -------------> Performs system DNS lookup to resolve host to target IP
             |
             v
[ SSRF Protection Guard ] ----> Validates resolved IP against private IP tables (blocks loopback, private LANs)
             |
             v
[ Parallel Port Scanners ] ---> Dispatches TCP sockets concurrently up to 20 ports max
             |
             v
[ Banner Grabber Worker ] ----> Listens on open connections (up to 250ms) to read service banners (e.g. SSH version)
             |
             v
[ Standardized JSON Response ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /port-scanner`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `host` | String | **Yes** | — | The target host to scan (e.g. `google.com`, `8.8.8.8`, or `https://github.com`). URLs are automatically sanitized. |
| `ports` | String | No | `21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080` | A comma-separated list of ports to scan (e.g. `80,443,22`). Max 20 ports. |
| `timeout` | Number | No | `1000` | The connection timeout limit in milliseconds per port (min `200`, max `3000`). |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function scanPorts(host, customPorts = '') {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const query = new URLSearchParams({ host });
  if (customPorts) query.append('ports', customPorts);
  
  const url = `https://port-scanner-network-diagnostics.p.rapidapi.com/port-scanner?${query.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'port-scanner-network-diagnostics.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains target IP, port statuses, service types, and software banners
}
```

### Python (Requests)
```python
import requests

def scan_ports(host, custom_ports=None):
    url = "https://port-scanner-network-diagnostics.p.rapidapi.com/port-scanner"
    querystring = {"host": host}
    if custom_ports:
        querystring["ports"] = custom_ports
        
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "port-scanner-network-diagnostics.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://port-scanner-network-diagnostics.p.rapidapi.com/port-scanner?host=google.com&ports=80%2C443' \
	--header 'x-rapidapi-host: port-scanner-network-diagnostics.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Best Practices & Safety Measures

1. **SSRF Mitigation**:
   The API has built-in protection mechanisms that automatically resolve target hostnames and block scans of local/private IP networks (e.g., `127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `::1`). This prevents attackers from using the scanner to inspect internal cloud infrastructures or local databases.
2. **Concurrent Scan Limits**:
   To prevent timeouts in Vercel/serverless runtimes and keep execution fast, scans are restricted to a maximum of 20 ports per call. If you need to scan wider port ranges, break them into sequential 20-port batch calls.
3. **Banner Grabbing**:
   When a port returns `"status": "open"`, the scanner waits up to 250 milliseconds for the service to write greeting bytes. This allows the API to return SSH versions (e.g. `SSH-2.0-OpenSSH_8.9p1`), SMTP banners, or FTP software headers directly in the JSON response under `banner`.
