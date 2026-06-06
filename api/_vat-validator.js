// Supported EU VAT Country Codes
const SUPPORTED_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
  'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI'
]);

// Helper to delay execution (used for retries)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { vat } = req.query;

  if (!vat) {
    return res.status(400).json({
      error: 'VAT parameter is required (e.g. ?vat=IE6388047V or ?vat=DE123456789)'
    });
  }

  // 1. Clean up input (strip spaces, symbols, convert to uppercase)
  const cleanVat = vat.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (cleanVat.length < 3) {
    return res.status(400).json({ error: 'Invalid VAT format. Too short.' });
  }

  // 2. Extract country code and number
  let countryCode = cleanVat.substring(0, 2);
  let vatNumber = cleanVat.substring(2);

  // If the first two characters are not letters, the user didn't supply a country code prefix
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return res.status(400).json({
      error: 'VAT number must be prefixed with a 2-letter country code (e.g. DE123456789)'
    });
  }

  // 3. Handle Greece mapping (Greece uses ISO code GR, but VIES database standard is EL)
  if (countryCode === 'GR') {
    countryCode = 'EL';
  }

  // 4. Validate country code support
  if (!SUPPORTED_COUNTRIES.has(countryCode)) {
    return res.status(400).json({
      error: `Unsupported or invalid EU country code: ${countryCode}. Must be one of: ${Array.from(SUPPORTED_COUNTRIES).join(', ')}`
    });
  }

  if (!vatNumber) {
    return res.status(400).json({ error: 'VAT number body is missing after country code' });
  }

  // 5. Query the official EU VIES REST API with retry logic
  const viesUrl = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${vatNumber}`;
  const maxRetries = 2;
  let attempt = 0;
  let responseData = null;
  let fetchError = null;

  while (attempt <= maxRetries) {
    try {
      attempt++;
      // Set a 5-second fetch timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(viesUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VIES-Validator-API/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        responseData = await response.json();
        fetchError = null;
        break; // Success! Break out of retry loop.
      } else {
        // Specific VIES maintenance/service error
        if (response.status === 503 || response.status === 504) {
          fetchError = {
            status: response.status,
            message: 'VIES service is temporarily unavailable or timed out on the EU Commission side.'
          };
        } else {
          const errText = await response.text();
          fetchError = {
            status: response.status,
            message: `EU Server responded with status ${response.status}: ${errText}`
          };
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        fetchError = { status: 408, message: 'Request timed out after 5000ms.' };
      } else {
        fetchError = { status: 500, message: err.message };
      }
    }

    // Delay before next attempt (exponential backoff: 200ms, 400ms)
    if (attempt <= maxRetries) {
      await sleep(attempt * 200);
    }
  }

  // 6. Handle VIES downtime/failures gracefully without claiming the VAT is invalid
  if (fetchError) {
    return res.status(502).json({
      success: false,
      valid: null,
      country_code: countryCode === 'EL' ? 'GR' : countryCode,
      vat_number: vatNumber,
      error: 'VIES_SERVICE_UNAVAILABLE',
      reason: 'The official EU validation servers are currently offline or timed out. Please try again or mark this registration for manual review.',
      details: fetchError.message,
      timestamp: new Date().toISOString()
    });
  }

  // 7. Parse VIES response data
  const isValid = responseData.isValid === true;
  
  // Clean up company name and address (VIES sometimes returns "---" or empty strings)
  const name = responseData.name && responseData.name !== '---' ? responseData.name.trim() : null;
  const address = responseData.address && responseData.address !== '---' ? responseData.address.trim() : null;

  return res.status(200).json({
    success: true,
    valid: isValid,
    country_code: countryCode === 'EL' ? 'GR' : countryCode, // Show GR to the developer to match ISO standards
    vat_number: vatNumber,
    request_date: responseData.requestDate || new Date().toISOString(),
    company_details: isValid ? {
      name: name,
      address: address
    } : null,
    approximate_match: responseData.viesApproximate || null,
    timestamp: new Date().toISOString()
  });
}
