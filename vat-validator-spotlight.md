# European VAT & Company Validator — Developer Integration Guide & Best Practices

Automate B2B checkout validation, map EU tax compliance rules, and query registered company details in real-time. The **European VAT & Company Validator API** verifies VAT identification numbers against the official European Commission VIES database.

---

## 1. Architectural Overview

The API wraps the official EU VIES registry and handles format cleaning, country prefix parsing, and retry logic to avoid checkout disruption:

```
[ User Enters VAT Number ]
            |
            v
[ Format Sanitizer & Parser ] -> Auto-extracts country code and number
            |
            v
[ Greece Code Mapper ] --------> Translates GR prefix to VIES standard EL
            |
            v
[ Validation Cache check ] ----> Returns status instantly if cached recently
            |
            v
[ VIES REST API Fetch ] -------> Retries up to 2x with exponential backoff on timeout
            |
            v
[ Return Standardized JSON ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /vat-validator`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `vat` | String | **Yes** | — | The target VAT number to validate (e.g. `IE6388047V`). Can include spaces, dots, or dashes, and the 2-letter country code prefix is required. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function validateVatNumber(vatNumber) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://european-vat-company-validator.p.rapidapi.com/vat-validator?vat=${encodeURIComponent(vatNumber)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'european-vat-company-validator.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // result.valid is true/false, company_details contains Name and Address
}
```

### Python (Requests)
```python
import requests

def validate_vat_number(vat_number):
    url = "https://european-vat-company-validator.p.rapidapi.com/vat-validator"
    querystring = {"vat": vat_number}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "european-vat-company-validator.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://european-vat-company-validator.p.rapidapi.com/vat-validator?vat=IE6388047V' \
	--header 'x-rapidapi-host: european-vat-company-validator.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Checkout Uptime Rules

1.  **Handling Offline EU Member States:**
    VIES queries live databases hosted by each individual EU country. Occasionally, a single country's database will go offline for maintenance (most commonly Germany or Italy). 
    
    When this happens, the API returns a `502 Bad Gateway` status with `valid: null` and the error code `VIES_SERVICE_UNAVAILABLE`.
    
    *Best Practice:* Do not block your user's checkout if the EU servers are down. Set up a **fail-open** check: if `valid` is `null`, allow the checkout to complete and flag the transaction in your admin panel for manual audit later.
2.  **Graceful Parsing:**
    The API automatically cleans inputs. If a user enters `IE 6388047 V` or `ie-6388047-v`, the system strips spaces and dashes to request VIES correctly.
3.  **Greece Mapping:**
    Greece uses the ISO code `GR`, but the VIES system standardizes it under `EL`. The API automatically handles this translation so developers can pass either prefix.
