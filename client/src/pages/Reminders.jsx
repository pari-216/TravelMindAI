import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { Bell, Plus, Calendar, Clock, Trash2, CheckCircle, X, AlertCircle } from "lucide-react";

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    _id: null,
    tripId: "",
    title: "",
    description: "",
    type: "General",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    priority: "Medium"
  });

  const types = ["Flight", "Hotel", "Packing", "Passport", "Visa", "Transportation", "Expense", "General"];
  const priorities = ["Low", "Medium", "High"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, remindersRes] = await Promise.all([
        api.get("/trips"),
        api.get("/reminders")
      ]);
      setTrips(tripsRes.data);
      setReminders(remindersRes.data);
    } catch (err) {
      setError("Failed to load reminders.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      _id: null,
      tripId: "",
      title: "",
      description: "",
      type: "General",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      priority: "Medium"
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post("/reminders", formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save reminder.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/reminders/${id}`);
      setReminders(reminders.filter(r => r._id !== id));
    } catch (err) {
      alert("Failed to delete reminder.");
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      const res = await api.put(`/reminders/${id}`, { completed: !currentStatus });
      setReminders(reminders.map(r => r._id === id ? res.data : r));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  
  const filteredReminders = reminders.filter(r => {
    if (activeTab === "Upcoming") return !r.completed && r.date >= todayStr;
    if (activeTab === "Today") return !r.completed && r.date === todayStr;
    if (activeTab === "Completed") return r.completed;
    return true;
  });

  const getPriorityColor = (priority) => {
    if (priority === "High") return "text-red-400 bg-red-400/10 border-red-400/20";
    if (priority === "Medium") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    return "text-green-400 bg-green-400/10 border-green-400/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{color:"var(--text-heading)"}}>Smart Reminders</h1>
          <p className="text-slate-500 mt-1">Never miss a flight, check-in, or important task.</p>
        </div>
        <button 
          onClick={handleOpenModal} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Reminder</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-sky-100">
        {["Upcoming", "Today", "Completed"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium transition-all ${
              activeTab === tab
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredReminders.map(reminder => (
            <motion.div 
              key={reminder._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-5 rounded-2xl border transition-all ${
                reminder.completed ? "bg-white/80 border-sky-100 opacity-60" : "bg-white border-sky-100 hover:border-sky-100 shadow-lg"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => toggleComplete(reminder._id, reminder.completed)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      reminder.completed ? "bg-green-500 text-white" : "border-2 border-sky-200 hover:border-blue-500"
                    }`}
                  >
                    {reminder.completed && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <h3 className={`font-semibold text-lg ${reminder.completed ? "line-through text-slate-400" : "text-white"}`}>{reminder.title}</h3>
                </div>
                <button onClick={() => handleDelete(reminder._id)} className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {reminder.description && (
                <p className={`text-sm mb-4 ${reminder.completed ? "text-gray-600" : "text-slate-500"}`}>{reminder.description}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-1 rounded-md border ${getPriorityColor(reminder.priority)}`}>
                  {reminder.priority}
                </span>
                <span className="px-2 py-1 rounded-md bg-white text-slate-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" /> {reminder.date}
                </span>
                <span className="px-2 py-1 rounded-md bg-white text-slate-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> {reminder.time}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredReminders.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            No {activeTab.toLowerCase()} reminders found.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white border border-sky-100 rounded-2xl shadow-2xl w-full max-w-lg"
          >
            <div className="flex justify-between items-center p-6 border-b border-sky-100">
              <h2 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>New Reminder</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-sky-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Title *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Description</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Date *</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Time</label>
                  <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Associated Trip</label>
                <select value={formData.tripId} onChange={e => setFormData({...formData, tripId: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">-- No trip --</option>
                  {trips.map(t => <option key={t._id} value={t._id}>{t.destination}</option>)}
                </select>
              </div>

              <div className="flex justify-end pt-4 border-t border-sky-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 hover:text-sky-700 mr-4">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                  Create Reminder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
