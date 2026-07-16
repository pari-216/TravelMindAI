import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Compass, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Helper component to handle dynamic centering and zooming of Leaflet Map
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 13, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Function to generate styled, themed, glassmorphic custom markers
const createThemedIcon = (color, emoji) => {
  return L.divIcon({
    html: `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        width: 34px; 
        height: 34px; 
        background: rgba(15, 23, 42, 0.85); 
        border: 2px solid ${color}; 
        border-radius: 50%; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 12px ${color}4d; 
        backdrop-filter: blur(6px);
        transform: translate(-1px, -1px);
        transition: transform 0.2s ease-in-out;
      " class="hover:scale-110">
        <span style="font-size: 15px;">${emoji}</span>
      </div>
    `,
    className: "themed-leaflet-icon",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

export default function TravelMap({ 
  center = [48.8566, 2.3522], // Default Paris
  zoom = 12,
  markers = [], 
  route = [], 
  onHotelSelect = null,
  showSearch = true,
  tileUrl = null,          // Optional: pass MapTiler URL (with key) from backend config
  tileAttribution = null,
}) {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (center && center[0] && center[1]) {
      setMapCenter(center);
    }
  }, [center]);

  // Request User Geolocation
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const myCoords = [position.coords.latitude, position.coords.longitude];
        setUserLocation(myCoords);
        setMapCenter(myCoords);
        setMapZoom(14);
      },
      (error) => {
        console.warn("Geolocation access denied by user.");
      }
    );
  };

  // Geocode Search City via Nominatim
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "TravelMindAI/1.0 (contact@travelmind.ai)" }
      });
      if (!res.ok) throw new Error("Search service error.");
      const data = await res.json();

      if (data && data.length > 0) {
        const newCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setMapCenter(newCoords);
        setMapZoom(13);
      } else {
        setSearchError("No coordinates found.");
      }
    } catch (err) {
      setSearchError("Geocoding failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Resolve Map Bounds to only render visible markers
  // (Leaflet does this fast natively, but adding marker clustering or clean keying improves React rendering)
  const validCenter = mapCenter && mapCenter[0] && mapCenter[1] ? mapCenter : [48.8566, 2.3522];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-950 flex flex-col justify-between">
      
      {/* Search and Geolocation Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row gap-2 pointer-events-none">
        
        {/* Geocode Search Input */}
        {showSearch && (
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex items-center bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl p-1 shadow-lg pointer-events-auto max-w-sm w-full"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city e.g. London..."
              className="flex-1 bg-transparent border-0 outline-none text-xs text-white font-medium px-3 focus:ring-0 placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Locate Me Button */}
        <button
          onClick={handleGeolocation}
          className="bg-gray-900/90 backdrop-blur-md border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white p-3 rounded-2xl shadow-lg pointer-events-auto transition cursor-pointer self-start flex items-center justify-center"
          title="Find my location"
        >
          <Compass className="w-4 h-4" />
        </button>

        {searchError && (
          <div className="bg-red-950/90 backdrop-blur-md border border-red-900/40 text-red-400 px-3 py-2 rounded-xl text-[10px] font-semibold self-start pointer-events-auto shadow-md">
            {searchError}
          </div>
        )}
      </div>

      {/* Leaflet Map Frame */}
      <div className="flex-1 w-full h-full z-10">
        <MapContainer 
          center={validCenter} 
          zoom={mapZoom} 
          style={{ width: "100%", height: "100%" }}
          zoomControl={false} // Disable default so we can place custom layout later if needed
        >
          <TileLayer
            attribution={tileAttribution || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
            url={tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />

          <MapController center={validCenter} zoom={mapZoom} />

          {/* User Geolocation Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={createThemedIcon("#fb8500", "🧍")}>
              <Popup>
                <div className="text-gray-900 font-sans p-1">
                  <h4 className="font-bold text-xs">You are here</h4>
                  <p className="text-[10px] text-gray-500">Shared location coordinates.</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Render markers array */}
          {markers.map((m, idx) => {
            if (!m.lat || !m.lng) return null;
            
            const emoji = 
              m.type === "hotel" ? "🏨" :
              m.type === "destination" ? "📍" :
              m.type === "attraction" ? "🗺️" :
              m.type === "restaurant" ? "🍽️" :
              m.type === "airport" ? "✈️" : "📌";

            const color = 
              m.type === "hotel" ? "#3b82f6" : // Blue
              m.type === "destination" ? "#ef4444" : // Red
              m.type === "attraction" ? "#eab308" : // Yellow
              m.type === "restaurant" ? "#22c55e" : // Green
              "#a855f7"; // Purple

            return (
              <Marker 
                key={idx} 
                position={[m.lat, m.lng]} 
                icon={createThemedIcon(color, emoji)}
              >
                <Popup>
                  <div className="text-gray-900 font-sans p-1 max-w-[200px]">
                    <h4 className="font-bold text-sm leading-tight">{m.name}</h4>
                    {m.details && (
                      <div className="mt-1 space-y-1">
                        {m.details.rating && <p className="text-[11px]">⭐ {m.details.rating} / 5</p>}
                        {m.details.price && <p className="text-[11px] font-bold text-emerald-600">${m.details.price} / night</p>}
                        {m.details.address && <p className="text-[10px] text-gray-500 line-clamp-2">{m.details.address}</p>}
                        
                        {onHotelSelect && m.type === "hotel" && (
                          <button
                            onClick={() => onHotelSelect(m.details)}
                            className="mt-2 w-full text-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Draw Route Polyline */}
          {route && route.length >= 2 && (
            <Polyline 
              positions={route} 
              color="#00b4d8" 
              weight={4} 
              dashArray="6, 12"
            />
          )}
        </MapContainer>
      </div>

    </div>
  );
}
