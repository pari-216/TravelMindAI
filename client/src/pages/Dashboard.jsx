import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import api from "../services/api";
import { motion } from "framer-motion";
import { 
  Map, Globe, Wallet, PlusCircle, Sparkles, 
  Bot, DollarSign, ListTodo, BookOpen, MapPin
} from "lucide-react";
import StatCard from "../components/StatCard";
import TripCard from "../components/TripCard";
import UpcomingReminders from "../components/UpcomingReminders";
import RecentExpenses from "../components/RecentExpenses";
import PackingProgress from "../components/PackingProgress";
import AISuggestions from "../components/AISuggestions";

export default function Dashboard() {
  const { user, token } = useAuth();
  const { settings } = useSettings();
  
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [weather, setWeather] = useState(null);
  const [favoriteDestinations, setFavoriteDestinations] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [tripsRes, expensesRes, destRes] = await Promise.all([
          axios.get("http://localhost:5000/api/trips", config),
          axios.get("http://localhost:5000/api/expenses", config),
          api.get("/destinations").catch(() => ({ data: [] }))
        ]);

        setTrips(tripsRes.data);
        setExpenses(expensesRes.data);
        setFavoriteDestinations(destRes.data || []);

        const trip = tripsRes.data.find(t => t.status === "Ongoing") || tripsRes.data[0];
        if (trip) {
          setCurrentTrip(trip);
          try {
            const { data } = await axios.get(
              `http://localhost:5000/api/weather?destination=${encodeURIComponent(trip.destination)}`,
              config
            );
            setWeather(data);
          } catch (err) {
            console.error("Error fetching weather for dashboard", err);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard statistics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const activeTripsCount = trips.filter(t => t.status === "Ongoing").length;
  const countriesVisited = new Set(trips.map(t => t.country?.trim().toLowerCase()).filter(Boolean)).size;
  const totalBudget = trips.reduce((sum, t) => sum + t.budget, 0);

  const quickActions = [
    { name: "New Trip",      icon: PlusCircle, path: "/dashboard/trips/new",       gradient: "linear-gradient(135deg,#38BDF8,#0EA5E9)", shadow: "rgba(56,189,248,0.30)" },
    { name: "AI Itinerary",  icon: Sparkles,   path: "/dashboard/planner",          gradient: "linear-gradient(135deg,#A78BFA,#7C3AED)", shadow: "rgba(167,139,250,0.30)" },
    { name: "AI Assistant",  icon: Bot,        path: "/dashboard/planner",          gradient: "linear-gradient(135deg,#06B6D4,#0891B2)", shadow: "rgba(6,182,212,0.30)" },
    { name: "Add Expense",   icon: DollarSign, path: "/dashboard/expenses",         gradient: "linear-gradient(135deg,#34D399,#059669)", shadow: "rgba(52,211,153,0.30)" },
    { name: "Packing List",  icon: ListTodo,   path: "/dashboard/packing",          gradient: "linear-gradient(135deg,#FFD166,#F59E0B)", shadow: "rgba(255,209,102,0.30)" },
    { name: "Write Journal", icon: BookOpen,   path: "/dashboard/journal",          gradient: "linear-gradient(135deg,#F87171,#EF4444)", shadow: "rgba(248,113,113,0.30)" },
  ];

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="h-10 w-64 rounded-xl animate-pulse" style={{ background: "var(--bg-highlight)" }} />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--bg-highlight)", border: "1px solid var(--border-color)" }} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(n => (
            <div key={n} className="h-32 rounded-2xl animate-pulse" style={{ background: "var(--bg-highlight)", border: "1px solid var(--border-color)" }} />
          ))}
        </div>
      </div>
    );
  }

  const layout = settings?.dashboardLayout || ["analytics", "weather", "budget", "trips", "suggestions", "reminders", "favorites"];

  const renderWidget = (id) => {
    switch (id) {
      case "analytics":
        return (
          <div key="analytics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard label="Active Trips"      value={activeTripsCount.toString()} icon={Map}    colorClass="text-sky-500"   gradientClass="from-sky-400 to-cyan-400" />
            <StatCard label="Countries Visited" value={countriesVisited.toString()}  icon={Globe}  colorClass="text-violet-500" gradientClass="from-violet-400 to-purple-400" />
            <StatCard label="Total Budget"      value={`$${totalBudget.toLocaleString()}`} icon={Wallet} colorClass="text-emerald-500" gradientClass="from-emerald-400 to-teal-400" />
          </div>
        );
      
      case "weather":
        return weather && currentTrip ? (
          <div
            key="weather"
            className="rounded-3xl p-6 space-y-4"
            style={{ background: "#fff", border: "1.5px solid var(--border-color)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base" style={{ color: "var(--text-heading)" }}>Current Weather</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{currentTrip.destination}</p>
              </div>
              <span className="text-2xl font-extrabold" style={{ color: "var(--text-heading)" }}>
                {settings.travel?.tempUnit === "fahrenheit" 
                  ? `${Math.round((weather.current.temp * 9/5) + 32)}°F` 
                  : `${weather.current.temp}°C`}
              </span>
            </div>
            <div
              className="flex items-center space-x-3 p-3 rounded-2xl"
              style={{ background: "var(--bg-highlight)", border: "1px solid var(--border-color)" }}
            >
              <img 
                src={`https://openweathermap.org/img/wn/${weather.current.icon}@2x.png`} 
                alt="Weather Icon" 
                className="w-12 h-12" 
              />
              <div>
                <p className="text-sm font-bold capitalize" style={{ color: "var(--text-heading)" }}>{weather.current.description}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Feels like {settings.travel?.tempUnit === "fahrenheit" ? `${Math.round((weather.current.feels_like * 9/5) + 32)}°F` : `${weather.current.feels_like}°C`} • Wind {weather.current.wind_speed} m/s
                </p>
              </div>
            </div>
          </div>
        ) : null;

      case "budget":
        return (
          <div key="budget">
            <RecentExpenses expenses={expenses} />
          </div>
        );

      case "trips":
        return (
          <div key="trips" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-heading)" }}>Recent Trips</h2>
              <Link to="/dashboard/trips" className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>View all</Link>
            </div>
            {trips.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "var(--bg-highlight)", border: "1.5px dashed var(--border-color)", color: "var(--text-muted)" }}
              >
                No trips logged yet. Select "New Trip" to start tracking!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trips.slice(0, 2).map(trip => (
                  <TripCard key={trip._id} trip={trip} />
                ))}
              </div>
            )}
          </div>
        );

      case "suggestions":
        return <AISuggestions key="suggestions" />;

      case "reminders":
        return <UpcomingReminders key="reminders" />;

      case "favorites":
        return favoriteDestinations.length > 0 ? (
          <div
            key="favorites"
            className="rounded-3xl p-6 space-y-4"
            style={{ background: "#fff", border: "1.5px solid var(--border-color)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: "var(--text-heading)" }}>Favorite Places</h3>
              <Link to="/dashboard/favorites" className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>Manage</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {favoriteDestinations.slice(0, 4).map(dest => (
                <div
                  key={dest._id}
                  className="rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: "var(--bg-highlight)", border: "1px solid var(--border-color)" }}
                >
                  <img src={dest.imageUrl} alt={dest.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: "var(--text-heading)" }}>{dest.name}</p>
                    <p className="text-[9px] truncate" style={{ color: "var(--text-muted)" }}>{dest.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-heading)" }}>
            Welcome back, {user?.name || "Traveler"} 👋
          </h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>Here is what's happening with your trips today.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full"
            >
              <Link
                to={action.path}
                className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group h-full"
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--border-color)",
                  boxShadow: "var(--shadow-sm)"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 24px ${action.shadow}`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm"
                  style={{ background: action.gradient }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-center" style={{ color: "var(--text-primary)" }}>{action.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Dynamic widgets layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {layout
            .filter(id => ["analytics", "trips", "budget"].includes(id))
            .map(id => renderWidget(id))}
        </div>
        <div className="space-y-8">
          {layout
            .filter(id => ["weather", "reminders", "favorites", "suggestions"].includes(id))
            .map(id => renderWidget(id))}
        </div>
      </div>

    </div>
  );
}
