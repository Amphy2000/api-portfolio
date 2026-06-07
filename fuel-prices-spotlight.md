# Programmatic SEO Fuel Price Tracker — Developer Integration Guide & Best Practices

Access live state-by-state fuel price averages in the United States. The **Programmatic SEO Fuel Price Tracker API** scrapes AAA Gas Price tables daily, calculates national benchmarks, and serves queries under 2ms using a performance-tuned in-memory caching system.

---

## 1. Architectural Overview

The API scrapes, normalizes, and filters average price data for Regular, Midgrade, Premium, and Diesel fuel grades:

```
[ Developer Query ]
         |
         v
[ Caching Engine ] -----------> Check local in-memory cache:
         |                      - Scraped Dataset (24-hour TTL)
         +---> (Cache Hit)  -> Serve prices instantly
         +---> (Cache Miss) -> Fetch raw HTML from AAA registry:
         |                      - Load DOM using Cheerio
         |                      - Extract state averages & codes
         |                      - Calculate dynamic national average
         v
[ Search & Filter Logic ] ----> Evaluate query arguments:
         |                      - Filter by State (abbreviation or name)
         |                      - Filter by Fuel Grade (regular, premium, etc.)
         v
[ JSON Payload Formatter ] --> Return structured response
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /fuel-prices`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `state` | String | No | *(All States)* | The target state abbreviation (e.g. `TX`) or full state name (e.g. `California`). If omitted, returns all 51 state averages. |
| `type` | String | No | *(All Grades)* | The specific fuel grade to return. Supported: `regular`, `midgrade`, `premium`, `diesel`. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function getFuelPrices(state = null, fuelType = null) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  let url = 'https://us-fuel-prices-tracker.p.rapidapi.com/fuel-prices';
  const params = [];
  if (state) params.push(`state=${encodeURIComponent(state)}`);
  if (fuelType) params.push(`type=${encodeURIComponent(fuelType)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'us-fuel-prices-tracker.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains national_average, state_averages
}
```

### Python (Requests)
```python
import requests

def get_fuel_prices(state=None, fuel_type=None):
    url = "https://us-fuel-prices-tracker.p.rapidapi.com/fuel-prices"
    querystring = {}
    if state:
        querystring["state"] = state
    if fuel_type:
        querystring["type"] = fuel_type
        
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "us-fuel-prices-tracker.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
# Query diesel price in Texas
curl --request GET \
	--url 'https://us-fuel-prices-tracker.p.rapidapi.com/fuel-prices?state=TX&type=diesel' \
	--header 'x-rapidapi-host: us-fuel-prices-tracker.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Use Cases & Calculation Rules

1.  **Dynamic Mileage Surcharges:**
    Logistics networks and delivery platforms can query this API to automatically calculate dynamic mileage payouts. For example, comparing a state's current diesel price against a baseline national average (e.g. $4.00) helps automatically trigger fuel surcharge multipliers.
2.  **Programmatic SEO Local Directories:**
    If you are building directories or localized blog pages (e.g., "Gas prices in [City], [State]"), query this API by state to build real-time tables. Returning the entire state list in one call keeps page generation speeds under 5ms.
3.  **National Averages Calculations:**
    The API dynamically averages the parsed records across all states to calculate the overall national benchmark. This provides a clean benchmark comparison without calling separate feeds.
