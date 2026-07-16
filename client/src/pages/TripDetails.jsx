import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  Edit2, Trash2, ArrowLeft, Calendar, DollarSign, Users, 
  Briefcase, ChevronRight, Sparkles, Bot, MapPin, Share2, 
  Download, Printer, Copy, Mail, UserPlus, Info, 
  Sun, CloudRain, Wind, Droplets, Map as MapIcon, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import TravelMap from "../components/maps/TravelMap";

const COLORS = ["#00B4D8", "#FB8500", "#FFB703", "#48CAE4", "#A2D2FF", "#BDE0FE"];

const CURRENCY_MAPPING = {
  "united states": "USD", "us": "USD", "usa": "USD",
  "india": "INR", "in": "INR",
  "united kingdom": "GBP", "uk": "GBP", "gb": "GBP",
  "japan": "JPY", "jp": "JPY",
  "australia": "AUD", "au": "AUD",
  "canada": "CAD", "ca": "CAD",
  "united arab emirates": "AED", "uae": "AED",
  "singapore": "SGD", "sg": "SGD",
  "switzerland": "CHF", "ch": "CHF",
  "france": "EUR", "germany": "EUR", "italy": "EUR", "spain": "EUR",
  "netherlands": "EUR", "belgium": "EUR", "austria": "EUR",
  "greece": "EUR", "portugal": "EUR", "ireland": "EUR", "europe": "EUR"
};

