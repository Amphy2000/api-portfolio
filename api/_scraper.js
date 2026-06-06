import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, mode } = req.query;

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
    
    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Extract metadata before cleaning up the body
    const pageTitle = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || targetUrl;

    // Remove heavy/noise tags that LLMs don't need
    const tagsToRemove = [
      'script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 
      'nav', 'footer', 'header', 'form', 'aside', 'select', 'textarea',
      '.cookie-banner', '.cookie-consent', '.ad-box', '.ads', '.sidebar', 
      '.comments', '#comments', '#comments-section', '.footer-links', '.navigation'
    ];
    tagsToRemove.forEach(tag => $(tag).remove());

    // Select core content container (prioritize article/main, fallback to body)
    let contentElement = $('article');
    if (contentElement.length === 0) contentElement = $('main');
    if (contentElement.length === 0) contentElement = $('[role="main"]');
    if (contentElement.length === 0) contentElement = $('#content');
    if (contentElement.length === 0) contentElement = $('body');

    // Get the HTML content to convert
    let cleanHtml = contentElement.html() || '';

    // If cleanHtml is too short, default to whole body
    if (cleanHtml.length < 100) {
      cleanHtml = $('body').html() || '';
    }

    // Initialize Turndown to convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      hr: '---',
      bullet: '-',
      linkStyle: 'referenced'
    });

    // Strip out empty links and formatting noise
    turndownService.addRule('stripImagesIfDesired', {
      filter: 'img',
      replacement: (content, node) => {
        // If they only want text, omit images
        if (mode === 'text_only') return '';
        const alt = node.getAttribute('alt') || 'image';
        const src = node.getAttribute('src') || '';
        return src ? `![${alt}](${src})` : '';
      }
    });

    const markdown = turndownService.turndown(cleanHtml);

    // Calculate details
    const charCount = markdown.length;
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;
    const estTokens = Math.ceil(charCount / 4); // Standard rule of thumb: ~4 chars per token

    return res.status(200).json({
      success: true,
      metadata: {
        title: pageTitle,
        description: metaDescription,
        keywords: keywords,
        og_image: ogImage,
        canonical_url: canonical,
        url: targetUrl
      },
      stats: {
        characters: charCount,
        words: wordCount,
        estimated_llm_tokens: estTokens
      },
      markdown: markdown,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({ 
      error: 'Failed to scrape webpage', 
      details: err.message 
    });
  }
}
