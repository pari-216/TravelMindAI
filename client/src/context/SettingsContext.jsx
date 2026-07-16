import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

const ACCENT_COLORS_MAP = {
  blue: { hex: "#3b82f6", hover: "#2563eb", glow: "rgba(59, 130, 246, 0.2)" },
  purple: { hex: "#8b5cf6", hover: "#7c3aed", glow: "rgba(139, 92, 246, 0.2)" },
  green: { hex: "#10b981", hover: "#059669", glow: "rgba(16, 185, 129, 0.2)" },
  orange: { hex: "#f97316", hover: "#ea580c", glow: "rgba(249, 115, 22, 0.2)" },
  red: { hex: "#ef4444", hover: "#dc2626", glow: "rgba(239, 68, 68, 0.2)" },
  pink: { hex: "#ec4899", hover: "#db2777", glow: "rgba(236, 72, 153, 0.2)" },
  teal: { hex: "#14b8a6", hover: "#0d9488", glow: "rgba(20, 184, 166, 0.2)" },
  indigo: { hex: "#6366f1", hover: "#4f46e5", glow: "rgba(99, 102, 241, 0.2)" },
};

const DEFAULT_SETTINGS = {
  theme: "dark",
  accentColor: "blue",
  dashboardLayout: ["analytics", "weather", "budget", "trips", "suggestions", "reminders", "favorites"],
  notifications: {
    email: false,
    browser: true,
    reminders: true,
    budgetAlerts: true,
    weatherAlerts: true,
    packingReminders: true,
    aiSuggestions: true
  },
  accessibility: {
    fontSize: "medium",
    highContrast: false,
    reduceMotion: false,
    focusIndicators: true
  },
  travel: {
    currency: "USD",
    distanceUnit: "km",
    tempUnit: "celsius",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24",
    travelStyle: "Adventure",
    budgetRange: "Moderate"
  }
};

export function SettingsProvider({ children }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch settings from API
  useEffect(() => {
    if (!token) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/settings");
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      } catch {
        // Fallback to local
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  // 2. Apply theme, accent, and accessibility variables instantly
  useEffect(() => {
    const root = document.documentElement;

    // Apply Theme
    root.classList.remove("light", "dark");
    if (settings.theme === "system") {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isSystemDark ? "dark" : "light");
    } else {
      root.classList.add(settings.theme || "dark");
    }

    // Apply Accent Colors
    const accent = ACCENT_COLORS_MAP[settings.accentColor] || ACCENT_COLORS_MAP.blue;
    root.style.setProperty("--accent-color", accent.hex);
    root.style.setProperty("--accent-hover", accent.hover);
    root.style.setProperty("--accent-glow", accent.glow);

    // Apply Accessibility Font Size
    root.classList.remove("font-size-small", "font-size-medium", "font-size-large", "font-size-xl");
    root.classList.add(`font-size-${settings.accessibility?.fontSize || "medium"}`);

    // High Contrast Mode
    if (settings.accessibility?.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Reduce Motion Mode
    if (settings.accessibility?.reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

  }, [settings]);

  // Save Settings wrapper
  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    if (token) {
      try {
        const { data } = await api.put("/settings", newSettings);
        setSettings(data);
      } catch (err) {
        console.error("Failed to save settings to server:", err);
      }
    }
  };

  // Reset Settings wrapper
  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    if (token) {
      try {
        const { data } = await api.post("/settings/reset");
        setSettings(data);
      } catch (err) {
        console.error("Failed to reset settings:", err);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      preferences,
      loading,
      saveSettings,
      resetSettings,
      setSettings,
      setPreferences
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
export { ACCENT_COLORS_MAP };
