import { supabase, memoryDb } from './_supabase.js';

function generateSlug(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET /api/shorten?slug=xyz - Fetch link stats and analytics
  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({
        error: 'Slug query parameter is required (?slug=...) to fetch analytics.'
      });
    }

    const cleanSlug = slug.trim();

    try {
      let link = null;

      if (supabase) {
        const { data, error } = await supabase
          .from('short_links')
          .select('*')
          .eq('slug', cleanSlug)
          .single();
        
        if (!error && data) {
          link = data;
        }
      } else {
        link = memoryDb.links.find(l => l.slug === cleanSlug) || null;
      }

      if (!link) {
        return res.status(404).json({ error: `Short URL with slug "${cleanSlug}" not found.` });
      }

      let recentClicks = [];
      if (supabase) {
        const { data: clicks, error } = await supabase
          .from('short_link_clicks')
          .select('referrer, user_agent, clicked_at')
          .eq('link_id', link.id)
          .order('clicked_at', { ascending: false })
          .limit(100);
        if (!error && clicks) {
          recentClicks = clicks;
        }
      } else {
        recentClicks = memoryDb.clicks
          .filter(c => c.link_id === link.id)
          .map(c => ({ referrer: c.referrer, user_agent: c.user_agent, clicked_at: c.clicked_at }))
          .reverse()
          .slice(0, 100);
      }

      // Compile stats
      const totalClicks = parseInt(link.clicks, 10) || 0;
      const referrers = {};
      const browsers = {};

      recentClicks.forEach(c => {
        const ref = c.referrer ? new URL(c.referrer).hostname : 'Direct';
        referrers[ref] = (referrers[ref] || 0) + 1;

        const ua = c.user_agent || '';
        let browser = 'Other';
        if (/firefox/i.test(ua)) browser = 'Firefox';
        else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
        else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
        else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';
        else if (/bot|spider|crawl|slurp/i.test(ua)) browser = 'Bot';

        browsers[browser] = (browsers[browser] || 0) + 1;
      });

      return res.status(200).json({
        success: true,
        slug: link.slug,
        original_url: link.original_url,
        total_clicks: totalClicks,
        created_at: link.created_at,
        analytics: {
          total_logged_clicks: recentClicks.length,
          referrers,
          browsers
        },
        db_mode: supabase ? 'supabase' : 'in_memory_fallback'
      });

    } catch (err) {
      return res.status(500).json({
        error: 'Failed to retrieve link analytics',
        details: err.message
      });
    }
  }

  // 2. POST /api/shorten - Create a short URL slug
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body.' });
      }
    }

    const { url } = body || {};

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required in the JSON body.' });
    }

    // Validate URL scheme
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL. Must start with http:// or https://' });
    }

    const slug = generateSlug(6);

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('short_links')
          .insert([{ slug, original_url: url }])
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          success: true,
          slug,
          original_url: url,
          short_url: `https://${req.headers.host || 'api-portfolio.vercel.app'}/api/redirect?slug=${slug}`,
          db_mode: 'supabase',
          created_at: data.created_at
        });
      } else {
        const newLink = {
          id: memoryDb.links.length + 1,
          slug,
          original_url: url,
          clicks: 0,
          created_at: new Date().toISOString()
        };
        memoryDb.links.push(newLink);

        return res.status(201).json({
          success: true,
          slug,
          original_url: url,
          short_url: `https://${req.headers.host || 'localhost:3000'}/api/redirect?slug=${slug}`,
          db_mode: 'in_memory_fallback',
          created_at: newLink.created_at
        });
      }
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to create short URL',
        details: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
