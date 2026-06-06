import * as cheerio from 'cheerio';

// Helper to resolve text values from deeply nested or multi-type schema attributes
function getVal(node, keys) {
  if (!node) return null;
  for (const k of keys) {
    if (node[k] !== undefined && node[k] !== null) {
      const val = node[k];
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'number') return val.toString();
      if (Array.isArray(val) && val.length > 0) {
        if (typeof val[0] === 'string') return val[0].trim();
        if (val[0] && typeof val[0] === 'object' && val[0].name) {
          return typeof val[0].name === 'string' ? val[0].name.trim() : null;
        }
      }
      if (val && typeof val === 'object') {
        if (val.name && typeof val.name === 'string') return val.name.trim();
      }
    }
  }
  return null;
}

// Normalizer: Product Schema
function normalizeProduct(s) {
  let price = null;
  let currency = null;
  let availability = null;
  
  if (s.offers) {
    const offers = Array.isArray(s.offers) ? s.offers : [s.offers];
    const o = offers[0];
    if (o) {
      price = o.price || o.lowPrice || null;
      currency = o.priceCurrency || null;
      availability = o.availability || null;
      if (availability && typeof availability === 'string') {
        availability = availability.replace('https://schema.org/', '').replace('http://schema.org/', '');
      }
    }
  }

  let rating = null;
  let reviewCount = null;
  if (s.aggregateRating) {
    rating = s.aggregateRating.ratingValue || null;
    reviewCount = s.aggregateRating.reviewCount || s.aggregateRating.ratingCount || null;
  }

  let image = null;
  if (s.image) {
    image = Array.isArray(s.image) ? s.image[0] : s.image;
    if (image && typeof image === 'object') {
      image = image.url || null;
    }
  }

  return {
    name: getVal(s, ['name', 'headline']),
    description: getVal(s, ['description']),
    brand: getVal(s, ['brand']),
    sku: getVal(s, ['sku', 'mpn']),
    image: image,
    price: price ? parseFloat(price) : null,
    currency: currency,
    availability: availability,
    rating: rating ? parseFloat(rating) : null,
    review_count: reviewCount ? parseInt(reviewCount, 10) : null
  };
}

// Normalizer: Recipe Schema
function normalizeRecipe(s) {
  let image = null;
  if (s.image) {
    image = Array.isArray(s.image) ? s.image[0] : s.image;
    if (image && typeof image === 'object') {
      image = image.url || null;
    }
  }

  let instructions = [];
  if (s.recipeInstructions) {
    const rawInst = Array.isArray(s.recipeInstructions) ? s.recipeInstructions : [s.recipeInstructions];
    instructions = rawInst.map(inst => {
      if (typeof inst === 'string') return inst;
      if (typeof inst === 'object' && inst.text) return inst.text;
      return null;
    }).filter(Boolean);
  }

  return {
    name: getVal(s, ['name']),
    description: getVal(s, ['description']),
    author: getVal(s, ['author']),
    image: image,
    prep_time: getVal(s, ['prepTime']),
    cook_time: getVal(s, ['cookTime']),
    total_time: getVal(s, ['totalTime']),
    yield: getVal(s, ['recipeYield', 'yield']),
    ingredients: Array.isArray(s.recipeIngredient) ? s.recipeIngredient : (s.recipeIngredient ? [s.recipeIngredient] : []),
    instructions: instructions
  };
}

// Normalizer: JobPosting Schema
function normalizeJob(s) {
  let minSalary = null;
  let maxSalary = null;
  let salaryCurrency = null;

  if (s.baseSalary && s.baseSalary.value) {
    const valObj = s.baseSalary.value;
    minSalary = valObj.minValue || valObj.value || null;
    maxSalary = valObj.maxValue || valObj.value || null;
    salaryCurrency = s.baseSalary.currency || null;
  }

  return {
    title: getVal(s, ['title', 'name']),
    description: getVal(s, ['description']),
    company: getVal(s, ['hiringOrganization']),
    location: getVal(s, ['jobLocation']),
    date_posted: getVal(s, ['datePosted']),
    valid_through: getVal(s, ['validThrough']),
    employment_type: getVal(s, ['employmentType']),
    salary: minSalary ? {
      min: parseFloat(minSalary),
      max: maxSalary ? parseFloat(maxSalary) : parseFloat(minSalary),
      currency: salaryCurrency
    } : null
  };
}

// Normalizer: Event Schema
function normalizeEvent(s) {
  let price = null;
  let currency = null;
  if (s.offers) {
    const offers = Array.isArray(s.offers) ? s.offers : [s.offers];
    const o = offers[0];
    if (o) {
      price = o.price || o.lowPrice || null;
      currency = o.priceCurrency || null;
    }
  }

  return {
    name: getVal(s, ['name']),
    description: getVal(s, ['description']),
    start_date: getVal(s, ['startDate']),
    end_date: getVal(s, ['endDate']),
    location: getVal(s, ['location']),
    organizer: getVal(s, ['organizer']),
    price: price ? parseFloat(price) : null,
    currency: currency
  };
}

// Normalizer: Article Schema
function normalizeArticle(s) {
  let image = null;
  if (s.image) {
    image = Array.isArray(s.image) ? s.image[0] : s.image;
    if (image && typeof image === 'object') {
      image = image.url || null;
    }
  }

  return {
    headline: getVal(s, ['headline', 'name']),
    description: getVal(s, ['description']),
    author: getVal(s, ['author']),
    date_published: getVal(s, ['datePublished']),
    date_modified: getVal(s, ['dateModified']),
    image: image,
    publisher: getVal(s, ['publisher'])
  };
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

    const schemas = [];

    // Parse all JSON-LD blocks on the page
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).text().trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            schemas.push(...parsed);
          } else {
            schemas.push(parsed);
          }
        }
      } catch (err) {
        // Skip malformed JSON blocks
      }
    });

    // Flatten graph-style (@graph) layout blocks into standard schema objects
    const flatSchemas = [];
    for (const s of schemas) {
      if (s && s['@graph'] && Array.isArray(s['@graph'])) {
        flatSchemas.push(...s['@graph']);
      } else {
        flatSchemas.push(s);
      }
    }

    // Run normalization logic for recognized schemas
    const normalized = [];
    const detectedTypes = new Set();

    for (const s of flatSchemas) {
      if (!s || !s['@type']) continue;

      const types = Array.isArray(s['@type']) ? s['@type'] : [s['@type']];
      
      for (const t of types) {
        detectedTypes.add(t);
      }

      if (types.includes('Product')) {
        normalized.push({ type: 'Product', data: normalizeProduct(s) });
      } else if (types.includes('Recipe')) {
        normalized.push({ type: 'Recipe', data: normalizeRecipe(s) });
      } else if (types.includes('JobPosting')) {
        normalized.push({ type: 'JobPosting', data: normalizeJob(s) });
      } else if (types.includes('Event')) {
        normalized.push({ type: 'Event', data: normalizeEvent(s) });
      } else if (types.includes('Article') || types.includes('NewsArticle') || types.includes('BlogPosting')) {
        normalized.push({ type: 'Article', data: normalizeArticle(s) });
      }
    }

    return res.status(200).json({
      success: true,
      url: targetUrl,
      stats: {
        total_raw_schemas: flatSchemas.length,
        total_normalized_schemas: normalized.length,
        detected_types: Array.from(detectedTypes)
      },
      normalized_schemas: normalized,
      raw_schemas: flatSchemas,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to extract structured schemas',
      details: err.message
    });
  }
}
