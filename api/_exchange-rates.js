let fiatCache = null;   // { rates: { ... }, timestamp: number }
let cryptoCache = null; // { prices: { ... }, timestamp: number }

// Fetch fiat rates from ECB
async function getFiatRates() {
  const now = Date.now();
  // Cache fiat rates for 12 hours
  if (fiatCache && (now - fiatCache.timestamp < 12 * 60 * 60 * 1000)) {
    return fiatCache.rates;
  }

  try {
    const res = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
    if (!res.ok) throw new Error(`ECB response status ${res.status}`);
    const xml = await res.text();

    const rates = { EUR: 1 };
    const regex = /<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      rates[match[1]] = parseFloat(match[2]);
    }

    fiatCache = { rates, timestamp: now };
    return rates;
  } catch (err) {
    console.error('Failed to fetch fiat rates from ECB:', err);
    if (fiatCache) return fiatCache.rates; // Fallback to expired cache
    throw err;
  }
}

// Fetch crypto prices from CoinGecko
async function getCryptoPrices() {
  const now = Date.now();
  // Cache crypto prices for 10 minutes
  if (cryptoCache && (now - cryptoCache.timestamp < 10 * 60 * 1000)) {
    return cryptoCache.prices;
  }

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,eur');
    if (!res.ok) throw new Error(`CoinGecko response status ${res.status}`);
    const data = await res.json();

    const prices = {
      BTC: { USD: data.bitcoin.usd, EUR: data.bitcoin.eur },
      ETH: { USD: data.ethereum.usd, EUR: data.ethereum.eur },
      SOL: { USD: data.solana.usd, EUR: data.solana.eur }
    };

    cryptoCache = { prices, timestamp: now };
    return prices;
  } catch (err) {
    console.error('Failed to fetch crypto prices from CoinGecko:', err);
    if (cryptoCache) return cryptoCache.prices; // Fallback to expired cache
    return null; // Degrade gracefully
  }
}

// Unified conversion helper
function calculateRate(cSymbol, bSymbol, fiatRates, cryptoPrices) {
  // 1. Get price of C in EUR
  let priceCEur;
  if (cSymbol === 'EUR') {
    priceCEur = 1;
  } else if (fiatRates[cSymbol]) {
    priceCEur = 1 / fiatRates[cSymbol];
  } else if (cryptoPrices && cryptoPrices[cSymbol]) {
    priceCEur = cryptoPrices[cSymbol].EUR;
  } else {
    return null;
  }

  // 2. Get price of B in EUR
  let priceBEur;
  if (bSymbol === 'EUR') {
    priceBEur = 1;
  } else if (fiatRates[bSymbol]) {
    priceBEur = 1 / fiatRates[bSymbol];
  } else if (cryptoPrices && cryptoPrices[bSymbol]) {
    priceBEur = cryptoPrices[bSymbol].EUR;
  } else {
    return null;
  }

  // Rate of C relative to base B = Price of B in EUR / Price of C in EUR
  return priceBEur / priceCEur;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { base, symbols } = req.query;
  const baseCurrency = base ? base.trim().toUpperCase() : 'USD';

  try {
    const fiatRates = await getFiatRates();
    const cryptoPrices = await getCryptoPrices();

    // Verify if base currency is supported
    const isBaseFiat = !!fiatRates[baseCurrency];
    const isBaseCrypto = !!(cryptoPrices && cryptoPrices[baseCurrency]);

    if (!isBaseFiat && !isBaseCrypto) {
      const supportedFiats = Object.keys(fiatRates).join(', ');
      const supportedCryptos = cryptoPrices ? ', BTC, ETH, SOL' : '';
      return res.status(400).json({
        error: `Unsupported base currency "${baseCurrency}". Supported: ${supportedFiats}${supportedCryptos}`
      });
    }

    // Build lists of all currencies we can convert
    const allFiats = Object.keys(fiatRates);
    const allCryptos = cryptoPrices ? Object.keys(cryptoPrices) : [];
    const allCurrencies = [...allFiats, ...allCryptos];

    // Determine target symbols to return
    let targetSymbols = allCurrencies;
    if (symbols) {
      targetSymbols = symbols
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => allCurrencies.includes(s));
      
      if (targetSymbols.length === 0) {
        return res.status(400).json({
          error: `None of the requested symbols are supported. Supported: ${allCurrencies.join(', ')}`
        });
      }
    }

    // Compute rates relative to base
    const rates = {};
    for (const sym of targetSymbols) {
      const rate = calculateRate(sym, baseCurrency, fiatRates, cryptoPrices);
      if (rate !== null) {
        rates[sym] = rate;
      }
    }

    // Compile absolute crypto prices in the requested base currency for convenience
    const compiledCryptoPrices = {};
    if (cryptoPrices) {
      for (const cryptoSym of ['BTC', 'ETH', 'SOL']) {
        // Price in base = Price in EUR * rates[base] (if base is fiat)
        // If base is crypto, Price in base = Price in EUR / Price of base in EUR
        const priceInEUR = cryptoPrices[cryptoSym].EUR;
        let priceInBase;
        if (isBaseFiat) {
          priceInBase = priceInEUR * fiatRates[baseCurrency];
        } else {
          priceInBase = priceInEUR / cryptoPrices[baseCurrency].EUR;
        }
        compiledCryptoPrices[cryptoSym] = parseFloat(priceInBase.toFixed(2));
      }
    }

    return res.status(200).json({
      success: true,
      base: baseCurrency,
      rates,
      crypto_prices: cryptoPrices ? compiledCryptoPrices : undefined,
      cache_status: {
        fiat_cache_age_seconds: Math.floor((Date.now() - fiatCache.timestamp) / 1000),
        crypto_cache_age_seconds: cryptoCache ? Math.floor((Date.now() - cryptoCache.timestamp) / 1000) : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to retrieve or process exchange rates',
      details: err.message
    });
  }
}
