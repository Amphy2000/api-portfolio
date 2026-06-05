import bwipjs from 'bwip-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { text, type } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required (e.g. ?text=123456)' });
  }

  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: type || 'code128',       // Barcode type (code128, qrcode, ean13, etc.)
      text: text,                    // The text to encode
      scale: 3,                      // Image scale factor
      height: 10,                    // Bar height in mm
      includetext: true,             // Show the text below the barcode
      textxalign: 'center',          // Center-align the text
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    return res.status(200).send(pngBuffer);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate barcode', details: err.message });
  }
}
