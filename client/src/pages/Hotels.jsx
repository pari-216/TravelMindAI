import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble, Search, Star, MapPin, Heart, Calendar,
  Users, DollarSign, Loader2, Sparkles, Phone, Globe,
  ExternalLink, Filter, SortAsc, ChevronDown, ChevronUp,
  Wifi, Car, Waves, Coffee, Zap, X, Map as MapIcon,
  Award, Briefcase, Users2, Baby, Coins, AlertCircle,
  CheckCircle, Building2, Navigation, Info, Trash2
} from "lucide-react";
import api from "../services/api";
import TravelMap from "../components/maps/TravelMap";

const CATEGORIES = ["Standard", "Budget", "Luxury", "Business", "Family", "Romantic"];
const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "rating-desc", label: "Rating ↓" },
  { value: "name", label: "Name A-Z" },
];

// Hotel card placeholder images (cycling through hotel-style images)
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80",
];

const AI_CATEGORIES = [
  { key: "best_budget", label: "Best Budget", icon: Coins, color: "emerald" },
  { key: "best_luxury", label: "Best Luxury", icon: Award, color: "amber" },
  { key: "best_family", label: "Best Family", icon: Baby, color: "pink" },
  { key: "best_business", label: "Best Business", icon: Briefcase, color: "blue" },
  { key: "best_overall", label: "Best Overall", icon: Sparkles, color: "violet" },
];

