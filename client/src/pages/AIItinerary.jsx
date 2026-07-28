import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MapPin, Calendar, Users, DollarSign, 
  ChevronDown, ChevronUp, Utensils, Bus, Lightbulb,
  Save, RefreshCw, Clock, BadgeDollarSign, Bot,
  CheckCircle
} from "lucide-react";

const TRAVEL_STYLES = ["Adventure", "Luxury", "Family", "Business", "Backpacking", "Food", "Nature"];
const INTERESTS = ["History", "Photography", "Shopping", "Museums", "Beaches", "Nightlife"];

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-6 animate-pulse space-y-4">
      <div className="h-5 w-32 bg-sky-100 rounded-lg"></div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-white rounded-lg"></div>
        <div className="h-4 w-3/4 bg-white rounded-lg"></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(n => <div key={n} className="h-16 bg-white rounded-xl"></div>)}
      </div>
    </div>
  );
}

// ─── AI Thinking Animation ────────────────────────────────────────────────────
function AIThinkingLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Bot className="w-8 h-8 text-purple-400" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-white">Crafting your itinerary…</p>
        <p className="text-sm text-slate-500">Gemini is planning your perfect trip</p>
      </div>
      <div className="flex space-x-2">
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-500 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
          />
        ))}
      </div>
      <div className="w-full max-w-sm space-y-3">
        {[1,2,3].map(n => <SkeletonCard key={n} />)}
      </div>
    </div>
  );
}

// ─── Day Card ────────────────────────────────────────────────────────────────
function DayCard({ dayData, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const { day, morning, afternoon, evening, restaurants, transport, estimatedBudget, tips } = dayData;

  const timeBlocks = [
    { label: "Morning", value: morning, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-500/20" },
    { label: "Afternoon", value: afternoon, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-500/20" },
    { label: "Evening", value: evening, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-500/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white/80 backdrop-blur border border-sky-100 rounded-3xl overflow-hidden shadow-xl"
    >
      {/* Day Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-purple-500/20">
            {day}
          </div>
          <div className="text-left">
            <p className="font-bold text-white text-lg">Day {day}</p>
            <p className="text-xs text-slate-400 line-clamp-1">{morning?.substring(0, 60)}…</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            {estimatedBudget}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 space-y-5 border-t border-sky-100 pt-5">
              {/* Time Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {timeBlocks.map(({ label, value, color, bg }) => (
                  <div key={label} className={`p-4 rounded-2xl border ${bg} space-y-1`}>
                    <div className="flex items-center space-x-1 mb-2">
                      <Clock className={`w-3.5 h-3.5 ${color}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restaurants */}
                {restaurants?.length > 0 && (
                  <div className="bg-white/30 border border-sky-100 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Utensils className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold" style={{color:"var(--text-heading)"}}>Restaurants</span>
                    </div>
                    <ul className="space-y-1.5">
                      {restaurants.map((r, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-start space-x-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Transport */}
                <div className="bg-white/30 border border-sky-100 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Bus className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold" style={{color:"var(--text-heading)"}}>Transport</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{transport}</p>
                </div>
              </div>

              {/* Tips */}
              {tips?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300/50 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-800">Insider Tips</span>
                  </div>
                  <ul className="space-y-1.5">
                    {tips.map((tip, i) => (
                      <li key={i} className="text-xs text-yellow-900 flex items-start space-x-2">
                        <span className="text-yellow-700 mt-0.5 font-bold">{i + 1}.</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIItinerary() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    budget: "",
    travelStyle: "Adventure",
    interests: [],
  });

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleGenerate = async () => {
    setError("");
    setSaved(false);

    if (!form.destination || !form.startDate || !form.endDate || !form.budget) {
      return setError("Please fill in Destination, Dates, and Budget.");
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return setError("End date must be after start date.");
    }

    setLoading(true);
    setItinerary(null);
    try {
      const { data } = await api.post("/ai/itinerary/generate", form);
      setItinerary(data.itinerary);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!itinerary) return;
    setSaving(true);
    try {
      await api.post("/ai/itinerary/save", {
        destination: form.destination,
        prompt: form,
        generatedItinerary: itinerary,
      });
      setSaved(true);
    } catch (err) {
      setError("Failed to save itinerary.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{color:"var(--text-heading)"}}>AI Trip Planner</h1>
          <p className="text-slate-500 mt-0.5">Powered by Google Gemini — your personal travel architect</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white backdrop-blur border border-sky-100 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" /><span>Destination *</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Kyoto, Japan"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5" /><span>Budget (USD) *</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 3000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" /><span>Start Date *</span>
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" /><span>End Date *</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Users className="w-3.5 h-3.5" /><span>Travelers</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.travelers}
              onChange={(e) => setForm({ ...form, travelers: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Travel Style</label>
            <select
              value={form.travelStyle}
              onChange={(e) => setForm({ ...form, travelStyle: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500 transition-colors"
            >
              {TRAVEL_STYLES.map(s => <option key={s} value={s} className="text-slate-800">{s}</option>)}
            </select>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  form.interests.includes(interest)
                    ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-white border-sky-100 text-slate-500 hover:border-gray-500"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          <span>{loading ? "Generating…" : "Generate Itinerary"}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && <AIThinkingLoader />}

      {/* Results */}
      {!loading && itinerary && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-teal-400/20 to-cyan-400/20 border border-teal-400/30 backdrop-blur rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{color:"var(--text-heading)"}}>{form.destination}</h2>
                <p className="text-slate-500 text-sm mt-1">{form.startDate} → {form.endDate} · {form.travelers} traveler(s)</p>
              </div>
              <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold">
                Est. {itinerary.estimatedCost}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">{itinerary.summary}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerate}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-sky-100 text-slate-700 font-medium rounded-xl border border-sky-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-teal-500" />
              <span>Regenerate</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex items-center space-x-2 px-5 py-2.5 font-medium rounded-xl border transition-colors ${
                saved
                  ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              }`}
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Saving…" : saved ? "Saved!" : "Save Itinerary"}</span>
            </button>
          </div>

          {/* Day Cards Timeline */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold" style={{color:"var(--text-heading)"}}>Day-by-Day Plan</h3>
            {itinerary.days?.map((day, i) => (
              <DayCard key={day.day} dayData={day} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
