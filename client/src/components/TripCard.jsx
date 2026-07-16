import { motion } from "framer-motion";
import { Edit2, Trash2, Eye, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

export default function TripCard({ trip }) {
  const formattedStartDate = trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "";
  const formattedEndDate = trip.endDate ? new Date(trip.endDate).toLocaleDateString() : "";

  const statusStyle = {
    Upcoming: { bg: "rgba(56,189,248,0.12)", color: "#0284C7", border: "rgba(56,189,248,0.30)" },
    Ongoing:  { bg: "rgba(34,197,94,0.12)",  color: "#16A34A", border: "rgba(34,197,94,0.30)" },
    Completed:{ bg: "rgba(100,116,139,0.10)", color: "#475569", border: "rgba(100,116,139,0.25)" },
  };
  const s = statusStyle[trip.status] || statusStyle["Completed"];

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="rounded-2xl overflow-hidden flex flex-col group"
      style={{
        background: "#fff",
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--shadow-card)",
        transition: "box-shadow 0.25s ease"
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow-card)"}
    >
      {/* Image Header */}
      <div className="h-48 w-full relative overflow-hidden" style={{ background: "#EFF8FF" }}>
        <img 
          src={trip.coverImage || trip.image || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80`} 
          alt={trip.destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(248,252,255,0.70), transparent)" }} />
        {/* Status badge */}
        <div
          className="absolute top-4 right-4 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
          {trip.status}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>{trip.destination}</h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm" style={{ color: "var(--text-muted)" }}>
              <Calendar className="w-4 h-4 mr-2" style={{ color: "var(--color-primary)" }} />
              {trip.dates || `${formattedStartDate} - ${formattedEndDate}`}
            </div>
            <div className="flex items-center text-sm" style={{ color: "var(--text-muted)" }}>
              <DollarSign className="w-4 h-4 mr-2" style={{ color: "var(--color-accent)" }} />
              Budget: <span className="ml-1 font-semibold" style={{ color: "var(--text-primary)" }}>{trip.budget}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-2" style={{ borderTop: "1px solid var(--border-color)" }}>
          <Link
            to={`/dashboard/trips/${trip._id || 1}`}
            className="text-sm font-semibold flex items-center transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            <Eye className="w-4 h-4 mr-1.5" /> View
          </Link>
          
          <div className="flex space-x-2">
            <Link
              to={`/dashboard/trips/${trip._id || 1}/edit`}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-highlight)"; e.currentTarget.style.color = "var(--color-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <Edit2 className="w-4 h-4" />
            </Link>
            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
