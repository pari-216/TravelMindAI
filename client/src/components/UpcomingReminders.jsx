import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plane, CheckCircle2, Clock, MapPin, Wallet, Tag } from "lucide-react";
import api from "../services/api";

export default function UpcomingReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await api.get("/reminders/upcoming");
        setReminders(res.data);
      } catch (err) {
        console.error("Failed to load upcoming reminders");
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  const getIcon = (type) => {
    const base = "w-5 h-5";
    switch (type) {
      case 'Flight':        return <Plane className={base} style={{ color: "var(--color-primary)" }} />;
      case 'Hotel':         return <CheckCircle2 className={base} style={{ color: "#22C55E" }} />;
      case 'Packing':       return <Clock className={base} style={{ color: "var(--color-accent)" }} />;
      case 'Transportation':return <MapPin className={base} style={{ color: "var(--color-secondary)" }} />;
      case 'Expense':       return <Wallet className={base} style={{ color: "#EF4444" }} />;
      default:              return <Tag className={base} style={{ color: "var(--text-muted)" }} />;
    }
  };

  const getPriorityDot = (priority) => {
    const color = priority === "High" ? "#EF4444" : priority === "Medium" ? "#F59E0B" : "#22C55E";
    return <span className="w-2 h-2 rounded-full mr-2 shrink-0 inline-block" style={{ background: color }} />;
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "#fff",
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold" style={{ color: "var(--text-heading)" }}>Upcoming Reminders</h3>
        <Link
          to="/dashboard/reminders"
          className="text-sm font-semibold"
          style={{ color: "var(--color-primary)" }}
        >
          View all
        </Link>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(n => (
            <div key={n} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--bg-highlight)" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {reminders.length === 0 ? (
            <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
              No upcoming reminders.
            </div>
          ) : (
            reminders.map((reminder, idx) => (
              <div key={reminder._id} className="flex relative">
                {/* Connector line */}
                {idx !== reminders.length - 1 && (
                  <div className="absolute left-[1.15rem] top-10 w-[2px] h-10" style={{ background: "var(--border-color)" }} />
                )}
                
                {/* Icon circle */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                  style={{ background: "var(--bg-highlight)", border: "1.5px solid var(--border-color)" }}
                >
                  {getIcon(reminder.type)}
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    {getPriorityDot(reminder.priority)}
                    <h4 className="text-sm font-semibold truncate" style={{ color: "var(--text-heading)" }}>{reminder.title}</h4>
                  </div>
                  <p className="text-xs mt-1 pl-4 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <Calendar className="w-3 h-3" /> {reminder.date} &nbsp;
                    <Clock className="w-3 h-3 ml-1" /> {reminder.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
