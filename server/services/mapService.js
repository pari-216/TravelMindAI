/**
 * mapService.js
 * Works 100% FREE with no API keys required.
 *
 * Geocoding:  Nominatim (OSM) — free, no key needed
 * Hotels:     Overpass API (OSM) — free, no key needed
 * Enhanced:   MapTiler geocoding (if MAPTILER_API_KEY is set)
 * Enhanced:   Geoapify places (if GEOAPIFY_API_KEY is set)
 *
 * Both enhancements are optional. The system falls back to OSM automatically.
 */

const axios = require("axios");

// ─── In-Memory Cache (15 min TTL) ─────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

const getCached = (key) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
};
const setCache = (key, data) => cache.set(key, { data, ts: Date.now() });

// ─── Geocoding ─────────────────────────────────────────────────────────────────
/**
 * Geocode a destination string → { lat, lon, displayName }
 * Uses MapTiler if key is configured, otherwise Nominatim (OSM).
 */
const geocodeDestination = async (query) => {
  if (!query || !query.trim()) throw new Error("Destination query is required.");

  const cacheKey = `geo:${query.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const maptilerKey = process.env.MAPTILER_API_KEY;
  const useMaptiler = maptilerKey && maptilerKey !== "your_maptiler_api_key_here";

  let result;

  if (useMaptiler) {
    // ── MapTiler Geocoding (enhanced) ──────────────────────────────────────
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${maptilerKey}&limit=1`;
    const response = await axios.get(url, { timeout: 8000 });
    const features = response.data?.features;
    if (!features || features.length === 0) throw new Error(`Could not find location: "${query}"`);
    const f = features[0];
    const [lon, lat] = f.geometry.coordinates;
    result = { lat, lon, displayName: f.place_name || query };
  } else {
    // ── Nominatim OSM Geocoding (free fallback) ────────────────────────────
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
    const response = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "TravelMindAI/1.0 (contact@travelmind.ai)" },
    });
    const data = response.data;
    if (!data || data.length === 0) throw new Error(`Could not find location: "${query}". Try a more specific name.`);
    const place = data[0];
    result = {
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
      displayName: place.display_name || query,
    };
  }

  setCache(cacheKey, result);
  return result;
};

// ─── Hotel Search ──────────────────────────────────────────────────────────────
/**
 * Fetch real hotels near lat/lon.
 * Uses Geoapify if key is configured, otherwise Overpass API (OSM).
 */
const getHotelsNearby = async (lat, lon, radiusMeters = 5000, limit = 20) => {
  const cacheKey = `hotels:${lat.toFixed(4)},${lon.toFixed(4)},${radiusMeters}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const geoapifyKey = process.env.GEOAPIFY_API_KEY;
  const useGeoapify = geoapifyKey && geoapifyKey !== "your_geoapify_api_key_here";

  let hotels;

  if (useGeoapify) {
    hotels = await getHotelsGeoapify(lat, lon, radiusMeters, limit, geoapifyKey);
  } else {
    hotels = await getHotelsOverpass(lat, lon, radiusMeters, limit);
  }

  setCache(cacheKey, hotels);
  return hotels;
};

// ─── Geoapify Places (enhanced, requires key) ─────────────────────────────────
const getHotelsGeoapify = async (lat, lon, radiusMeters, limit, apiKey) => {
  const url = `https://api.geoapify.com/v2/places`;
  const params = {
    categories: "accommodation.hotel,accommodation.motel,accommodation.guest_house,accommodation.hostel",
    filter: `circle:${lon},${lat},${radiusMeters}`,
    bias: `proximity:${lon},${lat}`,
    limit,
    apiKey,
  };

  const response = await axios.get(url, { params, timeout: 10000 });
  const features = response.data?.features || [];

  return features.map((f) => {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates || [];
    const hotelLon = coords[0] || null;
    const hotelLat = coords[1] || null;
    const distKm = hotelLat && hotelLon ? haversineKm(lat, lon, hotelLat, hotelLon) : null;

    return {
      id: p.place_id || `hotel_${Math.random().toString(36).substr(2, 9)}`,
      name: p.name || "Unnamed Hotel",
      address: p.formatted || p.address_line1 || "Address unavailable",
      lat: hotelLat,
      lon: hotelLon,
      distanceKm: distKm ? Math.round(distKm * 10) / 10 : null,
      rating: p.rating || null,
      website: p.website || null,
      phone: p.contact?.phone || p.datasource?.raw?.phone || null,
      categories: p.categories || [],
      stars: p.datasource?.raw?.stars || null,
      amenities: extractAmenitiesGeoapify(p),
      openInMapsUrl: `https://www.google.com/maps/search/?api=1&query=${hotelLat},${hotelLon}`,
      source: "geoapify",
    };
  });
};

