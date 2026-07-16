import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { Briefcase, Sparkles, Plus, Search, CheckCircle, Trash2, X, AlertCircle } from "lucide-react";

export default function Packing() {
  const [trips, setTrips] = useState([]);
  const [packingLists, setPackingLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form states for new list
  const [destName, setDestName] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [travelStyle, setTravelStyle] = useState("Adventure");
  const [activities, setActivities] = useState([]);

  const categories = ["All", "Documents", "Clothing", "Electronics", "Health & Medicine", "Toiletries", "Accessories", "Food & Snacks", "Travel Essentials", "Optional Items"];
  const activityOptions = ["Adventure", "Business", "Beach", "Hiking", "Camping", "Photography", "Family"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, listsRes] = await Promise.all([
        api.get("/trips"),
        api.get("/packing")
      ]);
      setTrips(tripsRes.data);
      setPackingLists(listsRes.data);
      if (listsRes.data.length > 0) {
        setActiveListId(listsRes.data[0]._id);
      }
    } catch (err) {
      setError("Failed to load packing data.");
    } finally {
      setLoading(false);
    }
  };

  const activeList = packingLists.find((l) => l._id === activeListId);
  const allItems = activeList ? [...activeList.generatedItems, ...activeList.customItems] : [];
  
  const filteredItems = (allItems || []).filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleActivity = (act) => {
    setActivities(prev => prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act]);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!destName && !selectedTrip) {
      setError("Please select a trip or enter a destination.");
      return;
    }
    setError(null);
    setGenerating(true);
    
    let tripData = { destination: destName, startDate: "", endDate: "" };
    if (selectedTrip) {
      const trip = trips.find(t => t._id === selectedTrip);
      if (trip) tripData = { destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate };
    }

    try {
      const res = await api.post("/packing/generate", {
        tripId: selectedTrip || null,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        travelStyle,
        activities
      });
      setPackingLists([res.data, ...packingLists]);
      setActiveListId(res.data._id);
      
      // Reset form
      setDestName("");
      setSelectedTrip("");
      setActivities([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate packing list.");
    } finally {
      setGenerating(false);
    }
  };

  const togglePacked = async (itemId, isCustom, currentStatus) => {
    if (!activeList) return;
    
    const listCopy = { ...activeList };
    const targetArray = isCustom ? listCopy.customItems : listCopy.generatedItems;
    const itemIndex = targetArray.findIndex(i => i._id === itemId);
    
    if (itemIndex > -1) {
      targetArray[itemIndex].packed = !currentStatus;
      setPackingLists(packingLists.map(l => l._id === activeListId ? listCopy : l));
      
      try {
        await api.put(`/packing/${activeListId}`, {
          generatedItems: listCopy.generatedItems,
          customItems: listCopy.customItems
        });
        fetchData(); // Refresh to get true completion percentage
      } catch (err) {
        console.error("Failed to update status");
      }
    }
  };

  const deleteList = async (id) => {
    if (!confirm("Delete this packing list?")) return;
    try {
      await api.delete(`/packing/${id}`);
      setPackingLists(packingLists.filter(l => l._id !== id));
      if (activeListId === id) setActiveListId(null);
    } catch (err) {
      setError("Failed to delete packing list.");
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{color:"var(--text-heading)"}}>AI Packing Assistant</h1>
          <p className="text-slate-500 mt-1">Generate perfect packing lists based on destination and activities.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Generator Card */}
      <div className="bg-white border border-sky-100 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl rounded-tl-full mix-blend-screen pointer-events-none"></div>
        <form onSubmit={handleGenerate} className="relative z-10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Trip or Enter Destination *</label>
              <div className="flex space-x-2">
                 <select 
                  value={selectedTrip}
                  onChange={(e) => { setSelectedTrip(e.target.value); setDestName(""); }}
                  className="w-1/2 bg-white/80 border border-sky-100 text-slate-800 px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" className="text-slate-800">-- Select Trip --</option>
                  {trips.map(t => <option key={t._id} value={t._id} className="text-slate-800">{t.destination}</option>)}
                </select>
                <input 
                  type="text" 
                  placeholder="Or enter destination..."
                  value={destName}
                  onChange={(e) => { setDestName(e.target.value); setSelectedTrip(""); }}
                  className="w-1/2 bg-white/80 border border-sky-100 text-slate-800 px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Travel Style</label>
              <select 
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
                className="w-full bg-white/80 border border-sky-100 text-slate-800 px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Adventure" className="text-slate-800">Adventure</option>
                <option value="Leisure" className="text-slate-800">Leisure</option>
                <option value="Business" className="text-slate-800">Business</option>
                <option value="Luxury" className="text-slate-800">Luxury</option>
                <option value="Backpacking" className="text-slate-800">Backpacking</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Activities</label>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map(act => (
                <button
                  key={act}
                  type="button"
                  onClick={() => toggleActivity(act)}
                  className={`px-3 py-1 text-sm rounded-full border transition-all ${
                    activities.includes(act) 
                      ? "bg-blue-600/20 border-blue-500 text-blue-400" 
                      : "bg-white/80 border-sky-100 text-slate-500 hover:border-gray-500 hover:text-slate-700"
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={generating || (!destName && !selectedTrip)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Packing List</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Section */}
      {packingLists.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar for lists */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-slate-500 font-semibold uppercase text-xs tracking-wider mb-4">Your Lists</h3>
            {packingLists.map((list) => (
              <div 
                key={list._id} 
                onClick={() => setActiveListId(list._id)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  activeListId === list._id 
                    ? "bg-white border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]" 
                    : "bg-white border-sky-100 hover:border-sky-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-white line-clamp-1">{list.destination}</div>
                  <button onClick={(e) => { e.stopPropagation(); deleteList(list._id); }} className="text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {list.completionPercentage}% Packed
                </div>
                {/* Progress bar mini */}
                <div className="w-full bg-white/80 rounded-full h-1 mt-2">
                  <div className={`h-1 rounded-full ${list.completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${list.completionPercentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Active List Detail */}
          {activeList && (
            <div className="lg:col-span-3 bg-white border border-sky-100 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-sky-100">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {activeList.destination} Packing List
                  </h2>
                  <div className="flex items-center space-x-2 mt-2 text-sm text-slate-500">
                    <span className="bg-white px-2 py-1 rounded-md">{activeList.travelStyle}</span>
                    {activeList.weather && <span className="bg-white px-2 py-1 rounded-md">{activeList.weather}</span>}
                    {activeList.activities.map(a => (
                      <span key={a} className="bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-1 rounded-md">{a}</span>
                    ))}
                  </div>
                </div>
                
                {/* Circular Progress */}
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Status</div>
                    <div className={`font-bold text-lg ${activeList.completionPercentage === 100 ? 'text-green-400' : 'text-blue-400'}`}>
                      {activeList.completionPercentage}% Packed
                    </div>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-800" />
                      <circle 
                        cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray="175.9" 
                        strokeDashoffset={175.9 - (175.9 * activeList.completionPercentage) / 100} 
                        className={`${activeList.completionPercentage === 100 ? 'text-green-500' : 'text-blue-500'} transition-all duration-1000 ease-out`} 
                      />
                    </svg>
                    {activeList.completionPercentage === 100 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/80 border border-sky-100 text-slate-800 pl-10 pr-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                
                <div className="flex space-x-2 overflow-x-auto w-full pb-2 custom-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? "bg-white text-black font-medium"
                          : "bg-white text-slate-500 hover:bg-sky-100 hover:text-sky-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredItems.map(item => (
                    <motion.div 
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        item.packed 
                          ? "bg-green-900/10 border-green-500/20" 
                          : "bg-white/80 border-sky-100 hover:border-sky-100"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => togglePacked(item._id, item.isCustom, item.packed)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.packed ? "bg-green-500" : "bg-white border border-sky-200 hover:border-blue-500"
                          }`}
                        >
                          {item.packed && <CheckCircle className="w-4 h-4 text-gray-900" />}
                        </button>
                        <div>
                          <div className={`font-medium text-lg ${item.packed ? "text-slate-500 line-through" : "text-slate-800"}`}>
                            {item.name}
                            {item.quantity > 1 && <span className="ml-2 text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full">x{item.quantity}</span>}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-slate-400">{item.category}</span>
                            {item.essential && !item.packed && (
                              <span className="text-xs text-red-400 bg-red-900/20 px-2 py-0.5 rounded-md border border-red-900/50">Essential</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredItems.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    No items found matching your filters.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
