import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Sun, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Notifications State
  const [unreadCount, setUnreadCount] = useState(0);

  const userName = user?.name || "Traveler";
  const userInitial = userName.charAt(0).toUpperCase();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Scroll detection for navbar opacity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch unread count initially and poll every 30s
  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get("/notifications");
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Optional catch
    }
  };

  // Close search results dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced search logic (300ms)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.results || {});
        setShowSearchResults(true);
      } catch {
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Highlight search matching word helper
  const highlightMatch = (text, query) => {
    if (!text) return "";
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="rounded px-0.5" style={{ background: "rgba(56,189,248,0.25)", color: "#0284C7", fontWeight: 700 }}>{part}</mark>
      ) : (
        part
      )
    );
  };

  const hasResults = searchResults && Object.values(searchResults).some((arr) => arr.length > 0);

  return (
    <div
      className="h-20 flex items-center justify-between px-6 md:px-8 z-30 sticky top-0 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(255,255,255,0.92)"
          : "rgba(255,255,255,0.70)",
        backdropFilter: "blur(16px) saturate(150%)",
        borderBottom: `1px solid ${scrolled ? "var(--border-color)" : "rgba(217,242,255,0.5)"}`,
        boxShadow: scrolled ? "0 2px 20px rgba(56,189,248,0.10)" : "none",
      }}
    >
      
      {/* Left side - Search bar */}
      <div className="flex-1 flex items-center" ref={searchRef}>
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-primary)" }} />
            ) : (
              <Search className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            className="block w-full pl-10 pr-3 py-2.5 rounded-xl leading-5 transition-all sm:text-sm outline-none"
            style={{
              background: "rgba(248,252,255,0.9)",
              border: `1.5px solid var(--border-color)`,
              color: "var(--text-primary)",
              boxShadow: "0 1px 4px rgba(56,189,248,0.06)"
            }}
            onFocusCapture={e => {
              e.target.style.borderColor = "var(--color-primary)";
              e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)";
            }}
            onBlurCapture={e => {
              e.target.style.borderColor = "var(--border-color)";
              e.target.style.boxShadow = "0 1px 4px rgba(56,189,248,0.06)";
            }}
            placeholder="Search trips, expenses, places..."
          />

          {/* Results panel */}
          <AnimatePresence>
            {showSearchResults && searchQuery.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden max-h-96 overflow-y-auto z-50 p-2 custom-scrollbar"
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--border-color)",
                  boxShadow: "0 8px 32px rgba(56,189,248,0.15)"
                }}
              >
                {!hasResults && !searchLoading && (
                  <div className="p-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    No matching results found for "{searchQuery}"
                  </div>
                )}

                {hasResults &&
                  Object.entries(searchResults).map(([category, items]) => {
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="mb-3 last:mb-0">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          {category}
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {items.map((item) => (
                            <Link
                              key={item.id}
                              to={item.link}
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl transition text-left"
                              style={{ color: "var(--text-primary)" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-highlight)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <span className="text-sm">{item.icon}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: "var(--text-heading)" }}>
                                  {highlightMatch(item.title, searchQuery)}
                                </p>
                                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                                  {highlightMatch(item.subtitle, searchQuery)}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-4 md:space-x-5">
        
        <div className="hidden md:flex text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {today}
        </div>

        {/* Notifications page link */}
        <Link
          to="/dashboard/notifications"
          className="p-2 rounded-full transition-all relative"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-highlight)"; e.currentTarget.style.color = "var(--color-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-white"
              style={{ background: "var(--color-error)" }}>
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 focus:outline-none cursor-pointer"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
              style={{
                background: "var(--gradient-primary)",
                border: "2px solid var(--border-color)",
                boxShadow: "var(--shadow-blue)"
              }}
            >
              {userInitial}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>{userName}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Premium Member</p>
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 w-52 mt-3 origin-top-right rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--border-color)",
                  boxShadow: "0 12px 40px rgba(56,189,248,0.18)"
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-color)", background: "var(--bg-highlight)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>{userName}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email || "user@example.com"}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-highlight)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <UserIcon className="h-4 w-4 mr-3" style={{ color: "var(--color-primary)" }} />
                    My Profile
                  </Link>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center px-4 py-2.5 text-sm rounded-xl transition-colors cursor-pointer"
                    style={{ color: "#EF4444" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
