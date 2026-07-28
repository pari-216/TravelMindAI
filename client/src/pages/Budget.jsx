import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { DollarSign, AlertTriangle, CheckCircle, TrendingUp, Calendar, MapPin, Sparkles, Bot, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Budget() {
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [loading, setLoading] = useState(true);

  // AI Budget Advisor
  const [aiTips, setAiTips] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchAIInsights = async () => {
    if (!selectedTrip) return;
    setAiLoading(true);
    setAiError("");
    try {
      const { data } = await api.post("/ai/budget-insights", {
        destination: `${selectedTrip.destination}, ${selectedTrip.country}`,
        budget: totalBudget,
        totalSpent,
        expenses: tripExpenses.map((e) => ({ category: e.category, amount: e.amount })),
      });
      setAiTips(data.tips || []);
    } catch (err) {
      setAiError(err.response?.data?.message || "Failed to load AI insights.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripsRes = await api.get("/trips");
        const expensesRes = await api.get("/expenses");
        
        setTrips(tripsRes.data);
        setExpenses(expensesRes.data);
        
        if (tripsRes.data.length > 0) {
          setSelectedTripId(tripsRes.data[0]._id);
        }
      } catch (error) {
        console.error("Error fetching budget data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const selectedTrip = trips.find((t) => t._id === selectedTripId);
  const tripExpenses = expenses.filter((e) => e.trip === selectedTripId);
  
  const totalBudget = selectedTrip ? selectedTrip.budget : 0;
  const totalSpent = tripExpenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Circular progress dimensions
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentUsed, 100) / 100) * circumference;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-white/80 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white/80 rounded-2xl animate-pulse border border-sky-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-sky-50/50 border border-dashed border-sky-100 rounded-2xl p-6">
        <DollarSign className="w-16 h-16 text-slate-400 mb-4" />
        <h3 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>No active budgets</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-sm text-center">
          You need to plan a trip before managing its budget. Create a trip to configure your budget overview!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Select Trip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans" style={{ color: "var(--text-heading)" }}>Budget Manager</h1>
          <p className="text-slate-500 mt-1">Track travel spending patterns across your trips.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white border border-sky-100 px-4 py-2.5 rounded-xl">
          <span className="text-sm font-medium text-slate-500">Select Trip:</span>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
          >
            {trips.map((trip) => (
              <option key={trip._id} value={trip._id} className="bg-white text-slate-800">
                {trip.destination} ({trip.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warnings & Notices */}
      {percentUsed >= 100 ? (
        <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-semibold text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>Budget Exceeded! You have spent ${totalSpent.toFixed(2)} which exceeds your limit.</span>
        </div>
      ) : percentUsed >= 80 ? (
        <div className="flex items-center space-x-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl font-semibold text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>You are nearing your budget limit. ({percentUsed.toFixed(0)}% used)</span>
        </div>
      ) : (
        <div className="flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl font-semibold text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Your budget is healthy. Keep up the disciplined spending!</span>
        </div>
      )}

      {/* Main Budget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Stats Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-6 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Budget</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">${totalBudget.toLocaleString()}</h3>
            </div>
            
            <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-6 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase">Spent Amount</span>
              <h3 className={`text-2xl font-bold mt-2 ${totalSpent > totalBudget ? "text-red-400" : "text-slate-800"}`}>
                ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-6 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase">Remaining Budget</span>
              <h3 className={`text-2xl font-bold mt-2 ${remainingBudget < 0 ? "text-red-400" : "text-emerald-400"}`}>
                ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          {/* Quick breakdown of Trip Info */}
          <div className="bg-white backdrop-blur border border-sky-100 rounded-3xl p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Trip Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 bg-white/30 p-4 border border-sky-100 rounded-2xl">
                <MapPin className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Destination</p>
                  <p className="text-sm font-semibold" style={{color:"var(--text-heading)"}}>{selectedTrip?.destination}, {selectedTrip?.country}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white/30 p-4 border border-sky-100 rounded-2xl">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs text-slate-400">Dates</p>
                  <p className="text-sm font-semibold" style={{color:"var(--text-heading)"}}>
                    {selectedTrip ? `${new Date(selectedTrip.startDate).toLocaleDateString()} - ${new Date(selectedTrip.endDate).toLocaleDateString()}` : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white/30 p-4 border border-sky-100 rounded-2xl">
                <TrendingUp className="w-5 h-5 text-pink-400" />
                <div>
                  <p className="text-xs text-slate-400">Travel Type</p>
                  <p className="text-sm font-semibold" style={{color:"var(--text-heading)"}}>{selectedTrip?.travelType} with {selectedTrip?.travelers} travelers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Circular Progress Side Card */}
        <div className="bg-white backdrop-blur border border-sky-100 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Budget Utilization</h3>
          
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-gray-800 fill-none"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className={`fill-none ${percentUsed >= 100 ? "stroke-red-500" : percentUsed >= 80 ? "stroke-amber-500" : "stroke-blue-500"}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={percentUsed >= 100 ? 0 : strokeDashoffset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: percentUsed >= 100 ? 0 : strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-sans text-white">{percentUsed.toFixed(0)}%</span>
              <span className="text-xs text-slate-400 font-medium">Used</span>
            </div>
          </div>

          <p className="text-sm mt-6 text-slate-500 max-w-xs leading-relaxed">
            {percentUsed >= 100 
              ? "You have breached the budget limit specified for this trip. Consider reviewing transport and other discretionary spends."
              : percentUsed >= 80 
              ? "Spending is accelerated. You are nearing the budget set point of this trip."
              : "Spending pace looks perfect. Everything is currently inside target parameters."}
          </p>
        </div>
      </div>
      {/* AI Budget Advisor */}
      {selectedTrip && (
        <div className="bg-white backdrop-blur border border-sky-100 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{color:"var(--text-heading)"}}>AI Budget Advisor</h3>
                <p className="text-xs text-slate-500">Powered by Google Gemini</p>
              </div>
            </div>
            <button
              onClick={fetchAIInsights}
              disabled={aiLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{aiLoading ? "Thinking…" : aiTips.length ? "Refresh Tips" : "Get AI Tips"}</span>
            </button>
          </div>

          {aiError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{aiError}</p>
          )}

          {aiLoading && (
            <div className="space-y-3">
              {[1,2,3].map(n => (
                <div key={n} className="h-12 bg-white/80 rounded-xl animate-pulse"></div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {!aiLoading && aiTips.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {aiTips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start space-x-3 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/15 rounded-2xl p-4"
                  >
                    <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!aiLoading && aiTips.length === 0 && !aiError && (
            <p className="text-sm text-slate-400 text-center py-4">
              Click "Get AI Tips" to receive personalised cost-saving suggestions for {selectedTrip.destination}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
