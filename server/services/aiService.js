/**
 * aiService.js — AI abstraction layer.
 *
 * All calls to Groq are made here.
 * To swap providers: replace the SDK import and update the exported functions.
 * Controllers do NOT need to change.
 */

const Groq = require("groq-sdk");

let groqClient = null;
const getGroq = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key" });
  }
  return groqClient;
};

const MODEL = "llama-3.3-70b-versatile"; // fast, capable, free-tier friendly

/**
 * Helper — call Groq chat completions and return the text response.
 */
const callGroq = async (messages, systemPrompt = null) => {
  const msgs = [];
  if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
  msgs.push(...messages);

  const completion = await getGroq().chat.completions.create({
    model: MODEL,
    messages: msgs,
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
};

/**
 * generateItinerary
 * Sends a structured prompt to Groq and returns parsed JSON.
 * @param {object} params  { destination, startDate, endDate, travelers, budget, travelStyle, interests }
 * @returns {object}       Parsed itinerary JSON
 */
const generateItinerary = async (params) => {
  const { destination, startDate, endDate, travelers, budget, travelStyle, interests } = params;

  const numDays = Math.max(
    1,
    Math.round(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    )
  );

  const interestList = Array.isArray(interests) ? interests.join(", ") : interests;

  const prompt = `You are an expert travel planner. Generate a detailed ${numDays}-day travel itinerary for the following trip:

- Destination: ${destination}
- Travel dates: ${startDate} to ${endDate} (${numDays} days)
- Number of travelers: ${travelers}
- Total budget: $${budget} USD
- Travel style: ${travelStyle}
- Interests: ${interestList || "general sightseeing"}

CRITICAL: Return ONLY valid JSON — no markdown, no triple backticks, no explanation text before or after.

The JSON must exactly match this schema:
{
  "summary": "2-3 sentence overview of the trip",
  "estimatedCost": "total cost estimate as a string e.g. $2,400",
  "days": [
    {
      "day": 1,
      "morning": "activity description",
      "afternoon": "activity description",
      "evening": "activity description",
      "restaurants": ["Restaurant Name — cuisine type, price range"],
      "transport": "how to get around this day",
      "estimatedBudget": "$XXX",
      "tips": ["practical tip 1", "practical tip 2"]
    }
  ]
}

Generate exactly ${numDays} day objects. Be specific, practical, and tailor recommendations to the travel style and interests.`;

  const text = await callGroq([{ role: "user", content: prompt }]);

  // Strip accidental markdown fences
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

/**
 * chatResponse
 * Sends a multi-turn conversation history to Groq and returns the assistant reply.
 * @param {Array} messages  [{ role: "user"|"model", content: string }]
 * @returns {string}        Assistant reply text
 */
const chatResponse = async (messages) => {
  const systemPrompt =
    "You are Maya, a friendly and knowledgeable AI travel assistant for TravelMind AI. " +
    "You provide expert travel advice, itinerary tips, destination guides, budgeting help, " +
    "packing tips, and safety information. Keep answers concise, helpful, and engaging. " +
    "Use markdown formatting where appropriate (bullet points, bold for key terms, etc.).";

  // Groq uses "assistant" role instead of "model"
  const groqMessages = messages.map((m) => ({
    role: m.role === "model" ? "assistant" : m.role,
    content: m.content,
  }));

  return await callGroq(groqMessages, systemPrompt);
};

/**
 * getBudgetInsights
 * Returns AI-generated cost-saving tips based on the trip context.
 * @param {object} context  { destination, budget, totalSpent, expenses: [{category, amount}] }
 * @returns {Array}         Array of tip strings
 */
const getBudgetInsights = async (context) => {
  const { destination, budget, totalSpent, expenses } = context;
  const remaining = budget - totalSpent;
  const pct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

  const expenseSummary = Array.isArray(expenses)
    ? expenses.map((e) => `${e.category}: $${e.amount}`).join(", ")
    : "no expenses logged";

  const prompt = `You are a travel budget expert. A traveler is visiting ${destination}.
Their total budget is $${budget}. They have spent $${totalSpent} (${pct}%), with $${remaining} remaining.
Expense breakdown: ${expenseSummary}.

Give 5–7 practical, specific money-saving tips tailored to this destination and their spending pattern.

Return ONLY a JSON array of strings. No markdown, no extra text.
Example: ["Tip 1", "Tip 2", "Tip 3"]`;

  const text = await callGroq([{ role: "user", content: prompt }]);
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

/**
 * getTravelTips
 * Returns categorised travel tips for a destination.
 * @param {string} destination
 * @returns {object}  { weather, currency, safety, emergency, customs, food, scams, transport, language, internet }
 */
const getTravelTips = async (destination) => {
  const prompt = `You are a travel expert. Provide essential travel tips for: ${destination}.

Return ONLY valid JSON matching this exact schema. No markdown, no extra text:
{
  "weather": "weather overview and best time to visit",
  "currency": "currency name, exchange tips, typical costs",
  "safety": "overall safety rating and key safety advice",
  "emergency": "police number, ambulance number, tourist helpline",
  "customs": "2-3 key local customs or etiquette rules",
  "food": "3-4 must-try local dishes",
  "scams": "2-3 common tourist scams to avoid",
  "transport": "best ways to get around locally",
  "language": "official language and 3-4 useful phrases",
  "internet": "SIM card advice and average data costs"
}`;

  const text = await callGroq([{ role: "user", content: prompt }]);
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

/**
 * generatePackingList
 * Returns a categorized packing list for a trip.
 * @param {object} params { destination, startDate, endDate, weather, travelStyle, activities }
 * @returns {Array} Array of item objects { name, category, essential, quantity }
 */
const generatePackingList = async (params) => {
  const { destination, startDate, endDate, weather, travelStyle, activities } = params;
  const activityList = Array.isArray(activities) ? activities.join(", ") : activities || "general";

  const prompt = `You are a professional travel packing expert. Generate a comprehensive packing list for the following trip:

- Destination: ${destination}
- Travel dates: ${startDate || "TBD"} to ${endDate || "TBD"}
- Weather/Climate: ${weather || "Unknown"}
- Travel style: ${travelStyle || "Adventure"}
- Activities: ${activityList}

Return ONLY a valid JSON array. No markdown, no extra text. Each item must follow this exact schema:
[
  {
    "name": "Item name",
    "category": "One of: Documents, Clothing, Electronics, Health & Medicine, Toiletries, Accessories, Food & Snacks, Travel Essentials, Optional Items",
    "essential": true,
    "quantity": 1
  }
]

Generate 30-50 items covering all relevant categories. Mark truly essential items as essential:true, nice-to-haves as essential:false. Tailor specifically to the destination, weather, and activities.`;

  const text = await callGroq([{ role: "user", content: prompt }]);
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

/**
 * enhanceJournalEntry
 * AI-enhances a travel journal entry.
 * @param {object} entry { title, content, location, date, mood }
 * @returns {object} { improvedContent, catchyTitle, hashtags, caption, summary }
 */
const enhanceJournalEntry = async (entry) => {
  const { title, content, location, date, mood } = entry;

  const prompt = `You are a travel writer and social media expert. Enhance the following travel journal entry:

Title: ${title}
Location: ${location || "Unknown"}
Date: ${date || "Unknown"}
Mood: ${mood || "Happy"}
Content: ${content}

Return ONLY valid JSON matching this exact schema. No markdown, no extra text:
{
  "improvedContent": "Beautifully rewritten version with vivid descriptions, better grammar, and rich storytelling",
  "catchyTitle": "An engaging, catchy title for the journal entry",
  "hashtags": ["#travel", "#adventure", "#wanderlust"],
  "caption": "A compelling 2-3 sentence social media caption",
  "summary": "A 1-2 sentence memory summary of this day"
}

Make the improved content engaging, vivid, and personal. Keep it authentic to the traveler's experience.`;

  const text = await callGroq([{ role: "user", content: prompt }]);
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

/**
 * analyzeRealHotels
 * Sends a real list of hotels (from Geoapify) to Groq for intelligent ranking.
 * Returns 5 curated picks: budget, luxury, family, business, overall.
 * @param {Array} hotels  Array of normalised hotel objects from mapService
 * @param {string} destination
 * @param {number} guests
 * @param {string} budgetCategory - "Budget" | "Luxury" | "Business" | "Family" | "Romantic"
 */
const analyzeRealHotels = async (hotels, destination, guests = 1, budgetCategory = "Standard") => {
  if (!hotels || hotels.length === 0) {
    throw new Error("No hotels to analyze.");
  }

  // Build a concise hotel summary for Groq (keep tokens low)
  const hotelList = hotels.slice(0, 15).map((h, i) => ({
    index: i + 1,
    name: h.name,
    address: h.address,
    rating: h.rating || "N/A",
    stars: h.stars || "N/A",
    distanceKm: h.distanceKm || "N/A",
    amenities: h.amenities || {},
    categories: (h.categories || []).slice(0, 3),
  }));

  const prompt = `You are a premium travel concierge AI. You have been given a list of REAL hotels fetched from a places database near ${destination}. Analyze them and select the best picks.

Travel context:
- Destination: ${destination}
- Guests: ${guests}
- Preferred category: ${budgetCategory}

Real hotels available:
${JSON.stringify(hotelList, null, 2)}

Your task: Select and analyze ONE hotel from the above list for each category:
1. best_budget - Most affordable with good value
2. best_luxury - Highest quality and premium experience
3. best_family - Most family-friendly (space, amenities, safety)
4. best_business - Best for business travelers (connectivity, location, professionalism)
5. best_overall - Best all-round pick considering all factors

CRITICAL: Return ONLY valid JSON, no markdown, no extra text. Use the EXACT hotel index numbers from the list above. Schema:

{
  "best_budget": {
    "hotelIndex": 1,
    "category": "Best Budget Pick",
    "whySelected": "2-3 sentence explanation of why this hotel was selected",
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"],
    "nearbyAttractions": ["attraction 1", "attraction 2", "attraction 3"],
    "nearbyRestaurants": ["restaurant type 1", "restaurant type 2"],
    "bestSuitedFor": ["Budget travellers", "Backpackers"],
    "travelTip": "One specific practical tip for staying at this hotel"
  },
  "best_luxury": { ... same schema ... },
  "best_family": { ... same schema ... },
  "best_business": { ... same schema ... },
  "best_overall": { ... same schema ... }
}`;

  const text = await callGroq([{ role: "user", content: prompt }], 
    "You are a travel expert AI. Always return valid JSON only. Never add markdown or explanations outside the JSON.");
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

/**
 * getHotelRecommendations (kept for backwards compatibility, now wraps analyzeRealHotels stub)
 */
const getHotelRecommendations = async (params) => {
  const { destination, checkIn, checkOut, guests, budgetRange, category } = params;
  
  const prompt = `You are a professional travel accommodations planner. Recommend 4 distinct hotels in ${destination} for a trip from ${checkIn} to ${checkOut} for ${guests} guest(s).
The traveler has a budget range of: ${budgetRange} USD per night and preferred category of: ${category}.

Provide exactly one recommendation for each of the following categories:
1. Best Budget Hotel
2. Best Luxury Hotel
3. Best Family Hotel
4. Best Business Hotel

Return ONLY a valid JSON object. No markdown, no extra text:
{
  "budget": { "name": "string", "price": number, "rating": number, "address": "string", "distance": number, "image": "string", "amenities": { "wiFi": boolean, "breakfast": boolean, "pool": boolean, "parking": boolean, "airConditioning": boolean }, "explanation": "string" },
  "luxury": { ... },
  "family": { ... },
  "business": { ... }
}`;

  const text = await callGroq([{ role: "user", content: prompt }]);
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

/**
 * getWeatherAdvice
 * AI-generated weather advice based on conditions.
 */
const getWeatherAdvice = async (weatherData) => {
  const prompt = `You are a travel advisor. Based on the following weather forecast for a destination:
${JSON.stringify(weatherData)}

Generate 3-4 practical, short weather-based travel advices (e.g., "Carry an umbrella", "Avoid afternoon hiking", "Pack warm clothing", "Apply sunscreen").
Return ONLY a JSON array of strings. No markdown, no extra text.
Example: ["Advice 1", "Advice 2", "Advice 3"]`;

  const text = await callGroq([{ role: "user", content: prompt }]);
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
};

module.exports = { 
  generateItinerary, 
  chatResponse, 
  getBudgetInsights, 
  getTravelTips, 
  generatePackingList, 
  enhanceJournalEntry,
  analyzeRealHotels,
  getHotelRecommendations,
  getWeatherAdvice
};


