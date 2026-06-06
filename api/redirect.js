import { supabase, memoryDb } from './_supabase.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug query parameter is required (?slug=...)' });
  }

  const cleanSlug = slug.trim();

  try {
    if (supabase) {
      // 1. Fetch original URL from Supabase
      const { data: link, error: selectError } = await supabase
        .from('short_links')
        .select('*')
        .eq('slug', cleanSlug)
        .single();

      if (selectError || !link) {
        return res.status(404).json({ error: 'Short URL not found.' });
      }

      // 2. Log click details asynchronously (non-blocking)
      const referrer = req.headers['referer'] || null;
      const userAgent = req.headers['user-agent'] || null;

      // Increment click counter
      supabase
        .from('short_links')
        .update({ clicks: (parseInt(link.clicks, 10) || 0) + 1 })
        .eq('id', link.id)
        .then()
        .catch(err => console.error('Failed to increment clicks:', err));

      // Save click record
      supabase
        .from('short_link_clicks')
        .insert([{ link_id: link.id, referrer, user_agent: userAgent }])
        .then()
        .catch(err => console.error('Failed to log click record:', err));

      // Perform Redirect
      res.writeHead(302, { Location: link.original_url });
      return res.end();

    } else {
      // 2. Fetch from in-memory fallback
      const linkIndex = memoryDb.links.findIndex(l => l.slug === cleanSlug);

      if (linkIndex === -1) {
        return res.status(404).json({ error: 'Short URL not found.' });
      }

      const link = memoryDb.links[linkIndex];
      link.clicks = (parseInt(link.clicks, 10) || 0) + 1;

      const referrer = req.headers['referer'] || null;
      const userAgent = req.headers['user-agent'] || null;

      memoryDb.clicks.push({
        id: memoryDb.clicks.length + 1,
        link_id: link.id,
        referrer,
        user_agent: userAgent,
        clicked_at: new Date().toISOString()
      });

      // Perform Redirect
      res.writeHead(302, { Location: link.original_url });
      return res.end();
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to process redirect',
      details: err.message
    });
  }
}
