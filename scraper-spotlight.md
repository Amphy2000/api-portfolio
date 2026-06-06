# AI Web Scraper & Clean Markdown Extractor — Developer Integration Guide & Best Practices

Convert any webpage into clean, LLM-ready markdown in under a second. The **AI Web Scraper & Clean Markdown Extractor API** handles fetching target webpages, cleaning raw HTML noise (navigation elements, footers, ad boxes, tracker scripts, style tags), and converting the main content into structured Markdown.

---

## 1. Architectural Overview

The API processes page extraction through a multi-stage parser designed for maximum cleanliness and minimum token size:

```
[ Webpage URL Request ]
          |
          v
[ HTTP Fetching with Custom UA ]
          |
          v
[ Cheerio HTML Loading ]
          |
          v
[ noise Tag Strip ] ------------> Removes: script, style, nav, footer,
          |                       header, forms, cookies, ads, sidebars
          v
[ Core Content Detection ] ------> Prioritizes: article -> main -> body
          |
          v
[ Turndown MD Converter ] -------> Converts HTML semantic tree to Markdown
          |
          v
[ Output JSON Response ] --------> Metadata, Stats (Char/Word/Token counts),
                                  and Clean Markdown
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /scraper`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `url` | String | **Yes** | — | The target URL to fetch and scrape (e.g. `https://example.com`). Must start with `http://` or `https://`. |
| `mode` | String | *No* | `standard` | Options: `standard` or `text_only`. When set to `text_only`, image links `![]()` are excluded from the output. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function scrapeWebpage(targetUrl, textOnly = false) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const mode = textOnly ? 'text_only' : 'standard';
  const url = `https://ai-web-scraper-markdown-extractor.p.rapidapi.com/scraper?url=${encodeURIComponent(targetUrl)}&mode=${mode}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'ai-web-scraper-markdown-extractor.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // result.markdown contains the cleaned Markdown
}
```

### Python (Requests)
```python
import requests

def scrape_webpage(target_url, text_only=False):
    url = "https://ai-web-scraper-markdown-extractor.p.rapidapi.com/scraper"
    mode = "text_only" if text_only else "standard"
    querystring = {"url": target_url, "mode": mode}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "ai-web-scraper-markdown-extractor.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://ai-web-scraper-markdown-extractor.p.rapidapi.com/scraper?url=https%3A%2F%2Fexample.com&mode=standard' \
	--header 'x-rapidapi-host: ai-web-scraper-markdown-extractor.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. LLM Token & Cost Optimization

The API automatically provides token estimates (`stats.estimated_llm_tokens`) under the standard rule of thumb of **4 characters per token**.

*   **HTML Noise Stripping:** Stripping boilerplate HTML elements (scripts, SVGs, styles, nav menus) reduces webpage size by up to **80%**, saving massive API credit costs when feeding content to LLMs like GPT-4 or Claude.
*   **Text Only Mode:** Setting `mode=text_only` omits image tags and large image links, further optimizing context windows for RAG database embeddings.
