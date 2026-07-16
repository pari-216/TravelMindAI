/**
 * geocodingService.js
 * Uses OpenStreetMap Nominatim API to geocode destination strings.
 * No API key is required, but must conform to Nominatim's usage policy (User-Agent header).
 */

const geocodeDestination = async (destination, country) => {
  const query = country ? `${destination}, ${country}` : destination;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TravelMindAI/1.0 (contact@travelmind.ai)"
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }

    // Secondary fallback: Try searching destination only (omitting country) if combined fails
    if (country) {
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          "User-Agent": "TravelMindAI/1.0 (contact@travelmind.ai)"
        }
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          return {
            latitude: parseFloat(fallbackData[0].lat),
            longitude: parseFloat(fallbackData[0].lon)
          };
        }
      }
    }

    console.warn(`No coordinates found for destination: ${query}`);
    return null;
  } catch (error) {
    console.error("Geocoding service fetch error:", error.message);
    return null;
  }
};

module.exports = { geocodeDestination };