export default function Hotels() {
  const [activeTab, setActiveTab] = useState("search");

  // Search form
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [category, setCategory] = useState("Standard");
  const [radiusKm, setRadiusKm] = useState(5);

  // Results
  const [hotels, setHotels] = useState([]);
  const [geoInfo, setGeoInfo] = useState(null);
  const [totalFound, setTotalFound] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [activeAiTab, setActiveAiTab] = useState("best_overall");

  // Map
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [nearbyPOIs, setNearbyPOIs] = useState({ restaurants: [], attractions: [] });
  const [poisLoading, setPoisLoading] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState("distance");
  const [showFilters, setShowFilters] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterPool, setFilterPool] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favLoading, setFavLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // MapTiler key (served via backend to avoid exposing)
  const [tileUrl, setTileUrl] = useState(null);

  // Fetch MapTiler key from backend safely
  useEffect(() => {
    api.get("/hotels/geocode?q=Paris")
      .then(() => {
        // if geocode works, construct tile URL with key from backend env (we expose via a dedicated endpoint)
        // For now fallback to OSM — tile key endpoint would require a separate endpoint
      })
      .catch(() => {});
  }, []);

  // Fetch favorites on load
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setFavLoading(true);
    try {
      const { data } = await api.get("/hotels/favorites");
      setFavorites(data);
      const ids = new Set(data.map((f) => f.hotelId).filter(Boolean));
      setFavoriteIds(ids);
    } catch {
      // Silently fail - favorites are optional
    } finally {
      setFavLoading(false);
    }
  };

  // ─── Hotel Search ─────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setLoading(true);
    setError("");
    setHotels([]);
    setAiAnalysis(null);
    setSelectedHotel(null);
    setSearched(false);

    try {
      const { data } = await api.post("/hotels/search", {
        destination: destination.trim(),
        guests: parseInt(guests),
        radiusKm: parseInt(radiusKm),
      });

      setHotels(data.hotels || []);
      setGeoInfo({ lat: data.lat, lon: data.lon, name: data.destination });
      setTotalFound(data.totalFound || 0);
      setMapCenter([data.lat, data.lon]);
      setSearched(true);

      // Build map markers
      const markers = [
        { lat: data.lat, lng: data.lon, name: data.destination, type: "destination", details: {} },
        ...(data.hotels || []).filter(h => h.lat && h.lon).map(h => ({
          lat: h.lat,
          lng: h.lon,
          name: h.name,
          type: "hotel",
          details: {
            address: h.address,
            rating: h.rating,
            distance: h.distanceKm ? `${h.distanceKm} km from center` : undefined,
          },
        })),
      ];
      setMapMarkers(markers);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to search hotels. Please try a different destination or check your internet connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── AI Analysis ─────────────────────────────────────────────────────────
  const handleAiAnalysis = async () => {
    if (!hotels.length) return;

    setAiLoading(true);
    setAiError("");

    try {
      const { data } = await api.post("/hotels/analyze", {
        hotels,
        destination: geoInfo?.name || destination,
        guests: parseInt(guests),
        category,
      });
      setAiAnalysis(data.analysis);
      setActiveAiTab("best_overall");
    } catch (err) {
      setAiError(err.response?.data?.message || "AI analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Hotel Detail ─────────────────────────────────────────────────────────
  const handleHotelSelect = async (hotel) => {
    setSelectedHotel(hotel);
    if (!hotel.lat || !hotel.lon) return;

    setPoisLoading(true);
    try {
      const [restRes, attrRes] = await Promise.allSettled([
        api.get(`/hotels/nearby-pois?lat=${hotel.lat}&lon=${hotel.lon}&type=restaurant&radius=800`),
        api.get(`/hotels/nearby-pois?lat=${hotel.lat}&lon=${hotel.lon}&type=attraction&radius=1200`),
      ]);
      setNearbyPOIs({
        restaurants: restRes.status === "fulfilled" ? restRes.value.data.pois : [],
        attractions: attrRes.status === "fulfilled" ? attrRes.value.data.pois : [],
      });
    } catch {
      setNearbyPOIs({ restaurants: [], attractions: [] });
    } finally {
      setPoisLoading(false);
    }
  };

  // ─── Favorites ────────────────────────────────────────────────────────────
  const toggleFavorite = async (hotel) => {
    const isFav = favoriteIds.has(hotel.id);

    if (isFav) {
      // Find and delete
      const fav = favorites.find((f) => f.hotelId === hotel.id);
      if (!fav) return;
      try {
        await api.delete(`/hotels/favorites/${fav._id}`);
        setFavorites((prev) => prev.filter((f) => f._id !== fav._id));
        setFavoriteIds((prev) => { const s = new Set(prev); s.delete(hotel.id); return s; });
      } catch {}
    } else {
      try {
        const { data } = await api.post("/hotels/favorites", {
          hotelId: hotel.id,
          hotelData: hotel,
        });
        setFavorites((prev) => [data, ...prev]);
        setFavoriteIds((prev) => new Set([...prev, hotel.id]));
      } catch {}
    }
  };

  // ─── Computed hotels (sort + filter) ─────────────────────────────────────
  const displayedHotels = hotels
    .filter((h) => !filterWifi || h.amenities?.wifi)
    .filter((h) => !filterParking || h.amenities?.parking)
    .filter((h) => !filterPool || h.amenities?.pool)
    .sort((a, b) => {
      if (sortBy === "rating-desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (a.distanceKm || 99) - (b.distanceKm || 99);
    });

  const getImage = (hotel, idx) =>
    PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
            <BedDouble className="w-8 h-8 text-blue-400" /> Hotel Finder
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Real hotels from Geoapify · AI-ranked by Groq · Mapped with Leaflet</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-white/80 rounded-2xl p-1 border border-sky-100">
          {["search", "favorites"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer capitalize ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-500 hover:text-sky-700"
              }`}
            >
              {tab === "favorites" ? `❤️ Saved (${favorites.length})` : "🔍 Search"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "search" && (
        <>
          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSearch}
            className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Destination */}
              <div className="lg:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Paris, Tokyo, New York..."
                  required
                  className="w-full bg-white/80 border border-sky-100 rounded-2xl py-3 px-4 text-slate-800 focus:outline-none focus:border-blue-500 transition placeholder-gray-400"
                />
              </div>

              {/* Guests */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-white/80 border border-sky-100 rounded-2xl py-3 px-4 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Check-in */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-white/80 border border-sky-100 rounded-2xl py-3 px-4 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Check-out */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-white/80 border border-sky-100 rounded-2xl py-3 px-4 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3 h-3" /> Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/80 border border-sky-100 rounded-2xl py-3 px-4 text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c} className="text-slate-800">{c}</option>)}
                </select>
              </div>
            </div>

            {/* Radius & Submit Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-semibold">Search radius:</label>
                {[2, 5, 10, 20].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                      radiusKm === r
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-500 hover:text-sky-700"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={loading || !destination.trim()}
                className="ml-auto flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                ) : (
                  <><Search className="w-4 h-4" /> Find Hotels</>
                )}
              </button>
            </div>
          </motion.form>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Results Area */}
          {searched && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>
                    {totalFound > 0 ? (
                      <><span className="text-blue-400">{totalFound}</span> hotels near <span className="text-blue-400">{geoInfo?.name}</span></>
                    ) : (
                      <span className="text-slate-500">No hotels found in this area</span>
                    )}
                  </h2>
                </div>

                {hotels.length > 0 && (
                  <div className="flex items-center gap-2">
                    {/* Filters Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        showFilters ? "bg-blue-600/20 border-blue-500/40 text-blue-400" : "bg-white border-sky-100 text-slate-500 hover:text-sky-700"
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" /> Filters
                    </button>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-white border border-sky-100 text-slate-600 text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
                    >
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    {/* Map Toggle */}
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        showMap ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400" : "bg-white border-sky-100 text-slate-500"
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" /> {showMap ? "Hide" : "Show"} Map
                    </button>

                    {/* AI Analysis */}
                    <button
                      onClick={handleAiAnalysis}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-400 hover:bg-violet-600/30 transition cursor-pointer disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      AI Rank
                    </button>
                  </div>
                )}
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white backdrop-blur border border-sky-100 rounded-2xl px-5 py-4 flex flex-wrap gap-3"
                  >
                    {[
                      { key: "wifi", label: "WiFi", state: filterWifi, set: setFilterWifi, icon: Wifi },
                      { key: "parking", label: "Parking", state: filterParking, set: setFilterParking, icon: Car },
                      { key: "pool", label: "Pool", state: filterPool, set: setFilterPool, icon: Waves },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => f.set(!f.state)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                          f.state ? "bg-blue-600 border-blue-500 text-white" : "bg-white border-sky-100 text-slate-500 hover:text-sky-700"
                        }`}
                      >
                        <f.icon className="w-3.5 h-3.5" /> {f.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Map + Hotel Grid Layout */}
              <div className={`grid ${showMap ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"} gap-6`}>
                
                {/* Map */}
                <AnimatePresence>
                  {showMap && mapCenter && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="h-[480px] rounded-3xl overflow-hidden border border-sky-100 shadow-2xl"
                    >
                      <TravelMap
                        center={mapCenter}
                        zoom={13}
                        markers={mapMarkers}
                        onHotelSelect={handleHotelSelect}
                        showSearch={false}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hotel Cards Grid */}
                <div className={`${showMap ? "max-h-[480px] overflow-y-auto pr-1 custom-scrollbar" : ""} space-y-4`}>
                  {displayedHotels.length === 0 && searched && !loading && (
                    <div className="text-center py-16 text-slate-400">
                      <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No hotels found matching your filters</p>
                      <p className="text-sm mt-1">Try expanding the search radius or removing filters</p>
                    </div>
                  )}
                  
                  {displayedHotels.map((hotel, idx) => (
                    <HotelCard
                      key={hotel.id || idx}
                      hotel={hotel}
                      idx={idx}
                      image={getImage(hotel, idx)}
                      isFav={favoriteIds.has(hotel.id)}
                      onFav={() => toggleFavorite(hotel)}
                      onSelect={() => handleHotelSelect(hotel)}
                      isSelected={selectedHotel?.id === hotel.id}
                    />
                  ))}
                </div>
              </div>

              {/* AI Analysis Panel */}
              {aiError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {aiError}
                </div>
              )}

              {aiLoading && (
                <div className="bg-white backdrop-blur border border-violet-700/30 rounded-3xl p-8 text-center">
                  <div className="w-12 h-12 mx-auto border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-violet-400 font-semibold">AI is analyzing {hotels.length} hotels...</p>
                  <p className="text-slate-400 text-sm mt-1">Groq is comparing ratings, location, amenities, and value</p>
                </div>
              )}

              {aiAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white backdrop-blur-xl border border-violet-700/30 rounded-3xl p-6 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{color:"var(--text-heading)"}}>AI Hotel Analysis</h3>
                      <p className="text-xs text-slate-500">Powered by Groq · Based on {hotels.length} real hotels</p>
                    </div>
                  </div>

                  {/* AI Category Tabs */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {AI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setActiveAiTab(cat.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                          activeAiTab === cat.key
                            ? `bg-${cat.color}-600/30 border-${cat.color}-500/50 text-${cat.color}-400`
                            : "bg-white border-sky-100 text-slate-500 hover:text-sky-700"
                        }`}
                      >
                        <cat.icon className="w-3.5 h-3.5" /> {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Active AI Pick */}
                  {aiAnalysis[activeAiTab] && (
                    <AIPickCard
                      pick={aiAnalysis[activeAiTab]}
                      category={AI_CATEGORIES.find(c => c.key === activeAiTab)}
                      isFav={favoriteIds.has(aiAnalysis[activeAiTab].hotel?.id)}
                      onFav={() => aiAnalysis[activeAiTab].hotel && toggleFavorite(aiAnalysis[activeAiTab].hotel)}
                    />
                  )}
                </motion.div>
              )}

              {/* Hotel Detail Modal */}
              <AnimatePresence>
                {selectedHotel && (
                  <HotelDetailModal
                    hotel={selectedHotel}
                    pois={nearbyPOIs}
                    poisLoading={poisLoading}
                    isFav={favoriteIds.has(selectedHotel.id)}
                    onFav={() => toggleFavorite(selectedHotel)}
                    onClose={() => setSelectedHotel(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Favorites Tab */}
      {activeTab === "favorites" && (
        <div className="space-y-5">
          {favLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Heart className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-lg">No saved hotels yet</p>
              <p className="text-sm mt-1">Search for a hotel and click ❤️ to save it</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {favorites.map((fav, idx) => (
                <FavoriteCard
                  key={fav._id}
                  fav={fav}
                  image={getImage(fav.hotelData, idx)}
                  onRemove={async () => {
                    try {
                      await api.delete(`/hotels/favorites/${fav._id}`);
                      setFavorites(prev => prev.filter(f => f._id !== fav._id));
                      setFavoriteIds(prev => { const s = new Set(prev); s.delete(fav.hotelId); return s; });
                    } catch {}
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function HotelCard({ hotel, idx, image, isFav, onFav, onSelect, isSelected }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={`bg-white backdrop-blur-xl border rounded-2xl overflow-hidden shadow-lg transition-all duration-200 ${
        isSelected ? "border-blue-500/60 shadow-blue-900/20" : "border-sky-100 hover:border-sky-100"
      }`}
    >
      <div className="flex gap-0">
        {/* Image */}
        <div className="relative w-32 sm:w-40 shrink-0">
          <img
            src={image}
            alt={hotel.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = PLACEHOLDER_IMAGES[0]; }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onFav(); }}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              isFav ? "bg-red-500 text-white" : "bg-black/50 text-slate-600 hover:text-red-400"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">{hotel.name}</h3>
            {hotel.rating && (
              <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold shrink-0">
                <Star className="w-3 h-3 fill-amber-400" /> {hotel.rating}
              </span>
            )}
          </div>

          <p className="text-slate-400 text-xs mt-1 line-clamp-2 flex items-start gap-1">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-blue-400" /> {hotel.address}
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            {hotel.distanceKm !== null && (
              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full">
                📍 {hotel.distanceKm} km
              </span>
            )}
            {hotel.stars && (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded-full">
                ⭐ {hotel.stars}-star
              </span>
            )}
            {hotel.amenities?.wifi && (
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full">
                WiFi
              </span>
            )}
            {hotel.amenities?.parking && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full">
                Parking
              </span>
            )}
            {hotel.amenities?.pool && (
              <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded-full">
                Pool
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onSelect}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Info className="w-3 h-3" /> Details
            </button>
            {hotel.openInMapsUrl && (
              <a
                href={hotel.openInMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-sky-100 text-slate-500 hover:text-sky-700 text-xs font-bold rounded-xl transition"
              >
                <Navigation className="w-3 h-3" /> Map
              </a>
            )}
            {hotel.website && (
              <a
                href={hotel.website.startsWith("http") ? hotel.website : `https://${hotel.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-sky-100 text-slate-500 hover:text-sky-700 text-xs font-bold rounded-xl transition"
              >
                <Globe className="w-3 h-3" /> Web
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AIPickCard({ pick, category, isFav, onFav }) {
  if (!pick) return null;
  const { hotel, whySelected, pros, cons, nearbyAttractions, nearbyRestaurants, bestSuitedFor, travelTip } = pick;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        {hotel && (
          <div className="flex items-start gap-4">
            <img
              src={PLACEHOLDER_IMAGES[0]}
              alt={hotel.name}
              className="w-20 h-20 object-cover rounded-2xl shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                {category && <category.icon className={`w-4 h-4 text-${category.color}-400`} />}
                <span className={`text-xs font-bold text-${category?.color || "blue"}-400 uppercase tracking-wide`}>
                  {pick.category || category?.label}
                </span>
              </div>
              <h4 className="font-bold text-white text-base mt-0.5">{hotel.name}</h4>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {hotel.address}
              </p>
              {hotel.distanceKm && (
                <p className="text-xs text-slate-500 mt-0.5">📍 {hotel.distanceKm} km from center</p>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-slate-600 leading-relaxed">{whySelected}</p>

        {travelTip && (
          <div className="flex items-start gap-2 bg-amber-900/10 border border-amber-700/20 rounded-xl p-3">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">{travelTip}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {pros?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">✅ Pros</p>
            <ul className="space-y-1">
              {pros.map((p, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span>{p}</li>)}
            </ul>
          </div>
        )}
        {cons?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">⚠️ Cons</p>
            <ul className="space-y-1">
              {cons.map((c, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><span className="text-red-500 mt-0.5">•</span>{c}</li>)}
            </ul>
          </div>
        )}
        {bestSuitedFor?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">👤 Best for</p>
            <div className="flex flex-wrap gap-1.5">
              {bestSuitedFor.map((s, i) => (
                <span key={i} className="text-[10px] font-bold bg-blue-900/20 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
        {nearbyAttractions?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">🗺️ Nearby attractions</p>
            <p className="text-xs text-slate-500">{nearbyAttractions.join(" · ")}</p>
          </div>
        )}
        {nearbyRestaurants?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">🍽️ Nearby dining</p>
            <p className="text-xs text-slate-500">{nearbyRestaurants.join(" · ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HotelDetailModal({ hotel, pois, poisLoading, isFav, onFav, onClose }) {
  const mapMarkers = hotel.lat && hotel.lon ? [
    { lat: hotel.lat, lng: hotel.lon, name: hotel.name, type: "hotel", details: { address: hotel.address, rating: hotel.rating } },
    ...pois.restaurants.filter(p => p.lat).map(p => ({ lat: p.lat, lng: p.lon, name: p.name, type: "restaurant", details: {} })),
    ...pois.attractions.filter(p => p.lat).map(p => ({ lat: p.lat, lng: p.lon, name: p.name, type: "attraction", details: {} })),
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/80 border border-sky-100 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header Image */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl">
          <img
            src={PLACEHOLDER_IMAGES[0]}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-50 via-gray-950/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-slate-600 hover:text-sky-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-xl font-black text-white">{hotel.name}</h2>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> {hotel.address}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            {hotel.rating && (
              <div className="bg-amber-900/10 border border-amber-700/20 rounded-2xl p-3 text-center">
                <p className="text-xl font-black text-amber-400">{hotel.rating}</p>
                <p className="text-xs text-slate-400 mt-0.5">Rating</p>
              </div>
            )}
            {hotel.distanceKm !== null && (
              <div className="bg-blue-900/10 border border-blue-700/20 rounded-2xl p-3 text-center">
                <p className="text-xl font-black text-blue-400">{hotel.distanceKm} km</p>
                <p className="text-xs text-slate-400 mt-0.5">From center</p>
              </div>
            )}
            {hotel.stars && (
              <div className="bg-violet-900/10 border border-violet-700/20 rounded-2xl p-3 text-center">
                <p className="text-xl font-black text-violet-400">{hotel.stars}★</p>
                <p className="text-xs text-slate-400 mt-0.5">Stars</p>
              </div>
            )}
          </div>

          {/* Amenities */}
          {hotel.amenities && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(hotel.amenities).map(([key, val]) => val ? (
                  <span key={key} className="text-[10px] font-bold bg-white text-slate-600 px-2.5 py-1 rounded-full capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                ) : null)}
              </div>
            </div>
          )}

          {/* Contacts */}
          <div className="flex flex-wrap gap-3">
            {hotel.phone && (
              <a href={`tel:${hotel.phone}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
                <Phone className="w-4 h-4" /> {hotel.phone}
              </a>
            )}
            {hotel.website && (
              <a
                href={hotel.website.startsWith("http") ? hotel.website : `https://${hotel.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
              >
                <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {hotel.openInMapsUrl && (
              <a
                href={hotel.openInMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition"
              >
                <Navigation className="w-4 h-4" /> Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Map */}
          {hotel.lat && hotel.lon && (
            <div className="h-52 rounded-2xl overflow-hidden border border-sky-100">
              <TravelMap
                center={[hotel.lat, hotel.lon]}
                zoom={15}
                markers={mapMarkers}
                showSearch={false}
              />
            </div>
          )}

          {/* Nearby POIs */}
          {poisLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading nearby places...
            </div>
          )}
          {!poisLoading && (pois.restaurants.length > 0 || pois.attractions.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {pois.restaurants.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">🍽️ Nearby Restaurants</p>
                  <ul className="space-y-1">
                    {pois.restaurants.slice(0, 5).map((r, i) => (
                      <li key={i} className="text-xs text-slate-600 truncate">• {r.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pois.attractions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">🗺️ Nearby Attractions</p>
                  <ul className="space-y-1">
                    {pois.attractions.slice(0, 5).map((a, i) => (
                      <li key={i} className="text-xs text-slate-600 truncate">• {a.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 border-t border-sky-100">
            <button
              onClick={onFav}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-2xl transition cursor-pointer ${
                isFav
                  ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
                  : "bg-white hover:bg-sky-100 text-slate-600 hover:text-sky-700 border border-sky-100"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-current text-red-400" : ""}`} />
              {isFav ? "Remove from Saved" : "Save Hotel"}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-sky-100 text-slate-600 font-bold text-sm rounded-2xl transition cursor-pointer border border-sky-100"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FavoriteCard({ fav, image, onRemove }) {
  const hotel = fav.hotelData;
  return (
    <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-md">
      <img src={image} alt={hotel.name} className="w-full h-36 object-cover" />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-white text-sm line-clamp-2">{hotel.name}</h3>
          {hotel.rating && (
            <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold shrink-0">
              <Star className="w-3 h-3 fill-amber-400" /> {hotel.rating}
            </span>
          )}
        </div>
        <p className="text-slate-400 text-xs flex items-start gap-1 line-clamp-2">
          <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-blue-400" /> {hotel.address}
        </p>
        {hotel.distanceKm && (
          <p className="text-xs text-slate-500">📍 {hotel.distanceKm} km from center</p>
        )}
        <div className="flex gap-2 pt-1">
          {hotel.openInMapsUrl && (
            <a
              href={hotel.openInMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs font-bold py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl transition hover:bg-blue-600/30"
            >
              Open in Maps
            </a>
          )}
          <button
            onClick={onRemove}
            className="px-3 py-1.5 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 rounded-xl transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
