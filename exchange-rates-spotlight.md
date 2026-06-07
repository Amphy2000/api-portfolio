# Multi-Currency & Crypto Exchange Rates — Developer Integration Guide & Best Practices

Access real-time, high-performance exchange rates for fiat currencies and major cryptocurrencies. The **Multi-Currency & Crypto Exchange Rates API** aggregates public reference data from the European Central Bank (ECB) alongside top crypto pricing feeds, conversion formulas, and a performance cache to serve queries in under 2ms.

---

## 1. Architectural Overview

The backend acts as a real-time translator, recalculating cross-rates dynamically relative to any requested fiat or crypto base while protecting downstream APIs from rate limits:

```
[ Developer Query ]
         |
         v
[ Input Validator ] ---------> Verify base & target symbols
         |
         v
[ Caching Engine ] -----------> Check local in-memory cache:
         |                      - Fiat (12-hour TTL)
         |                      - Crypto (10-minute TTL)
         +---> (Cache Hit)  -> Return cached rates immediately
         +---> (Cache Miss) -> Fetch from public endpoints:
         |                      - ECB reference feed (fiat rates base EUR)
         |                      - CoinGecko price feed (BTC, ETH, SOL)
         v
[ Cross-Conversion Engine ] -> Calculate rates relative to custom base:
         |                      - Fiat base: Rate = R_target / R_base
         |                      - Crypto base: Rate = R_target * Price_base
         v
[ JSON Payload Formatter ] --> Return rates, absolute prices, cache age
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /exchange-rates`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `base` | String | No | `USD` | The base currency ticker to calculate all exchange rates against. Supports major fiats (USD, EUR, GBP, JPY, NGN, etc.) and cryptocurrencies (BTC, ETH, SOL). |
| `symbols` | String | No | *(All)* | Comma-separated list of target currency tickers to include in the response (e.g. `USD,GBP,BTC`). If omitted, all supported symbols are returned. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function getExchangeRates(base = 'USD', targetSymbols = null) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  let url = `https://multi-currency-crypto-exchange-rates-api.p.rapidapi.com/exchange-rates?base=${base}`;
  if (targetSymbols) {
    url += `&symbols=${encodeURIComponent(targetSymbols)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'multi-currency-crypto-exchange-rates-api.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains base, rates, crypto_prices, cache_status
}
```

### Python (Requests)
```python
import requests

def get_exchange_rates(base='USD', symbols=None):
    url = "https://multi-currency-crypto-exchange-rates-api.p.rapidapi.com/exchange-rates"
    querystring = {"base": base}
    if symbols:
        querystring["symbols"] = symbols
        
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "multi-currency-crypto-exchange-rates-api.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://multi-currency-crypto-exchange-rates-api.p.rapidapi.com/exchange-rates?base=EUR&symbols=USD%2CGBP%2CBTC' \
	--header 'x-rapidapi-host: multi-currency-crypto-exchange-rates-api.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Performance & Conversion Best Practices

1.  **Understand Rates vs. Prices:**
    *   The `rates` object returns the quantity of a target currency purchased with **1 unit of the base currency**. (e.g., if `base: "USD"`, `rates.BTC: 0.000015` means $1 USD buys 0.000015 BTC).
    *   For e-commerce display boards, the `crypto_prices` object returns the absolute value of the cryptocurrency in the requested base currency for direct usage (e.g. `crypto_prices.BTC: 68000.0` means 1 BTC costs $68,000 USD).
2.  **Graceful Degradation:**
    If CoinGecko experiences outages or rate limits, the API automatically falls back to the last cached rates. If no cache is present, it skips the crypto pricing payload and returns fiat conversion board successfully to ensure checkout systems remain online.
3.  **Low-Latency Caching Strategy:**
    Exchange rates do not need second-by-second updates for general checkouts. Caching fiat rates for 12 hours and crypto for 10 minutes matches standard enterprise lookup schedules while keeping backend latency **under 2 milliseconds**.
