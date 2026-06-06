# Rich Link Preview & OG Extractor — Developer Integration Guide & Best Practices

Generate beautiful website preview cards, parse metadata tags, and normalize relative URLs instantly. The **Rich Link Preview & OG Extractor API** fetches target URLs, parses social metadata tags (OpenGraph, Twitter Cards), and returns clean, structured details like Title, Description, Image, Favicon, and Site Name.

---

## 1. Architectural Overview

The API processes link parsing through a custom-built metadata scraper designed for maximum speed and format fallback support:

```
[ User Enters Target URL ]
            |
            v
[ Syntax Regex Check ] ------> Reject malformed URLs instantly
            |
            v
[ Browser Emulation Fetch ] -> Request target HTML with custom User-Agent
            |
            v
[ HTML Head Cheerio Load ] --> Target all meta, link, and title tags
            |
            v
[ Multi-Format Parser ] -----> Extracts Title, Description, OG, Twitter Cards
            |
            v
[ Path Auto-Resolver ] -------> Translates relative paths to absolute URLs
            |
            v
[ Standardized JSON Response ]
```

---

## 2. API Reference & Parameters

### Endpoint
`GET /link-preview`

### Request Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `url` | String | **Yes** | — | The target URL to generate preview data for (e.g. `https://github.com`). Must start with `http://` or `https://`. |

---

## 3. Code Integration Examples

### Node.js (Fetch)
```javascript
async function getLinkPreview(targetUrl) {
  const apiKey = 'YOUR_RAPIDAPI_KEY';
  const url = `https://rich-link-preview-og-extractor.p.rapidapi.com/link-preview?url=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'rich-link-preview-og-extractor.p.rapidapi.com'
    }
  });

  const result = await response.json();
  return result; // contains title, description, image, favicon, etc.
}
```

### Python (Requests)
```python
import requests

def get_link_preview(target_url):
    url = "https://rich-link-preview-og-extractor.p.rapidapi.com/link-preview"
    querystring = {"url": target_url}
    headers = {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
        "x-rapidapi-host": "rich-link-preview-og-extractor.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
```

### cURL
```bash
curl --request GET \
	--url 'https://rich-link-preview-og-extractor.p.rapidapi.com/link-preview?url=https%3A%2F%2Fgithub.com' \
	--header 'x-rapidapi-host: rich-link-preview-og-extractor.p.rapidapi.com' \
	--header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'
```

---

## 4. Key Performance & Styling Best Practices

1.  **Handling Missing Images (Fail-Safe Styling):**
    Some domains (like basic documentation pages) do not define an OpenGraph image or contain any body images. When this happens, `image` is returned as `null`.
    
    *Best Practice:* Always implement a fallback placeholder image in your frontend UI card, or hide the thumbnail section dynamically if the `image` field is null.
2.  **Auto-Resolving Absolute Paths:**
    A major issue with custom link parsing scripts is that images and favicons are often returned as relative paths (e.g. `/images/thumbnail.png` or `../favicon.ico`). The API automatically resolves all paths relative to the base domain URL, returning clean absolute URLs ready to be placed directly in HTML `<img>` tags.
3.  **Fast Path Caching:**
    For the best UI performance, it is recommended to cache the API's JSON response in your application database for **24 hours** to prevent making duplicate network requests when users post the same link multiple times in your chat or forum.
