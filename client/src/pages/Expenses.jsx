import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, Edit2, Trash2, Calendar, DollarSign, Tag, 
  Utensils, Hotel, Car, ShoppingBag, Film, Briefcase, 
  CreditCard, Search, ArrowUpDown, Filter, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from "recharts";

const CATEGORIES = ["Food", "Hotel", "Transport", "Shopping", "Entertainment", "Other"];
const PAYMENT_METHODS = ["Cash", "Card", "UPI"];

const CATEGORY_COLORS = {
  Food: "#F59E0B", // amber
  Hotel: "#3B82F6", // blue
  Transport: "#10B981", // emerald
  Shopping: "#EC4899", // pink
  Entertainment: "#8B5CF6", // purple
  Other: "#6B7280", // gray
};

const CATEGORY_ICONS = {
  Food: Utensils,
  Hotel: Hotel,
  Transport: Car,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Other: Tag,
};

export default function Expenses() {
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Panels State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null); // for editing
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    trip: "",
    category: "Food",
    amount: "",
    date: "",
    paymentMethod: "Cash",
    description: "",
  });

  // Filters State
  const [selectedTripFilter, setSelectedTripFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month, custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // UI Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const tripsRes = await api.get("/trips");
      const expensesRes = await api.get("/expenses");
      
      setTrips(tripsRes.data);
      setExpenses(expensesRes.data);
      
      if (tripsRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, trip: tripsRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch expense dashboard metrics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenAdd = () => {
    setSelectedExpense(null);
    setFormData({
      trip: trips.length > 0 ? trips[0]._id : "",
      category: "Food",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      trip: expense.trip,
      category: expense.category,
      amount: expense.amount,
      date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
      paymentMethod: expense.paymentMethod,
      description: expense.description || "",
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.amount) <= 0) {
      showToast("Expense amount must be positive", "error");
      return;
    }

    try {
      if (selectedExpense) {
        // Edit Mode
        const { data } = await api.put(`/expenses/${selectedExpense._id}`, formData);
        setExpenses(expenses.map((exp) => (exp._id === selectedExpense._id ? data : exp)));
        showToast("Expense updated successfully");
      } else {
        // Add Mode
        const { data } = await api.post("/expenses", formData);
        setExpenses([data, ...expenses]);
        showToast("Expense created successfully");
      }
      setIsModalOpen(false);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save expense", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((exp) => exp._id !== id));
      showToast("Expense deleted successfully");
      setDeleteConfirmId(null);
    } catch (error) {
      showToast("Failed to delete expense", "error");
    }
  };

  // Filter Logic
  const filteredExpenses = expenses.filter((exp) => {
    // Trip Filter
    if (selectedTripFilter !== "all" && exp.trip !== selectedTripFilter) return false;
    
    // Category Filter
    if (categoryFilter !== "all" && exp.category !== categoryFilter) return false;
    
    // Search Query
    if (searchQuery && !exp.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Date Filter
    if (dateFilter !== "all") {
      const expDate = new Date(exp.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        const expDay = new Date(expDate);
        expDay.setHours(0,0,0,0);
        if (expDay.getTime() !== today.getTime()) return false;
      } else if (dateFilter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        if (expDate < oneWeekAgo) return false;
      } else if (dateFilter === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        if (expDate < oneMonthAgo) return false;
      } else if (dateFilter === "custom") {
        if (startDate && expDate < new Date(startDate)) return false;
        if (endDate && expDate > new Date(endDate)) return false;
      }
    }

    return true;
  });

  // Calculate Metrics
  const totalExpenses = filteredExpenses.reduce((sum, current) => sum + current.amount, 0);
  
  // Category Breakdown for Recharts Pie
  const categorySummary = filteredExpenses.reduce((acc, current) => {
    acc[current.category] = (acc[current.category] || 0) + current.amount;
    return acc;
  }, {});

  const pieData = Object.keys(categorySummary).map((key) => ({
    name: key,
    value: parseFloat(categorySummary[key].toFixed(2)),
    color: CATEGORY_COLORS[key] || "#6B7280",
  }));

  // Find Highest Category
  let highestCategory = "N/A";
  let maxSpend = 0;
  Object.keys(categorySummary).forEach((key) => {
    if (categorySummary[key] > maxSpend) {
      maxSpend = categorySummary[key];
      highestCategory = key;
    }
  });

  // Monthly breakdown for Bar chart
  const monthlySummary = filteredExpenses.reduce((acc, current) => {
    const monthYear = new Date(current.date).toLocaleString("default", { month: "short", year: "2-digit" });
    acc[monthYear] = (acc[monthYear] || 0) + current.amount;
    return acc;
  }, {});

  const barData = Object.keys(monthlySummary).map((key) => ({
    month: key,
    amount: parseFloat(monthlySummary[key].toFixed(2)),
  })).reverse();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-white/80 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white/80 rounded-2xl animate-pulse border border-sky-100"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto selection:bg-purple-500/30">
      {/* Title & Add Expense Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans" style={{ color: "var(--text-heading)" }}>Expense Tracker</h1>
          <p className="text-slate-500 mt-1">Track and manage travel costs across your itineraries.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-6 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Spent</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-6 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase">Highest Expense Category</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">
            {highestCategory} {maxSpend > 0 ? `($${maxSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })})` : ""}
          </h3>
        </div>
        <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-6 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Items Logged</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{filteredExpenses.length}</h3>
        </div>
      </div>

      {/* Chart Section */}
      {filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 flex flex-col justify-between">
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-heading)" }}>Category Spread</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 flex flex-col justify-between">
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-heading)" }}>Monthly Spending</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px", color: "#fff" }}
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  />
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters Hub */}
      <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description..." 
                className="pl-10 pr-4 py-2 bg-white border border-sky-100 rounded-xl text-sm text-slate-800 outline-none focus:border-purple-500 transition-colors w-full md:w-60"
              />
            </div>

            {/* Trip Filter */}
            <select
              value={selectedTripFilter}
              onChange={(e) => setSelectedTripFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-sky-100 rounded-xl text-sm text-slate-800 outline-none focus:border-purple-500"
            >
              <option value="all">All Trips</option>
              {trips.map(t => (
                <option key={t._id} value={t._id} className="text-slate-800">{t.destination}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-sky-100 rounded-xl text-sm text-slate-800 outline-none focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="text-slate-800">{cat}</option>
              ))}
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-sky-100 rounded-xl text-sm text-slate-800 outline-none focus:border-purple-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Recent Week</option>
              <option value="month">Recent Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Filters */}
        {dateFilter === "custom" && (
          <div className="flex items-center space-x-3 pt-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-sky-100 rounded-lg text-sm text-slate-800" 
            />
            <span className="text-slate-400">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-sky-100 rounded-lg text-sm text-slate-800" 
            />
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sky-100 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-white/20">
                <th className="px-6 py-4">Expense Details</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-805">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const Icon = CATEGORY_ICONS[exp.category] || Tag;
                  const tripName = trips.find(t => t._id === exp.trip)?.destination || "Trip";
                  
                  return (
                    <tr key={exp._id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center border"
                          style={{ 
                            backgroundColor: `${CATEGORY_COLORS[exp.category]}10`, 
                            borderColor: `${CATEGORY_COLORS[exp.category]}30`, 
                            color: CATEGORY_COLORS[exp.category] 
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{color:"var(--text-heading)"}}>{exp.description || exp.category}</p>
                          <p className="text-xs text-slate-400 font-medium">{tripName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold" style={{color:"var(--text-heading)"}}>
                          ${exp.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(exp.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-white text-slate-600 text-xs font-semibold rounded-md border border-sky-100">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1 px-2.5 bg-white hover:bg-sky-100 text-slate-500 hover:text-sky-700 rounded-lg transition-colors border border-sky-100 text-xs font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(exp._id)}
                          className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-500/20 text-xs font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Form Modal (Add / Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/80 border border-sky-100 rounded-3xl w-full max-w-lg p-6 relative z-10 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>{selectedExpense ? "Edit Expense" : "Add Expense"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 bg-white hover:bg-sky-100 text-slate-500 hover:text-sky-700 rounded-full transition-colors border border-sky-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Select Relational Trip */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Trip Associated *</label>
                  <select
                    name="trip"
                    value={formData.trip}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500"
                  >
                    {trips.map(t => (
                      <option key={t._id} value={t._id} className="text-slate-800">{t.destination}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="text-slate-800">{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Amount ($) *</label>
                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 45"
                      value={formData.amount}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Payment Method *</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500"
                    >
                      {PAYMENT_METHODS.map(p => (
                        <option key={p} value={p} className="text-slate-800">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-purple-500"
                    placeholder="e.g. Dinner at Cafe"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                >
                  {selectedExpense ? "Apply Changes" : "Save Expense"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal before Delete */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/80 border border-sky-100 rounded-3xl w-full max-w-sm p-6 relative z-10 space-y-6 shadow-2xl text-center"
            >
              <h3 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>Delete Expense?</h3>
              <p className="text-sm text-slate-500">Are you sure you want to remove this expense record forever? This action cannot be undone.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="py-2.5 bg-white hover:bg-sky-100 text-white font-medium rounded-xl border border-sky-100 transition">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* State driven Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-3 text-sm font-semibold ${
              toast.type === "error" 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-green-500/10 border-green-500/20 text-green-400"
            }`}
          >
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
