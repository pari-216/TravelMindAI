const aiService = require("../services/aiService");

// In-memory weather cache
const weatherCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const getCachedWeather = (key) => {
  const entry = weatherCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
};

const setWeatherCache = (key, data) => {
  weatherCache.set(key, { data, ts: Date.now() });
};

// Mock weather generator helper
const generateMockWeather = (destination) => {
  const hash = destination.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tempBase = 15 + (hash % 15); // 15 to 30 degrees C
  
  const current = {
    temp: Math.round(tempBase),
    feels_like: Math.round(tempBase - 1),
    humidity: 50 + (hash % 30),
    wind_speed: (2 + (hash % 10)).toFixed(1),
    uv_index: (3 + (hash % 6)),
    rain_chance: hash % 2 === 0 ? 0 : 40,
    condition: hash % 3 === 0 ? "Clouds" : hash % 3 === 1 ? "Rain" : "Clear",
    description: hash % 3 === 0 ? "partly cloudy" : hash % 3 === 1 ? "light rain" : "clear sky",
    icon: hash % 3 === 0 ? "03d" : hash % 3 === 1 ? "10d" : "01d",
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayIdx = new Date().getDay();

  const forecast = [];
  for (let i = 0; i < 5; i++) {
    const dayName = days[(currentDayIdx + i) % 7];
    const offset = Math.sin(i) * 3;
    const cond = (hash + i) % 3 === 0 ? "Clouds" : (hash + i) % 3 === 1 ? "Rain" : "Clear";
    forecast.push({
      day: dayName,
      temp_max: Math.round(tempBase + offset + 2),
      temp_min: Math.round(tempBase + offset - 3),
      condition: cond,
      description: cond === "Clouds" ? "scattered clouds" : cond === "Rain" ? "moderate rain" : "clear sky",
      icon: cond === "Clouds" ? "03d" : cond === "Rain" ? "10d" : "01d",
    });
  }

  return { current, forecast, isMock: true };
};

/**
 * GET /api/weather
 * Query weather for a destination
 */
exports.getWeather = async (req, res) => {
  try {
    const { destination } = req.query;

    if (!destination) {
      return res.status(400).json({ message: "destination parameter is required" });
    }

    const normDest = destination.trim().toLowerCase();
    const cached = getCachedWeather(normDest);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.warn("OPENWEATHER_API_KEY is missing. Returning mock weather data.");
      const mockData = generateMockWeather(destination);
      
      // Generate AI advice based on mock weather
      try {
        mockData.aiAdvice = await aiService.getWeatherAdvice(mockData);
      } catch (err) {
        mockData.aiAdvice = ["Pack appropriately for the season.", "Stay hydrated.", "Check local forecasts before traveling."];
      }
      
      setWeatherCache(normDest, mockData);
      return res.json(mockData);
    }

    // Call OpenWeatherMap API
    // 1. Current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(destination)}&units=metric&appid=${apiKey}`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      console.warn("OpenWeatherMap request failed. Falling back to mock data.");
      const mockData = generateMockWeather(destination);
      try {
        mockData.aiAdvice = await aiService.getWeatherAdvice(mockData);
      } catch (err) {
        mockData.aiAdvice = ["Carry an umbrella in case of rain.", "Keep hydrated.", "Enjoy your trip!"];
      }
      setWeatherCache(normDest, mockData);
      return res.json(mockData);
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // Map current weather
    const current = {
      temp: Math.round(currentData.main.temp),
      feels_like: Math.round(currentData.main.feels_like),
      humidity: currentData.main.humidity,
      wind_speed: currentData.wind.speed,
      uv_index: 5, // OpenWeatherMap standard current API doesn't provide UV (needs one-call). Default to 5.
      rain_chance: currentData.rain ? currentData.rain["1h"] || currentData.rain["3h"] || 0 : 0,
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
    };

    // Group 3-hour forecast into daily forecast
    const forecastList = forecastData.list;
    const dailyGroup = {};

    forecastList.forEach((item) => {
      const dateStr = item.dt_txt.split(" ")[0]; // YYYY-MM-DD
      if (!dailyGroup[dateStr]) {
        dailyGroup[dateStr] = [];
      }
      dailyGroup[dateStr].push(item);
    });

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const forecast = [];

    // Extract the daily stats
    Object.keys(dailyGroup).slice(0, 5).forEach((dateStr) => {
      const items = dailyGroup[dateStr];
      const date = new Date(dateStr);
      const dayName = daysOfWeek[date.getDay()];

      let temp_max = -999;
      let temp_min = 999;
      // Get mid-day forecast for condition icon (index around middle)
      const midDayItem = items[Math.floor(items.length / 2)] || items[0];

      items.forEach((item) => {
        if (item.main.temp_max > temp_max) temp_max = item.main.temp_max;
        if (item.main.temp_min < temp_min) temp_min = item.main.temp_min;
      });

      forecast.push({
        day: dayName,
        temp_max: Math.round(temp_max),
        temp_min: Math.round(temp_min),
        condition: midDayItem.weather[0].main,
        description: midDayItem.weather[0].description,
        icon: midDayItem.weather[0].icon,
      });
    });

    const result = { current, forecast, isMock: false };

    // Get AI advice based on weather
    try {
      result.aiAdvice = await aiService.getWeatherAdvice(result);
    } catch (err) {
      result.aiAdvice = [
        current.temp > 28 ? "High temperatures expected. Stay hydrated and avoid peak afternoon sun." : "Dress in comfortable layers.",
        current.condition === "Rain" ? "Carry an umbrella or rain jacket." : "Great weather for outdoor exploring.",
        "Check local advisory if you plan outdoor hiking.",
      ];
    }

    setWeatherCache(normDest, result);
    res.json(result);
  } catch (error) {
    console.error("getWeather error:", error.message);
    // Ultimate fallback
    const fallback = generateMockWeather(req.query.destination || "Destination");
    fallback.aiAdvice = ["Pack comfortable clothing.", "Check weather forecasts locally."];
    res.json(fallback);
  }
};