// ─── Overpass API (OSM) — completely free, no key needed ─────────────────────
const getHotelsOverpass = async (lat, lon, radiusMeters, limit) => {
  // Overpass QL: find all hotels/motels/hostels/guesthouses within radius
  const query = `
    [out:json][timeout:25];
    (
      node["tourism"~"hotel|motel|hostel|guest_house|apartment"](around:${radiusMeters},${lat},${lon});
      way["tourism"~"hotel|motel|hostel|guest_house|apartment"](around:${radiusMeters},${lat},${lon});
      node["building"="hotel"](around:${radiusMeters},${lat},${lon});
      way["building"="hotel"](around:${radiusMeters},${lat},${lon});
    );
    out center ${limit};
  `;

  const response = await axios.post(
    "https://overpass-api.de/api/interpreter",
    `data=${encodeURIComponent(query)}`,
    {
      timeout: 20000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const elements = response.data?.elements || [];

  return elements
    .filter((el) => el.tags && (el.tags.name || el.tags["name:en"]))
    .slice(0, limit)
    .map((el) => {
      const tags = el.tags || {};
      // Ways have center coordinates; nodes have direct lat/lon
      const hotelLat = el.lat || el.center?.lat || null;
      const hotelLon = el.lon || el.center?.lon || null;
      const distKm = hotelLat && hotelLon ? haversineKm(lat, lon, hotelLat, hotelLon) : null;

      // Build address from OSM addr tags
      const addressParts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:city"] || tags["addr:suburb"],
        tags["addr:state"],
      ].filter(Boolean);
      const address = addressParts.length > 0
        ? addressParts.join(", ")
        : tags["addr:full"] || "Address unavailable";

      // Parse stars
      const starsRaw = tags["stars"] || tags["tourism:stars"];
      const stars = starsRaw ? parseInt(starsRaw) : null;

      return {
        id: `osm_${el.type}_${el.id}`,
        name: tags["name:en"] || tags.name || "Unnamed Hotel",
        address,
        lat: hotelLat,
        lon: hotelLon,
        distanceKm: distKm ? Math.round(distKm * 10) / 10 : null,
        rating: stars ? Math.min(5, stars) : null,
        website: tags.website || tags["contact:website"] || null,
        phone: tags.phone || tags["contact:phone"] || null,
        categories: [tags.tourism || "hotel"],
        stars,
        amenities: extractAmenitiesOSM(tags),
        openInMapsUrl: hotelLat && hotelLon
          ? `https://www.google.com/maps/search/?api=1&query=${hotelLat},${hotelLon}`
          : null,
        source: "osm",
      };
    });
};

// ─── Nearby POIs ───────────────────────────────────────────────────────────────
/**
 * Fetch nearby places of a given type using Overpass API (free).
 */
const getNearbyPOIs = async (lat, lon, type = "restaurant", radiusMeters = 1000) => {
  const cacheKey = `pois:${type}:${lat.toFixed(4)},${lon.toFixed(4)},${radiusMeters}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const geoapifyKey = process.env.GEOAPIFY_API_KEY;
  const useGeoapify = geoapifyKey && geoapifyKey !== "your_geoapify_api_key_here";

  try {
    let pois;
    if (useGeoapify) {
      pois = await getPOIsGeoapify(lat, lon, type, radiusMeters, geoapifyKey);
    } else {
      pois = await getPOIsOverpass(lat, lon, type, radiusMeters);
    }
    setCache(cacheKey, pois);
    return pois;
  } catch (err) {
    console.error(`getNearbyPOIs(${type}) error:`, err.message);
    return [];
  }
};

const getPOIsOverpass = async (lat, lon, type, radiusMeters) => {
  const typeMap = {
    restaurant: `["amenity"~"restaurant|cafe|fast_food|bar"]`,
    attraction: `["tourism"~"attraction|museum|theme_park|gallery|monument|viewpoint"]`,
    transport: `["public_transport"~"station|stop_area"]["railway"~"station|halt"]`,
  };
  const filter = typeMap[type] || `["tourism"="attraction"]`;

  const query = `
    [out:json][timeout:15];
    (
      node${filter}(around:${radiusMeters},${lat},${lon});
    );
    out 10;
  `;

  const response = await axios.post(
    "https://overpass-api.de/api/interpreter",
    `data=${encodeURIComponent(query)}`,
    { timeout: 15000, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const elements = response.data?.elements || [];
  return elements
    .filter((el) => el.tags?.name)
    .slice(0, 10)
    .map((el) => ({
      id: `osm_${el.type}_${el.id}`,
      name: el.tags.name,
      address: el.tags["addr:street"] || "",
      lat: el.lat,
      lon: el.lon,
      categories: [type],
    }));
};

const getPOIsGeoapify = async (lat, lon, type, radiusMeters, apiKey) => {
  const categoryMap = {
    restaurant: "catering.restaurant,catering.cafe,catering.fast_food",
    attraction: "tourism.attraction,tourism.sights,entertainment",
    transport: "public_transport,airport",
  };
  const categories = categoryMap[type] || "tourism.attraction";

  const response = await axios.get("https://api.geoapify.com/v2/places", {
    params: {
      categories,
      filter: `circle:${lon},${lat},${radiusMeters}`,
      bias: `proximity:${lon},${lat}`,
      limit: 10,
      apiKey,
    },
    timeout: 8000,
  });

  return (response.data?.features || []).map((f) => {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates || [];
    return {
      id: p.place_id,
      name: p.name || "Unknown",
      address: p.formatted || "",
      lat: coords[1],
      lon: coords[0],
      categories: p.categories || [],
    };
  });
};

// ─── Utility ───────────────────────────────────────────────────────────────────
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const extractAmenitiesOSM = (tags) => ({
  wifi: tags.internet_access === "wlan" || tags.internet_access === "yes",
  parking: !!(tags["parking"] || tags["amenity"] === "parking"),
  pool: tags.leisure === "swimming_pool" || !!(tags.swimming_pool),
  restaurant: tags.restaurant === "yes" || tags["amenity"] === "restaurant",
  airConditioning: tags.air_conditioning === "yes",
  breakfast: tags.breakfast === "yes",
  petFriendly: tags.pets === "yes" || tags.dogs === "yes",
  bar: tags.bar === "yes" || tags.amenity === "bar",
  gym: tags.leisure === "fitness_centre" || tags.gym === "yes",
});

const extractAmenitiesGeoapify = (p) => {
  const raw = p.datasource?.raw || {};
  return {
    wifi: !!(raw.internet_access || raw.wifi),
    parking: !!(raw.parking || raw["parking:fee"]),
    pool: !!(raw.swimming_pool || raw.leisure === "swimming_pool"),
    restaurant: !!(raw.restaurant),
    airConditioning: !!(raw.air_conditioning),
    breakfast: !!(raw.breakfast),
    petFriendly: !!(raw.pets_allowed),
    bar: !!(raw.bar),
    gym: !!(raw.gym || raw.leisure === "fitness_centre"),
  };
};

module.exports = {
  geocodeDestination,
  getHotelsNearby,
  getNearbyPOIs,
  haversineKm,
};
