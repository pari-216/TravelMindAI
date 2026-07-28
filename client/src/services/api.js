import axios from "axios";

const api = axios.create({
  // In dev, Vite proxies /api → http://localhost:5000/api
  // In production, set VITE_API_URL to your deployed backend URL (e.g. https://api.yourdomain.com/api)
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
