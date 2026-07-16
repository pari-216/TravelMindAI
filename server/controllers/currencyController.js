// In-memory currency cache
let ratesCache = {
  rates: null,
  ts: 0
};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const SUPPORTED_CURRENCIES = ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "AED", "SGD", "CHF"];

// Hardcoded fallback rates relative to USD if API is completely down
const FALLBACK_RATES = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 155.0,
  AUD: 1.5,
  CAD: 1.37,
  AED: 3.67,
  SGD: 1.35,
  CHF: 0.9,
};

const fetchRates = async () => {
  // Check cache
  if (ratesCache.rates && Date.now() - ratesCache.ts < CACHE_TTL) {
    return ratesCache.rates;
  }

  const apiKey = process.env.EXCHANGERATE_API_KEY;
  let url = "https://open.er-api.com/v6/latest/USD"; // public endpoint fallback

  if (apiKey) {
    url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Exchange rate API response not OK: ${res.status}`);
    }
    const data = await res.json();
    
    // Support both API structures (open.er-api.com vs v6.exchangerate-api.com)
    const apiRates = data.rates || data.conversion_rates;
    if (!apiRates) {
      throw new Error("No rates found in response");
    }

    // Filter to only supported currencies
    const filteredRates = {};
    SUPPORTED_CURRENCIES.forEach(curr => {
      filteredRates[curr] = apiRates[curr] || FALLBACK_RATES[curr];
    });

    ratesCache = {
      rates: filteredRates,
      ts: Date.now()
    };

    return filteredRates;
  } catch (error) {
    console.error("fetchRates error, using fallback rates:", error.message);
    // If cache exists, return it even if expired, otherwise return hardcoded
    return ratesCache.rates || FALLBACK_RATES;
  }
};

/**
 * GET /api/currency/rates
 * Fetch rates for all supported currencies
 */
exports.getRates = async (req, res) => {
  try {
    const rates = await fetchRates();
    res.json({ rates });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch currency rates." });
  }
};

/**
 * GET /api/currency/convert
 * Convert from one currency to another
 */
exports.convert = async (req, res) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({ message: "from, to, and amount parameters are required." });
    }

    const rates = await fetchRates();

    const fromRate = rates[from.toUpperCase()];
    const toRate = rates[to.toUpperCase()];

    if (!fromRate || !toRate) {
      return res.status(400).json({ message: `Unsupported currency codes. Supported: ${SUPPORTED_CURRENCIES.join(", ")}` });
    }

    // Convert: amount in source -> amount in USD -> amount in target
    const amountNum = parseFloat(amount);
    const amountInUSD = amountNum / fromRate;
    const convertedAmount = amountInUSD * toRate;

    res.json({
      from,
      to,
      amount: amountNum,
      convertedAmount: Number(convertedAmount.toFixed(2)),
      rate: Number((toRate / fromRate).toFixed(4)),
    });
  } catch (error) {
    res.status(500).json({ message: "Currency conversion failed." });
  }
};
