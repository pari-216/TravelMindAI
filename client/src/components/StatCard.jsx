import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, colorClass, gradientClass }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="relative overflow-hidden rounded-2xl p-6 flex flex-col items-start justify-center group"
      style={{
        background: "#fff",
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--shadow-card)"
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow-card)"}
    >
      {/* Gradient blob top-right */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientClass} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`} />
      
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform ${colorClass}`}
        style={{ background: "var(--bg-highlight)", border: "1px solid var(--border-color)" }}
      >
        <Icon className="w-6 h-6" />
      </div>
      
      <h4 className="text-3xl font-bold mb-1 tracking-tight" style={{ color: "var(--text-heading)" }}>{value}</h4>
      <p className="text-sm font-medium uppercase tracking-wide transition-colors" style={{ color: "var(--text-muted)" }}>{label}</p>
    </motion.div>
  );
}
