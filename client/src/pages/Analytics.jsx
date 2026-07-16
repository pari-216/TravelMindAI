import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import {
  BarChart3, Calendar, Compass, ShieldAlert, Award, Briefcase, BookOpen,
  Heart, Coins, DollarSign, Wallet, Users, LayoutDashboard, History,
  TrendingUp, TrendingDown, Clock, CheckSquare, Sparkles
} from "lucide-react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import { SkeletonStats } from "../components/SkeletonLoader";

const COLORS = ["#38BDF8", "#06B6D4", "#FFD166", "#22C55E", "#F59E0B", "#A78BFA"];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "timeline"
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Timeline pagination
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === "timeline") {
      fetchTimeline(page);
    }
  }, [activeTab, page]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/analytics/summary");
      setSummary(data);
    } catch (err) {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (p) => {
    try {
      setTimelineLoading(true);
      const { data } = await api.get(`/activity?page=${p}&limit=15`);
      setActivities(data.activities || []);
      setTotalPages(data.pages || 1);
    } catch {
      // Optional fallback
    } finally {
      setTimelineLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats />
        <div className="h-96 bg-white rounded-3xl border border-sky-100 animate-pulse" />
      </div>
    );
  }

  const stats = summary?.stats || {};
  const charts = summary?.charts || {};

  return (
    <PageTransition>
      <div className="space-y-6 pb-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 heading-gradient">
              <BarChart3 className="w-8 h-8 text-blue-400" /> Travel Analytics
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Interactive overview of your journeys, spending, and travel style.</p>
          </div>
          
          {/* Tab selector */}
          <div className="flex gap-1 bg-white/80 rounded-2xl p-1 border border-sky-100">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "dashboard" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-sky-700"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "timeline" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-sky-700"
              }`}
            >
              <History className="w-4 h-4" /> Timeline
            </button>
          </div>
        </div>

        {activeTab === "dashboard" ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatItem title="Total Trips" value={stats.totalTrips} icon={Compass} color="text-blue-400" />
              <StatItem title="Countries Visited" value={stats.countriesVisited} icon={Award} color="text-amber-400" />
              <StatItem title="Cities Visited" value={stats.citiesVisited} icon={Compass} color="text-emerald-400" />
              <StatItem title="Budget Allocated" value={`$${stats.totalBudget}`} icon={Wallet} color="text-violet-400" />
              <StatItem title="Total Spent" value={`$${stats.totalExpenses}`} icon={DollarSign} color="text-rose-400" />
              <StatItem title="Money Saved" value={`$${stats.moneySaved}`} icon={Coins} color="text-emerald-400" />
              <StatItem title="Daily Avg Spending" value={`$${stats.avgDailySpending}`} icon={TrendingUp} color="text-amber-400" />
              <StatItem title="Avg Trip Duration" value={`${stats.avgTripDuration} days`} icon={Clock} color="text-cyan-400" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Monthly Expenses Area Chart */}
              <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-800 mb-4">Monthly Expenses</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.monthlyExpenses}>
                      <defs>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0F2FE" />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#D9F2FF", color: "#334155", borderRadius: "12px", boxShadow: "0 4px 20px rgba(56,189,248,0.15)" }} />
                      <Area type="monotone" dataKey="expenses" stroke="#38BDF8" fillOpacity={1} fill="url(#colorExpenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget vs Actual Bar Chart */}
              <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-800 mb-4">Budget vs Actual Spending</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.budgetVsActual}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0F2FE" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#D9F2FF", color: "#334155", borderRadius: "12px", boxShadow: "0 4px 20px rgba(56,189,248,0.15)" }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="budget" name="Allocated Budget" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" name="Actual Spent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Categories Pie Chart */}
              <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-800 mb-4">Expense Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.expenseCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.expenseCategories?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {charts.expenseCategories?.slice(0, 6).map((cat, idx) => (
                      <div key={cat.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-slate-500 font-medium">{cat.name}</span>
                        </div>
                        <span className="font-bold text-slate-700">${cat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Travel Style Donut Chart */}
              <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-800 mb-4">Travel Styles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.travelStyles}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          labelLine={false}
                          dataKey="value"
                        >
                          {charts.travelStyles?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {charts.travelStyles?.map((style, idx) => (
                      <div key={style.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                          <span className="text-slate-500 font-medium">{style.name}</span>
                        </div>
                        <span className="font-bold text-slate-700">{style.value} trips</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          /* Timeline Tab */
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" /> Recent Actions Log
            </h2>

            {timelineLoading && activities.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white border border-sky-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white/20 rounded-3xl border border-sky-100">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No activity logged yet.</p>
                <p className="text-sm mt-0.5">Activities will appear automatically as you plan trips.</p>
              </div>
            ) : (
              <div className="relative border-l border-sky-100 ml-4 pl-6 space-y-6">
                {activities.map((act) => (
                  <div key={act._id} className="relative">
                    {/* Circle icon */}
                    <div className="absolute -left-[37px] top-0.5 w-7 h-7 rounded-full bg-white border border-sky-100 flex items-center justify-center text-sm shadow-md">
                      {act.icon || "📌"}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold">
                        {new Date(act.createdAt).toLocaleString()}
                      </p>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">{act.title}</h4>
                      {act.description && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{act.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-sky-100 hover:border-sky-100 text-slate-600 rounded-xl text-xs font-bold transition disabled:opacity-30 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-white border border-sky-100 hover:border-sky-100 text-slate-600 rounded-xl text-xs font-bold transition disabled:opacity-30 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </PageTransition>
  );
}

function StatItem({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-2xl p-5 flex items-center justify-between shadow-md">
      <div className="space-y-1">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl bg-white/80 border border-sky-100 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
