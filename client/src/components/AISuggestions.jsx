import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function AISuggestions() {
  const suggestions = [
    "Visit hidden cafes in Kyoto",
    "Carry sunscreen in Bali",
    "Best local food near Eiffel Tower"
  ];

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      {/* Decorative blob */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none"
        style={{ background: "rgba(56,189,248,0.20)" }} />
      
      <div className="flex items-center space-x-2 mb-4 relative">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-bold" style={{ color: "var(--text-heading)" }}>AI Suggestions</h3>
      </div>
      
      <ul className="space-y-2.5 relative">
        {suggestions.map((suggestion, idx) => (
          <motion.li 
            key={idx}
            whileHover={{ x: 5 }}
            className="flex items-center text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
            style={{
              background: "rgba(255,255,255,0.70)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.95)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.70)"}
          >
            <div className="w-1.5 h-1.5 rounded-full mr-3 shrink-0" style={{ background: "var(--color-primary)" }} />
            {suggestion}
          </motion.li>
        ))}
      </ul>
      
      <button
        className="mt-5 w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all relative"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "0 4px 16px rgba(56,189,248,0.35)"
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        Generate AI Itinerary
      </button>
    </div>
  );
}
