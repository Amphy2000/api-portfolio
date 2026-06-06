import * as cheerio from 'cheerio';

let fuelCache = null; // { data: { state_averages: ..., national_average: ... }, timestamp: number }
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper to fetch and parse AAA State Gas Prices
async function getFuelPrices() {
  const now = Date.now();
  if (fuelCache && (now - fuelCache.timestamp < CACHE_TTL)) {
    return fuelCache.data;
  }

  try {
    const res = await fetch('https://gasprices.aaa.com/state-gas-price-averages/');
    if (!res.ok) {
      throw new Error(`AAA registry responded with status ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const stateAverages = {};

    $('table tbody tr').each((i, element) => {
      const row = $(element);
      const stateLink = row.find('td').first().find('a');
      
      if (stateLink.length > 0) {
        const stateName = stateLink.text().trim();
        const href = stateLink.attr('href') || '';
        const match = href.match(/state=([A-Z]{2})/);
        const stateCode = match ? match[1] : '';

        // Clean prices
        const regular = parseFloat(row.find('td.regular').text().replace(/[^0-9.]/g, '')) || 0;
        const midgrade = parseFloat(row.find('td.mid_grade').text().replace(/[^0-9.]/g, '')) || 0;
        const premium = parseFloat(row.find('td.premium').text().replace(/[^0-9.]/g, '')) || 0;
        const diesel = parseFloat(row.find('td.diesel').text().replace(/[^0-9.]/g, '')) || 0;

        if (stateCode) {
          stateAverages[stateCode] = {
            state_name: stateName,
            state_code: stateCode,
            prices: {
              regular,
              midgrade,
              premium,
              diesel
            }
          };
        }
      }
    });

    const states = Object.keys(stateAverages);
    if (states.length === 0) {
      throw new Error('Failed to parse any state gas prices from target table.');
    }

    // Calculate National Averages dynamically
    let totalRegular = 0, totalMidgrade = 0, totalPremium = 0, totalDiesel = 0;
    states.forEach(code => {
      const p = stateAverages[code].prices;
      totalRegular += p.regular;
      totalMidgrade += p.midgrade;
      totalPremium += p.premium;
      totalDiesel += p.diesel;
    });

    const count = states.length;
    const nationalAverage = {
      regular: parseFloat((totalRegular / count).toFixed(3)),
      midgrade: parseFloat((totalMidgrade / count).toFixed(3)),
      premium: parseFloat((totalPremium / count).toFixed(3)),
      diesel: parseFloat((totalDiesel / count).toFixed(3))
    };

    const data = {
      national_average: nationalAverage,
      state_averages: stateAverages
    };

    fuelCache = { data, timestamp: now };
    return data;

  } catch (err) {
    console.error('Failed to scrape AAA Gas Prices:', err);
    if (fuelCache) {
      console.log('Falling back to expired fuel cache...');
      return fuelCache.data; // Degrade gracefully by returning expired cache
    }
    throw err;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { state, type } = req.query;

  try {
    const data = await getFuelPrices();

    // 1. If state parameter is supplied
    if (state) {
      const searchStr = state.trim().toUpperCase();
      let matchedState = null;

      // Search by code or full name
      const codes = Object.keys(data.state_averages);
      if (searchStr.length === 2 && data.state_averages[searchStr]) {
        matchedState = data.state_averages[searchStr];
      } else {
        const matchedCode = codes.find(code => 
          data.state_averages[code].state_name.toUpperCase() === searchStr
        );
        if (matchedCode) {
          matchedState = data.state_averages[matchedCode];
        }
      }

      if (!matchedState) {
        return res.status(404).json({
          error: `State "${state}" not found. Please provide a valid 2-letter abbreviation (e.g. TX) or full name.`
        });
      }

      // If fuel type is also supplied
      if (type) {
        const cleanType = type.trim().toLowerCase();
        const price = matchedState.prices[cleanType];
        if (price === undefined) {
          return res.status(400).json({
            error: `Invalid fuel type "${type}". Supported: regular, midgrade, premium, diesel`
          });
        }
        return res.status(200).json({
          success: true,
          state: matchedState.state_name,
          state_code: matchedState.state_code,
          fuel_type: cleanType,
          price,
          national_average: data.national_average[cleanType],
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        state: matchedState.state_name,
        state_code: matchedState.state_code,
        prices: matchedState.prices,
        national_average_comparison: data.national_average,
        timestamp: new Date().toISOString()
      });
    }

    // 2. If only type is supplied
    if (type) {
      const cleanType = type.trim().toLowerCase();
      if (data.national_average[cleanType] === undefined) {
        return res.status(400).json({
          error: `Invalid fuel type "${type}". Supported: regular, midgrade, premium, diesel`
        });
      }

      // Return averages of this type for all states
      const statePricesByType = {};
      Object.keys(data.state_averages).forEach(code => {
        statePricesByType[code] = {
          state_name: data.state_averages[code].state_name,
          price: data.state_averages[code].prices[cleanType]
        };
      });

      return res.status(200).json({
        success: true,
        fuel_type: cleanType,
        national_average: data.national_average[cleanType],
        state_averages: statePricesByType,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Default: return everything
    return res.status(200).json({
      success: true,
      national_average: data.national_average,
      state_averages: data.state_averages,
      cache_age_seconds: Math.floor((Date.now() - fuelCache.timestamp) / 1000),
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to retrieve or parse fuel price data',
      details: err.message
    });
  }
}
