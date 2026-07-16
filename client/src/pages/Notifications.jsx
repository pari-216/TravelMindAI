import React, { useState, useEffect } from "react";
import {
  Bell, Check, Trash2, Calendar, ShieldAlert, Award, Briefcase,
  BookOpen, Heart, Coins, DollarSign, Sparkles, CloudRain, AlertCircle
} from "lucide-react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";

const ICON_MAP = {
  trip: Calendar,
  budget: ShieldAlert,
  reminder: Bell,
  ai: Sparkles,
  packing: Briefcase,
  weather: CloudRain,
  hotel: Heart,
  system: Award,
};

const COLOR_MAP = {
  trip: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  budget: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  reminder: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  ai: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  packing: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  weather: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  hotel: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  system: "text-slate-500 bg-gray-500/10 border-gray-500/20",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "unread"

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently catch
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      const item = notifications.find(n => n._id === id);
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (item && !item.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
    } catch {}
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications permanently?")) return;
    try {
      await api.delete("/notifications");
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const filtered = notifications.filter(n => filter === "all" || !n.read);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-400" /> Notifications
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Stay updated with reminders, weather warnings, and AI insights.</p>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-sky-100 hover:border-sky-100 text-slate-600 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/30 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex border-b border-sky-100 gap-6">
          {[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`pb-3 font-semibold text-sm transition relative cursor-pointer ${
                filter === tab.id ? "text-blue-400" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {filter === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Body list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-white border border-sky-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white/20 rounded-3xl border border-sky-100">
            <Bell className="w-14 h-14 mx-auto mb-4 opacity-15" />
            <p className="font-semibold text-lg">Clean slate!</p>
            <p className="text-sm mt-0.5">You don't have any notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const Icon = ICON_MAP[item.type] || Award;
              const colorClasses = COLOR_MAP[item.type] || "text-slate-500 bg-white";
              return (
                <div
                  key={item._id}
                  className={`flex items-start justify-between gap-4 p-4 border rounded-2xl transition duration-200 ${
                    item.read
                      ? "bg-white/20 border-gray-900/60 opacity-60"
                      : "bg-white border-sky-100 shadow-md hover:border-sky-100"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Left Icon */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorClasses}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    {/* Text */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold ${item.read ? "text-slate-600" : "text-slate-800"}`}>
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.message}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 self-center">
                    {!item.read && (
                      <button
                        onClick={() => handleMarkRead(item._id)}
                        className="p-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-sky-700 rounded-xl transition cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-sky-700 rounded-xl transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </PageTransition>
  );
}
