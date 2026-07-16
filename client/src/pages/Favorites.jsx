import React, { useState, useEffect } from "react";
import {
  Heart, MapPin, Compass, Trash2, ExternalLink, Calendar,
  DollarSign, Star, Sliders, ChevronDown, Check, Plus, Loader2, Sparkles, Navigation
} from "lucide-react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";
import { SkeletonGrid } from "../components/SkeletonLoader";

const PLACEHOLDER_DESTINATIONS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
  "https://images.unsplash.com/photo-1524413840003-0c356e87c7b5?w=400&q=80",
];

export default function Favorites() {
  const [activeTab, setActiveTab] = useState("destinations"); // "destinations", "hotels"
  const [destinations, setDestinations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // New destination form
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [destRes, hotelRes] = await Promise.allSettled([
        api.get("/destinations"),
        api.get("/hotels/favorites"),
      ]);

      setDestinations(destRes.status === "fulfilled" ? destRes.value.data : []);
      setHotels(hotelRes.status === "fulfilled" ? hotelRes.value.data : []);
    } catch {
      // Optional fail safety
    } finally {
      setLoading(false);
    }
  };

  const handleAddDestination = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAddLoading(true);
    try {
      const idx = Math.floor(Math.random() * PLACEHOLDER_DESTINATIONS.length);
      const img = PLACEHOLDER_DESTINATIONS[idx];

      const { data } = await api.post("/destinations", {
        name: name.trim(),
        country: country.trim(),
        notes: notes.trim(),
        imageUrl: img,
      });

      setDestinations(prev => [data, ...prev]);
      setName("");
      setCountry("");
      setNotes("");
      setShowAddForm(false);
    } catch (err) {
      alert("Failed to add destination.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteDestination = async (id) => {
    try {
      await api.delete(`/destinations/${id}`);
      setDestinations(prev => prev.filter(d => d._id !== id));
    } catch {}
  };

  const handleDeleteHotel = async (id) => {
    try {
      await api.delete(`/hotels/favorites/${id}`);
      setHotels(prev => prev.filter(h => h._id !== id));
    } catch {}
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-10">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
              <Heart className="w-8 h-8 text-blue-400" /> Bookmarks & Favorites
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Quick access to saved destinations, boutique hotels, and travel inspirations.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex gap-1 bg-white/80 rounded-2xl p-1 border border-sky-100">
              {["destinations", "hotels"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer capitalize ${
                    activeTab === tab ? "bg-blue-600 text-white" : "text-slate-500 hover:text-sky-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "destinations" && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Save Place
              </button>
            )}
          </div>
        </div>

        {/* Add Destination Form overlay */}
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleAddDestination}
            className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4 max-w-xl"
          >
            <h3 className="font-bold text-base" style={{color:"var(--text-heading)"}}>Add New Favorite Destination</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">City/Place Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Paris"
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="France"
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Short Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Why is this a favorite? Places to visit next time..."
                className="w-full h-16 bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition cursor-pointer"
              >
                {addLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-white hover:bg-sky-100 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {/* List Content */}
        {loading ? (
          <SkeletonGrid count={3} />
        ) : activeTab === "destinations" ? (
          /* Destinations Grid */
          destinations.length === 0 ? (
            <div className="text-center py-20 bg-white/20 rounded-3xl border border-sky-100 text-slate-400">
              <Compass className="w-14 h-14 mx-auto mb-4 opacity-15" />
              <p className="font-semibold text-lg">No saved destinations</p>
              <p className="text-sm mt-0.5">Click "Save Place" above to add your first favorite destination.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map(dest => (
                <div key={dest._id} className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-lg group">
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={dest.imageUrl || PLACEHOLDER_DESTINATIONS[0]}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sky-50 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-5">
                      <h3 className="text-lg font-black text-white">{dest.name}</h3>
                      {dest.country && <p className="text-xs text-slate-600 font-medium">{dest.country}</p>}
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    {dest.notes ? (
                      <p className="text-xs text-slate-500 leading-relaxed italic">"{dest.notes}"</p>
                    ) : (
                      <p className="text-xs text-gray-600 leading-relaxed italic">No notes added.</p>
                    )}
                    <div className="flex gap-2 justify-end border-t border-gray-900 pt-3">
                      <button
                        onClick={() => handleDeleteDestination(dest._id)}
                        className="p-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-sky-700 rounded-xl transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Hotel Favorites Grid */
          hotels.length === 0 ? (
            <div className="text-center py-20 bg-white/20 rounded-3xl border border-sky-100 text-slate-400">
              <Heart className="w-14 h-14 mx-auto mb-4 opacity-15" />
              <p className="font-semibold text-lg">No saved hotels</p>
              <p className="text-sm mt-0.5">Go to "Hotel Finder" and bookmark hotels with ❤️ to view them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((item, idx) => {
                const hotel = item.hotelData || {};
                return (
                  <div key={item._id} className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-lg group">
                    <div className="h-40 overflow-hidden relative">
                      <img
                        src={hotel.image || PLACEHOLDER_DESTINATIONS[idx % PLACEHOLDER_DESTINATIONS.length]}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => { e.target.src = PLACEHOLDER_DESTINATIONS[0]; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-sky-50 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-5">
                        <h3 className="text-base font-black text-white leading-tight line-clamp-1">{hotel.name}</h3>
                        <p className="text-[10px] text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-400 shrink-0" /> {hotel.address || "Address unavailable"}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        {hotel.rating ? (
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> {hotel.rating} / 5
                          </span>
                        ) : (
                          <span className="text-gray-600">No ratings</span>
                        )}
                        {hotel.distanceKm !== null && (
                          <span className="text-slate-500 font-bold">📍 {hotel.distanceKm} km from center</span>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end border-t border-gray-900 pt-3">
                        {hotel.openInMapsUrl && (
                          <a
                            href={hotel.openInMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-sky-700 text-[10px] font-bold rounded-xl transition"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Map
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteHotel(item._id)}
                          className="p-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-sky-700 rounded-xl transition cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>
    </PageTransition>
  );
}