export default function TripDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // Data States
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [packingList, setPackingList] = useState(null);
  const [journals, setJournals] = useState([]);

  // Weather States
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // Exchange Rates
  const [localCurrency, setLocalCurrency] = useState("EUR");
  const [convertedBudget, setConvertedBudget] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);

  // Map States
  const [mapType, setMapType] = useState("lodging"); // lodging, tourist_attraction, restaurant, airport
  const [mapMarkers, setMapMarkers] = useState([]);
  const [routePath, setRoutePath] = useState([]);

  // Load nearby places via OpenStreetMap Nominatim and Hotels API
  const loadNearbyPlaces = async (type) => {
    if (!trip || !trip.latitude || !trip.longitude) return;

    // Default destination marker
    const baseMarkers = [
      { name: trip.destination, type: "destination", lat: trip.latitude, lng: trip.longitude }
    ];

    if (type === "lodging") {
      try {
        // Use real Geoapify hotel search via the new endpoint
        const { data } = await axios.post("http://localhost:5000/api/hotels/search", {
          destination: trip.destination,
          radiusKm: 5,
        }, configHeaders);

        const realHotels = data.hotels || [];

        // Use the geocoded coordinates from the search response if available
        if (data.lat && data.lon && !trip.latitude) {
          // Don't override existing trip coords, just use for markers
        }

        const centerLat = trip.latitude || data.lat;
        const centerLon = trip.longitude || data.lon;

        const hotelMarkers = realHotels.slice(0, 8).map(hotel => ({
          name: hotel.name,
          type: "hotel",
          lat: hotel.lat || (centerLat + (Math.random() - 0.5) * 0.01),
          lng: hotel.lon || (centerLon + (Math.random() - 0.5) * 0.01),
          details: {
            address: hotel.address,
            rating: hotel.rating,
            distance: hotel.distanceKm ? `${hotel.distanceKm} km from center` : undefined,
          }
        })).filter(m => m.lat && m.lng);

        setMapMarkers([...baseMarkers, ...hotelMarkers]);
      } catch (err) {
        console.error("Failed to load real hotels:", err);
        setMapMarkers(baseMarkers);
      }
      return;
    }

    let query = "";
    if (type === "tourist_attraction") query = `tourist attractions in ${trip.destination}`;
    if (type === "restaurant") query = `restaurants in ${trip.destination}`;
    if (type === "airport") query = `airport near ${trip.destination}`;

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { "User-Agent": "TravelMindAI/1.0 (contact@travelmind.ai)" }
      });
      const data = await res.json();

      const queryMarkers = data.map(item => ({
        name: item.display_name.split(",")[0],
        type: type === "tourist_attraction" ? "attraction" : type === "restaurant" ? "restaurant" : "airport",
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        details: { address: item.display_name }
      }));

      setMapMarkers([...baseMarkers, ...queryMarkers]);

      // Calculate path route line
      if (queryMarkers.length > 0) {
        const path = [
          [trip.latitude, trip.longitude],
          ...queryMarkers.map(m => [m.lat, m.lng])
        ];
        setRoutePath(path);
      } else {
        setRoutePath([]);
      }
    } catch (err) {
      console.error(`Failed to load ${type} spots:`, err);
      setMapMarkers(baseMarkers);
      setRoutePath([]);
    }
  };

  // Re-load map markers when trip changes or type toggle is triggered
  useEffect(() => {
    if (trip && trip.latitude && trip.longitude) {
      loadNearbyPlaces(mapType);
    }
  }, [trip, mapType]);

  // Handle POI Selection
  const handlePoiToggle = (type) => {
    setMapType(type);
  };

  // Share States
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [collabEmail, setCollabEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  // PDF Export state
  const [isExporting, setIsExporting] = useState(false);

  const configHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch all trip details
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        // 1. Fetch main Trip
        const tripRes = await axios.get(`http://localhost:5000/api/trips/${id}`, configHeaders);
        const tripData = tripRes.data;
        setTrip(tripData);

        // Determine local currency based on country
        const countryNorm = (tripData.country || "").toLowerCase().trim();
        let targetCurr = "EUR";
        for (const key in CURRENCY_MAPPING) {
          if (countryNorm.includes(key)) {
            targetCurr = CURRENCY_MAPPING[key];
            break;
          }
        }
        setLocalCurrency(targetCurr);

        // Fetch currency conversion rates
        try {
          const rateRes = await axios.get(`http://localhost:5000/api/currency/convert?from=USD&to=${targetCurr}&amount=${tripData.budget}`, configHeaders);
          setConvertedBudget(rateRes.data.convertedAmount);
          setExchangeRate(rateRes.data.rate);
        } catch (err) {
          console.error("Currency converter API failed", err);
        }

        // Fetch weather
        fetchWeather(tripData.destination);

        // 2. Fetch Itineraries
        try {
          const itRes = await axios.get(`http://localhost:5000/api/ai/itinerary`, configHeaders);
          const matchedIt = itRes.data.find(it => it.tripId === id);
          if (matchedIt) {
            setItinerary(matchedIt.generatedItinerary || matchedIt);
          }
        } catch (err) {
          console.error("Error loading itineraries", err);
        }

        // 3. Fetch Expenses
        try {
          const expRes = await axios.get(`http://localhost:5000/api/expenses`, configHeaders);
          setExpenses(expRes.data.filter(e => e.trip === id || e.trip?._id === id));
        } catch (err) {
          console.error("Error loading expenses", err);
        }

        // 4. Fetch Packing List
        try {
          const packRes = await axios.get(`http://localhost:5000/api/packing`, configHeaders);
          const matchedPack = packRes.data.find(l => l.tripId?._id === id || l.tripId === id);
          setPackingList(matchedPack);
        } catch (err) {
          console.error("Error loading packing list", err);
        }

        // 5. Fetch Journals
        try {
          const journalRes = await axios.get(`http://localhost:5000/api/journal`, configHeaders);
          setJournals(journalRes.data.filter(j => j.tripId?._id === id || j.tripId === id));
        } catch (err) {
          console.error("Error loading journals", err);
        }

      } catch (error) {
        console.error("Error fetching trip info", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [id, token]);

  // Load weather
  const fetchWeather = async (dest) => {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/weather?destination=${encodeURIComponent(dest)}`,
        configHeaders
      );
      setWeather(data);
    } catch (err) {
      setWeatherError("Weather API unavailable. Showing offline estimates.");
    } finally {
      setWeatherLoading(false);
    }
  };

  // Handle Share Link Generation
  const handleShare = async () => {
    setShareLoading(true);
    try {
      const { data } = await axios.post(`http://localhost:5000/api/shares/trip/${id}`, {}, configHeaders);
      setShareUrl(data.shareUrl);
      setShowShareModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate share link.");
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteCollaborator = (e) => {
    e.preventDefault();
    if (!collabEmail) return;
    alert(`Simulated invitation sent to ${collabEmail}! (Collaboration features belong to Future Phases).`);
    setCollabEmail("");
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        await axios.delete(`http://localhost:5000/api/trips/${id}`, configHeaders);
        navigate("/dashboard/trips");
      } catch (error) {
        alert("Failed to delete trip");
      }
    }
  };

  // PDF Export logic
  const handlePDFExport = async () => {
    setIsExporting(true);
    const element = document.getElementById("pdf-export-content");
    element.style.display = "block"; // temporarily make it visible

    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a" 
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${trip.destination.replace(/\s+/g, "_")}_Trip_Report.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to export PDF.");
    } finally {
      element.style.display = "none"; // hide it again
      setIsExporting(false);
    }
  };

  if (loading) return <div className="text-white text-center py-10 font-bold">Loading trip details...</div>;
  if (!trip) return <div className="text-white text-center py-10">Trip not found.</div>;

  // Prep Expenses data for Recharts Pie
  const expenseSummary = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const chartData = Object.keys(expenseSummary).map(cat => ({
    name: cat,
    value: expenseSummary[cat]
  }));

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-2xl group">
        <img 
          src={trip.coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} 
          alt="Cover" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sky-50 via-white/60 to-transparent" />
        
        <Link to="/dashboard/trips" className="absolute top-6 left-6 p-2 bg-black/30 hover:bg-black/50 backdrop-blur text-white rounded-full transition-colors border border-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
          <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 backdrop-blur border border-blue-500/30 text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            {trip.status}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{trip.destination}</h1>
          <span className="flex items-center text-slate-600 font-medium">
            <MapPin className="w-5 h-5 mr-1 text-slate-500" /> {trip.country}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button 
            onClick={handlePDFExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all border border-blue-500/20 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export PDF
          </button>
          
          <button 
            onClick={handleShare}
            disabled={shareLoading}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-xl transition-all border border-purple-500/20 cursor-pointer"
          >
            {shareLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
            Share Trip
          </button>
        </div>

        <div className="flex gap-2">
          <Link to={`/dashboard/trips/${trip._id}/edit`} className="inline-flex items-center px-4 py-2 bg-white hover:bg-sky-100 text-white font-medium text-sm rounded-xl transition-all border border-sky-100">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button onClick={handleDelete} className="inline-flex items-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm rounded-xl transition-all border border-red-500/20 cursor-pointer">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
          <Calendar className="w-10 h-10 text-blue-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Dates</p>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
          <DollarSign className="w-10 h-10 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Converted Budget</p>
            <p className="text-sm font-bold text-slate-700 mt-1">
              ${trip.budget} USD
            </p>
            {convertedBudget && (
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                ~ {convertedBudget.toLocaleString()} {localCurrency}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
          <Users className="w-10 h-10 text-purple-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Travelers</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{trip.travelers} {trip.travelType}</p>
          </div>
        </div>
        
        <div className="bg-white backdrop-blur border border-sky-100 rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
          <Briefcase className="w-10 h-10 text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Duration</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">
               {durationDays} Days
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid: Map & Itinerary Left, Weather & Expenses Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Interactive Google Map Card */}
          <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-blue-400" /> Interactive Explorer Map
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Explore restaurants, lodging, sights, and airports nearby.</p>
              </div>
              
              {/* Map POI selectors */}
              <div className="flex bg-white/80/80 p-1 rounded-xl border border-sky-100 shrink-0 select-none">
                {[
                  { key: "lodging", label: "🏨 Hotels" },
                  { key: "tourist_attraction", label: "🗺 Attractions" },
                  { key: "restaurant", label: "🍽 Food" },
                  { key: "airport", label: "✈️ Airports" }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handlePoiToggle(item.key)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                      mapType === item.key ? "bg-blue-600 text-white" : "text-slate-500 hover:text-sky-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-sky-100/80 bg-white/80">
              {trip.latitude && trip.longitude ? (
                <TravelMap 
                  center={[trip.latitude, trip.longitude]}
                  zoom={13}
                  markers={mapMarkers}
                  route={routePath}
                  showSearch={true}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <MapIcon className="w-12 h-12 text-gray-700 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-slate-500">Loading Map Coordinates...</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">Geocoding destination name and centering map views.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Itinerary Timeline */}
          <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-sky-100/80 pb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> AI Planned Itinerary
            </h3>
            {itinerary && itinerary.days && itinerary.days.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white">
                {itinerary.days.map((day) => (
                  <div key={day.day} className="relative pl-10 space-y-3">
                    <span className="absolute left-[10px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-gray-950 shadow-md"></span>
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-base font-bold" style={{color:"var(--text-heading)"}}>Day {day.day}</h4>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg">
                        {day.estimatedBudget || "$50"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {day.morning && (
                        <div className="bg-white/80/40 border border-sky-100 p-3 rounded-xl">
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block mb-0.5">Morning</span>
                          <p className="text-slate-600 leading-relaxed">{day.morning}</p>
                        </div>
                      )}
                      {day.afternoon && (
                        <div className="bg-white/80/40 border border-sky-100 p-3 rounded-xl">
                          <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block mb-0.5">Afternoon</span>
                          <p className="text-slate-600 leading-relaxed">{day.afternoon}</p>
                        </div>
                      )}
                      {day.evening && (
                        <div className="bg-white/80/40 border border-sky-100 p-3 rounded-xl">
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Evening</span>
                          <p className="text-slate-600 leading-relaxed">{day.evening}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400 italic">No AI Itinerary saved for this trip yet.</p>
                <Link to="/dashboard/ai-itinerary" className="inline-flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 mt-2 gap-1">
                  Go to AI Planner <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-3">Trip Notes</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{trip.notes || "No notes entered."}</p>
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-8">
          
          {/* Live Weather Widget */}
          <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Sun className="w-5 h-5 text-yellow-400 animate-spin-slow" /> Destination Live Weather
            </h3>

            {weatherLoading ? (
              <div className="h-32 bg-white/30 rounded-2xl animate-pulse"></div>
            ) : weather ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/80/50 p-4 rounded-2xl border border-sky-100">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.current.icon}@2x.png`} 
                      alt="Icon" 
                      className="w-12 h-12" 
                    />
                    <div>
                      <p className="text-sm font-bold text-white capitalize">{weather.current.description}</p>
                      <p className="text-[10px] text-slate-400">Feels like {weather.current.feels_like}°C</p>
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold text-white">{weather.current.temp}°C</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 bg-white/80/20 p-3 rounded-2xl border border-sky-100/40">
                  <div className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-blue-400" /> Wind: {weather.current.wind_speed} m/s</div>
                  <div className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-cyan-400" /> Humidity: {weather.current.humidity}%</div>
                  <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-400" /> UV Index: {weather.current.uv_index}</div>
                  <div className="flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-indigo-400" /> Rain: {weather.current.rain_chance}%</div>
                </div>

                {/* 5-Day Forecast List */}
                <div className="space-y-2 border-t border-sky-100/80 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">5-Day Forecast</p>
                  {weather.forecast.map((f, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1">
                      <span className="w-20 font-medium text-slate-500">{f.day}</span>
                      <div className="flex items-center space-x-1.5">
                        <img src={`https://openweathermap.org/img/wn/${f.icon}.png`} alt="Icon" className="w-6 h-6" />
                        <span className="text-[10px] text-slate-400 capitalize">{f.condition}</span>
                      </div>
                      <span className="font-bold text-slate-600">{f.temp_max}° / {f.temp_min}°</span>
                    </div>
                  ))}
                </div>

                {/* AI Weather Advice */}
                {weather.aiAdvice && weather.aiAdvice.length > 0 && (
                  <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-4 space-y-2.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> AI Weather Advice
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc list-outside leading-relaxed">
                      {weather.aiAdvice.map((adv, idx) => (
                        <li key={idx}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">{weatherError || "Weather forecast currently unavailable."}</p>
            )}
          </div>

          {/* Expenses Chart & Breakdown */}
          <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold" style={{color:"var(--text-heading)"}}>Expenses Chart</h3>
              <span className="text-sm font-bold text-emerald-400">${totalSpent.toLocaleString()}</span>
            </div>

            {expenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No expenses logged for this trip yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {chartData.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="truncate">{item.name}: ${item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Share / Invitation Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-sky-700 transition cursor-pointer font-bold"
            >
              ✕
            </button>

            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" /> Share Trip Itinerary
              </h3>
              <p className="text-xs text-slate-500 mt-1">Anyone with this link can view the read-only trip overview in Viewer Mode.</p>
            </div>

            {/* Generated Link */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public Share Link</label>
              <div className="flex bg-white/80 border border-sky-100 rounded-2xl overflow-hidden p-1">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl} 
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-600 font-medium px-3 focus:ring-0" 
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Actions: Mail, etc. */}
            <div className="flex gap-2">
              <a
                href={`mailto:?subject=Travel Itinerary for ${trip.destination}&body=Hey, checkout my travel itinerary here: ${shareUrl}`}
                className="flex-1 py-3 bg-white hover:bg-sky-100 text-white text-xs font-bold rounded-xl border border-sky-100 text-center flex items-center justify-center gap-1.5 transition"
              >
                <Mail className="w-4 h-4" /> Share by Email
              </a>
            </div>

            {/* Collaborators Invitation Placeholder */}
            <form onSubmit={handleInviteCollaborator} className="border-t border-sky-100 pt-5 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  <UserPlus className="w-4 h-4 text-purple-400" /> Invite Collaborators (UI Only)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Collaborators can edit lists and log shared expenses.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  placeholder="e.g. partner@travelmind.ai"
                  className="flex-1 bg-white/80 border border-sky-100 rounded-2xl py-2 px-4 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600 hover:text-sky-700 text-purple-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* HIDDEN OFFSCREEN TEMPLATE FOR PDF EXPORT */}
      {/* ==================================================== */}
      <div 
        id="pdf-export-content" 
        style={{ display: "none", width: "800px", padding: "40px" }} 
        className="bg-slate-900 text-white font-sans space-y-8"
      >
        {/* Brand Header */}
        <div className="flex justify-between items-center border-b border-sky-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">✨</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              TravelMind AI
            </span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Personal Travel Itinerary & Summary</span>
        </div>

        {/* Header Cover & Details */}
        <div className="space-y-4">
          <div className="relative h-60 w-full rounded-2xl overflow-hidden">
            <img 
              src={trip.coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} 
              alt="Report Cover" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-6 left-6">
              <h1 className="text-3xl font-bold" style={{color:"var(--text-heading)"}}>{trip.destination}</h1>
              <p className="text-xs text-slate-600 flex items-center"><MapPin className="w-4 h-4 mr-1 text-slate-500" /> {trip.country}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-sky-100">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Dates</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Budget</p>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">${trip.budget}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Travelers</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{trip.travelers} ({trip.travelType})</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Duration</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{durationDays} Days</p>
            </div>
          </div>
        </div>

        {/* Itinerary Timeline */}
        {itinerary && itinerary.days && itinerary.days.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-sky-100 pb-2 text-blue-400">📅 Daily Timeline</h2>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {itinerary.days.map((day) => (
                <div key={day.day} className="relative pl-8 space-y-2">
                  <span className="absolute left-[6px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
                  <h3 className="text-sm font-bold" style={{color:"var(--text-heading)"}}>Day {day.day} {day.estimatedBudget ? `(${day.estimatedBudget})` : ""}</h3>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    {day.morning && <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900"><p className="font-bold text-amber-500 mb-0.5">Morning</p><p className="text-slate-600">{day.morning}</p></div>}
                    {day.afternoon && <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900"><p className="font-bold text-sky-400 mb-0.5">Afternoon</p><p className="text-slate-600">{day.afternoon}</p></div>}
                    {day.evening && <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900"><p className="font-bold text-indigo-400 mb-0.5">Evening</p><p className="text-slate-600">{day.evening}</p></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses List & Notes */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-sky-100 pb-2 text-emerald-400">💰 Expense Report</h2>
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No expenses logged.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-500">Total Spent</span>
                  <span className="font-bold text-emerald-400">${totalSpent}</span>
                </div>
                {expenses.map((e) => (
                  <div key={e._id} className="flex justify-between text-[11px] border-b border-slate-800 pb-1.5 last:border-0">
                    <div>
                      <p className="font-bold text-slate-600">{e.description || e.category}</p>
                      <p className="text-[10px] text-slate-400">{new Date(e.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-slate-600">${e.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Packing checklist */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-sky-100 pb-2 text-amber-500">🎒 Packing Checklist</h2>
            {packingList && packingList.items && packingList.items.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Progress: {packingList.completionPercentage}%</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {packingList.items.slice(0, 16).map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 py-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.packed ? "#22c55e" : "#475569" }}></span>
                      <span className={`truncate ${item.packed ? "text-slate-400 line-through" : "text-slate-600"}`}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No checklist saved.</p>
            )}
          </div>
        </div>

        {/* Travel Journal memories */}
        {journals && journals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b border-sky-100 pb-2 text-purple-400">📖 Travel Journal Memories</h2>
            <div className="space-y-3">
              {journals.slice(0, 3).map((j) => (
                <div key={j._id} className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-white">{j.title}</h4>
                    <span className="text-[10px] text-slate-400">{j.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    {j.aiEnhanced ? j.aiData?.improvedContent || j.content : j.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
