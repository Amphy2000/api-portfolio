import * as cheerio from 'cheerio';

// Helper to resolve relative URLs to absolute URLs
function resolveUrl(baseUrl, relativePath) {
  if (!relativePath) return null;
  try {
    return new URL(relativePath, baseUrl).href;
  } catch (err) {
    return relativePath; // Fallback to raw string if parsing fails
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'URL parameter is required (e.g. ?url=https://example.com)'
    });
  }

  try {
    const targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL scheme. Must be http:// or https://' });
    }

    // Fetch the target webpage
    const fetchResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({
        error: `Failed to fetch target URL. Server responded with status: ${fetchResponse.status}`
      });
    }

    const html = await fetchResponse.text();
    const $ = cheerio.load(html);

    // 1. Title Extraction
    const title = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text().trim() ||
                  '';

    // 2. Description Extraction
    const description = $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="twitter:description"]').attr('content') ||
                        $('meta[name="description"]').attr('content') ||
                        '';

    // 3. Thumbnail Image Extraction
    let rawImage = $('meta[property="og:image"]').attr('content') ||
                   $('meta[name="twitter:image"]').attr('content') ||
                   $('link[rel="image_src"]').attr('href') ||
                   '';

    // Fallback: If no meta image, grab first <img> in body that isn't tiny
    if (!rawImage) {
      $('img').each((_, imgEl) => {
        const src = $(imgEl).attr('src');
        if (src && !src.includes('tracker') && !src.includes('pixel')) {
          rawImage = src;
          return false; // Break loop
        }
      });
    }

    // 4. Favicon Extraction
    const rawFavicon = $('link[rel="apple-touch-icon"]').attr('href') ||
                       $('link[rel="shortcut icon"]').attr('href') ||
                       $('link[rel="icon"]').attr('href') ||
                       '/favicon.ico';

    // 5. Site Name Extraction
    const domain = new URL(targetUrl).hostname;
    const siteName = $('meta[property="og:site_name"]').attr('content') ||
                     domain.replace('www.', '');

    // 6. Canonical URL Extraction
    const rawCanonical = $('link[rel="canonical"]').attr('href') || targetUrl;

    // Resolve all relative paths to absolute URLs
    const absoluteImage = resolveUrl(targetUrl, rawImage);
    const absoluteFavicon = resolveUrl(targetUrl, rawFavicon);
    const absoluteCanonical = resolveUrl(targetUrl, rawCanonical);

    return res.status(200).json({
      success: true,
      title: title,
      description: description,
      image: absoluteImage,
      favicon: absoluteFavicon,
      site_name: siteName,
      url: targetUrl,
      canonical: absoluteCanonical,
      metadata: {
        og_type: $('meta[property="og:type"]').attr('content') || 'website',
        twitter_card: $('meta[name="twitter:card"]').attr('content') || 'summary'
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to generate link preview',
      details: err.message
    });
  }
}
