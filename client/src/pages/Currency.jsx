import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, ArrowRightLeft, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import api from "../services/api";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
];

export default function Currency() {
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [rate, setRate] = useState(null);
  
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRatesTable = async () => {
    setRatesLoading(true);
    try {
      const { data } = await api.get("/currency/rates");
      setRates(data.rates || {});
    } catch (err) {
      console.error(err);
      setError("Failed to fetch current exchange rates.");
    } finally {
      setRatesLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(
        `/currency/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
      );
      setConvertedAmount(data.convertedAmount);
      setRate(data.rate);
    } catch (err) {
      console.error(err);
      setError("Failed to perform currency conversion. Using offline estimates.");
      // Fallback conversion offline if api fails
      const fallbackRates = {
        USD: 1.0, INR: 83.5, EUR: 0.92, GBP: 0.78, JPY: 155.0,
        AUD: 1.5, CAD: 1.37, AED: 3.67, SGD: 1.35, CHF: 0.9
      };
      const f = fallbackRates[fromCurrency] || 1;
      const t = fallbackRates[toCurrency] || 1;
      const r = t / f;
      setRate(r);
      setConvertedAmount(Number((parseFloat(amount) * r).toFixed(2)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatesTable();
  }, []);

  useEffect(() => {
    handleConvert();
  }, [fromCurrency, toCurrency, amount]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
          <Coins className="w-8 h-8 text-blue-400" /> Currency Converter
        </h1>
        <p className="text-slate-500 mt-1">Check live exchange rates and convert your travel budget instantly.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Main Converter Card */}
      <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 md:p-8 shadow-xl max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
          {/* Amount input */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full bg-white/80/60 border border-sky-100 rounded-2xl py-3 pl-4 pr-10 text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {CURRENCIES.find(c => c.code === fromCurrency)?.symbol || "$"}
              </span>
            </div>
          </div>

          {/* From Currency */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full bg-white/80 border border-sky-100 rounded-2xl py-3 px-4 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <div className="flex justify-center md:col-span-1 pt-6">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSwap}
              className="p-3 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-sky-700 transition-all cursor-pointer shadow-lg"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </motion.button>
          </div>

          {/* To Currency */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full bg-white/80 border border-sky-100 rounded-2xl py-3 px-4 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Output section */}
        <div className="mt-8 pt-8 border-t border-sky-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 w-32 bg-white rounded animate-pulse"></div>
                <div className="h-8 w-48 bg-white rounded animate-pulse"></div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  {amount} {fromCurrency} =
                </p>
                <h2 className="text-3xl font-bold text-white mt-1">
                  {convertedAmount?.toLocaleString()} {toCurrency}
                </h2>
              </div>
            )}
          </div>

          {rate && !loading && (
            <div className="bg-white/80/60 border border-sky-100/60 rounded-2xl p-4 flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Exchange Rate</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  1 {fromCurrency} = {rate} {toCurrency}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exchange Rates Grid */}
      <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 md:p-8 shadow-xl max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>Rates Dashboard</h2>
            <p className="text-sm text-slate-400 mt-0.5">Live conversions relative to 1 {fromCurrency}</p>
          </div>
          <button
            onClick={fetchRatesTable}
            disabled={ratesLoading}
            className="p-2 bg-white hover:bg-sky-100 text-slate-600 rounded-xl transition border border-sky-100 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${ratesLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {ratesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-white/70 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CURRENCIES.map((curr) => {
              if (curr.code === fromCurrency) return null;
              
              // Rates are fetched in USD. Convert rate to match the selected base (fromCurrency)
              const baseRate = rates[fromCurrency] || 1;
              const targetRate = rates[curr.code] || 1;
              const exchangeRate = Number((targetRate / baseRate).toFixed(4));

              return (
                <div key={curr.code} className="bg-white/80/40 border border-sky-100/80 rounded-2xl p-4 flex flex-col justify-between h-24 hover:border-blue-500/30 transition-all hover:bg-white/80/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">{curr.code}</span>
                    <span className="text-xs text-slate-400 font-medium truncate ml-1">{curr.name}</span>
                  </div>
                  <div className="text-lg font-bold text-white mt-2">
                    {curr.symbol} {exchangeRate.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
