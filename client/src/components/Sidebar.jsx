import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Map, 
  Wallet, 
  Receipt, 
  Briefcase, 
  Sparkles, 
  MessageCircle,
  BookOpen, 
  BedDouble, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Coins,
  BarChart3,
  Heart
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const { logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { name: "My Trips", href: "/dashboard/trips", icon: Map },
    { name: "Budget", href: "/dashboard/budget", icon: Wallet },
    { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    { name: "Packing Lists", href: "/dashboard/packing", icon: Briefcase },
    { name: "AI Planner", href: "/dashboard/ai-itinerary", icon: Sparkles },
    { name: "AI Chat", href: "/dashboard/ai-chat", icon: MessageCircle },
    { name: "Travel Journal", href: "/dashboard/journal", icon: BookOpen },
    { name: "Hotels", href: "/dashboard/hotels", icon: BedDouble },
    { name: "Currency", href: "/dashboard/currency", icon: Coins },
    { name: "Reminders", href: "/dashboard/reminders", icon: Bell },
  ];

  const bottomNavigation = [
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    
    return (
      <Link
        to={item.href}
        className={`flex items-center space-x-3 px-3 py-3 mt-1 rounded-xl transition-all duration-200 group ${
          isActive 
            ? "sidebar-active" 
            : "hover:bg-sky-50 text-slate-500 hover:text-sky-700"
        }`}
        style={isActive ? {} : {}}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 transition-colors ${
            isActive
              ? "text-sky-600"
              : "text-slate-400 group-hover:text-sky-500"
          }`}
          style={isActive ? { background: "linear-gradient(135deg,#38BDF8,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : {}}
        />
        <AnimatePresence>
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className={`font-medium whitespace-nowrap text-sm ${isActive ? "text-sky-700" : ""}`}
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
        {/* Gold accent indicator */}
        {isActive && isOpen && (
          <motion.div
            layoutId="sidebar-gold-indicator"
            className="ml-auto w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-accent)" }}
          />
        )}
      </Link>
    );
  };

  return (
    <motion.div 
      className={`relative z-20 flex flex-col border-r transition-all duration-300 ${isOpen ? "w-64" : "w-20"}`}
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-color)",
        boxShadow: "2px 0 20px rgba(56,189,248,0.08)"
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between p-4 h-20 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2 overflow-hidden"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-lg font-bold truncate"
                style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                TravelMind AI
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <div
            className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-24 border rounded-full p-1 transition z-50 flex items-center justify-center h-6 w-6"
        style={{
          background: "#fff",
          borderColor: "var(--border-color)",
          color: "var(--color-primary)",
          boxShadow: "0 2px 8px rgba(56,189,248,0.18)"
        }}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <div className="mb-2 px-3 py-1">
          {isOpen && (
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Menu
            </p>
          )}
        </div>
        <div className="space-y-0.5">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div
        className="p-3 border-t"
        style={{ borderColor: "var(--border-color)", background: "rgba(56,189,248,0.03)" }}
      >
        {isOpen && (
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3 mt-1" style={{ color: "var(--text-muted)" }}>
            Preferences
          </p>
        )}
        {bottomNavigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-3 mt-1 rounded-xl transition-all duration-200 group"
          style={{ color: "#EF4444" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 group-hover:text-red-500 transition-colors" />
          <AnimatePresence>
            {isOpen && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium whitespace-nowrap text-sm"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
