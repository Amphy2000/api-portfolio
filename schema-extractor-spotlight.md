# Structured Schema JSON-LD Parser — Developer Integration Guide & Best Practices

Extract rich product details, recipes, job postings, articles, and event details from any website. The **Structured Schema JSON-LD Parser API** scrapes target URLs, isolates nested `<script type="application/ld+json">` metadata blocks, and flattens standard Schema.org definitions into clean, simplified JSON objects.

---

## 1. Architectural Overview

The API fetches webpages, parses all JSON-LD blocks, flattens graph structures, and normalizes standard entities:

```
[ User Inputs Page URL ]
            |
            v
[ Web Scraper Fetcher ] ------> Fetch target HTML using custom User-Agent
            |
            v
[ JSON-LD Tag Crawler ] ------> Target all script[type="application/ld+json"] tags
            |
            v
[ Graph Array Flattener ] ----> Clean up @graph layout nodes into simple lists
            |
            v
[ Entity Normalization ] -----> Map recognized types (Product, Recipe, Job, Event, Article)
            |
            v
[ Standardized JSON Response ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /schema-extractor`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `url` | String | **Yes** | — | The target webpage URL to scrape and parse (e.g. `https://example.com/product-page`). Must start with `http://` or `https://`. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function extractPageSchemas(targetUrl) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://schema-extractor-jsonld-parser.p.rapidapi.com/schema-extractor?url=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'schema-extractor-jsonld-parser.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains stats, normalized_schemas, and raw_schemas
}
```

### Python (Requests)
```python
import requests

def extract_page_schemas(target_url):
    url = "https://schema-extractor-jsonld-parser.p.rapidapi.com/schema-extractor"
    querystring = {"url": target_url}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "schema-extractor-jsonld-parser.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://schema-extractor-jsonld-parser.p.rapidapi.com/schema-extractor?url=https%3A%2F%2Fexample.com' \
	--header 'x-rapidapi-host: schema-extractor-jsonld-parser.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Performance & Parsing Best Practices

1.  **High-Performance Scraping E-Commerce Price Trackers:**
    If you are building an automated product price checker, query this API to target the `Product` type under `normalized_schemas`. Inspect the `price`, `currency`, and `availability` fields to alert users when a product goes on sale or comes back in stock.
2.  **Structured Fallback Handling:**
    Some sites do not use JSON-LD but standard OpenGraph tags, or vice versa. For social link previews, use the **Rich Link Preview API**. For extracting raw product database details, recipes, or job postings, use this **Schema Extractor API**.
3.  **Raw Schemas Access (`raw_schemas`):**
    If a website includes custom properties in their JSON-LD block that are not covered in the normalized objects, they are preserved inside the `raw_schemas` list. You can inspect this array to pull any custom nested keys.
4.  **Hobby Rate Limiting:**
    Scraping sites dynamically relies on external host response times. Set a client-side timeout of **8 seconds** when fetching schemas to handle slow target servers.
