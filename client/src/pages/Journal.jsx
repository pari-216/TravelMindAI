import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { BookOpen, Sparkles, Plus, Edit2, Trash2, MapPin, Calendar, Activity, Check, X, AlertCircle } from "lucide-react";

export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enhancing, setEnhancing] = useState(null); // id of journal being enhanced

  const [formData, setFormData] = useState({
    _id: null,
    tripId: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    mood: "Happy",
    content: "",
    tags: ""
  });

  const moods = ["Happy", "Relaxed", "Excited", "Tired", "Adventurous", "Thoughtful"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, journalRes] = await Promise.all([
        api.get("/trips"),
        api.get("/journal")
      ]);
      setTrips(tripsRes.data);
      setJournals(journalRes.data);
    } catch (err) {
      setError("Failed to load journals.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (journal = null) => {
    if (journal) {
      setFormData({
        _id: journal._id,
        tripId: journal.tripId?._id || "",
        title: journal.title,
        date: journal.date,
        location: journal.location,
        mood: journal.mood,
        content: journal.content,
        tags: journal.tags ? journal.tags.join(", ") : ""
      });
    } else {
      setFormData({
        _id: null,
        tripId: "",
        title: "",
        date: new Date().toISOString().split("T")[0],
        location: "",
        mood: "Happy",
        content: "",
        tags: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : []
      };
      
      if (formData._id) {
        await api.put(`/journal/${formData._id}`, payload);
      } else {
        await api.post("/journal", payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to save journal entry.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this journal entry?")) return;
    try {
      await api.delete(`/journal/${id}`);
      setJournals(journals.filter(j => j._id !== id));
    } catch (err) {
      alert("Failed to delete journal entry.");
    }
  };

  const handleEnhance = async (id) => {
    setEnhancing(id);
    try {
      await api.post(`/journal/${id}/enhance`);
      fetchData();
    } catch (err) {
      alert("Failed to enhance journal entry.");
    } finally {
      setEnhancing(null);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{color:"var(--text-heading)"}}>Travel Journal</h1>
          <p className="text-slate-500 mt-1">Document your journey and let AI enhance your memories.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
        {journals.map((journal, i) => (
          <div key={journal._id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            {/* Timeline Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-sky-100 bg-white/80 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            
            {/* Timeline Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-sky-100 p-6 rounded-2xl shadow-xl hover:border-sky-100 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>{journal.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {journal.date}</span>
                    {journal.location && <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {journal.location}</span>}
                    <span className="flex items-center"><Activity className="w-3 h-3 mr-1" /> {journal.mood}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleOpenModal(journal)} className="w-8 h-8 rounded-lg bg-white text-slate-500 hover:text-sky-700 flex items-center justify-center transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(journal._id)} className="w-8 h-8 rounded-lg bg-white text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                {journal.aiEnhanced ? journal.aiData?.improvedContent : journal.content}
              </div>

              {journal.tags && journal.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {journal.tags.map(tag => (
                    <span key={tag} className="bg-white text-slate-500 text-xs px-2 py-1 rounded-md">#{tag.trim()}</span>
                  ))}
                </div>
              )}

              {/* AI Enhancement Section */}
              <div className="mt-6 pt-6 border-t border-sky-100">
                {!journal.aiEnhanced ? (
                  <button 
                    onClick={() => handleEnhance(journal._id)}
                    disabled={enhancing === journal._id}
                    className="w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {enhancing === journal._id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Improve with AI</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-blue-400 font-medium mb-3">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Enhanced Version</span>
                    </div>
                    {journal.aiData?.catchyTitle && (
                      <p className="text-sm font-medium text-white mb-2">Suggested Title: <span className="font-normal text-slate-500">{journal.aiData.catchyTitle}</span></p>
                    )}
                    {journal.aiData?.caption && (
                      <p className="text-sm font-medium text-white mb-2">Social Caption: <span className="font-normal text-slate-500">{journal.aiData.caption}</span></p>
                    )}
                    {journal.aiData?.hashtags && journal.aiData.hashtags.length > 0 && (
                      <p className="text-sm text-blue-400">{journal.aiData.hashtags.join(" ")}</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
        {journals.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            No journal entries yet. Start writing about your adventures!
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white border border-sky-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center p-6 border-b border-sky-100 sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>{formData._id ? "Edit Entry" : "New Journal Entry"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-sky-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Title *</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Associated Trip</label>
                  <select value={formData.tripId} onChange={e => setFormData({...formData, tripId: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="">-- No trip --</option>
                    {trips.map(t => <option key={t._id} value={t._id}>{t.destination}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Date *</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Location</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Mood</label>
                  <select value={formData.mood} onChange={e => setFormData({...formData, mood: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    {moods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Tags (comma separated)</label>
                  <input type="text" value={formData.tags} placeholder="e.g. beach, hiking, family" onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Journal Content *</label>
                <textarea required rows="8" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full bg-white/80 border border-sky-100 text-white px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
              </div>

              <div className="flex justify-end pt-4 border-t border-sky-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 hover:text-sky-700 mr-4">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                  Save Entry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
