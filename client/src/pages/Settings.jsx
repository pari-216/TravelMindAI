import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon, Moon, Sun, Monitor, Palette, LayoutGrid, Bell, Shield,
  User, Compass, Sparkles, RefreshCw, Eye, EyeOff, Save, Trash2, ShieldAlert,
  ArrowUp, ArrowDown, Download, CheckCircle, AlertCircle, FileText, HelpCircle,
  Minimize2, Accessibility as AccessibilityIcon, Info, RotateCcw
} from "lucide-react";
import { useSettings, ACCENT_COLORS_MAP } from "../context/SettingsContext";
import api from "../services/api";
import PageTransition from "../components/PageTransition";

const TABS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "dashboard", label: "Dashboard Customization", icon: LayoutGrid },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Compass },
  { id: "account", label: "Account Settings", icon: User },
  { id: "accessibility", label: "Accessibility", icon: AccessibilityIcon },
  { id: "privacy", label: "Privacy & Danger Zone", icon: Shield },
  { id: "application", label: "Application Info", icon: Info },
];

const DATE_FORMATS = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "MMM DD, YYYY"];
const FONT_SIZES = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium (Default)" },
  { id: "large", label: "Large" },
  { id: "xl", label: "Extra Large" },
];

export default function Settings() {
  const { settings, preferences, saveSettings, resetSettings, setPreferences } = useSettings();
  
  const [activeTab, setActiveTab] = useState("appearance");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Account settings form local states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "", relation: "" });

  // Init account form fields when preferences load
  useEffect(() => {
    if (preferences) {
      setPhone(preferences.phone || "");
      setBio(preferences.bio || "");
      setAvatar(preferences.avatar || "");
      if (preferences.emergencyContact) {
        setEmergencyContact(preferences.emergencyContact);
      }
    }
    const tokenUser = localStorage.getItem("user");
    if (tokenUser) {
      try {
        const u = JSON.parse(tokenUser);
        setEmail(u.email || "");
      } catch {}
    }
  }, [preferences]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  // ─── Save Layouts & Theme Updates ──────────────────────────────────────────
  const updateSettingNode = (section, key, value) => {
    const updated = { ...settings };
    if (section) {
      updated[section] = { ...updated[section], [key]: value };
    } else {
      updated[key] = value;
    }
    saveSettings(updated);
    showSuccess("Setting applied instantly!");
  };

  // ─── Dashboard Customization Reordering ────────────────────────────────────
  const moveWidget = (index, direction) => {
    const layout = [...settings.dashboardLayout];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= layout.length) return;

    // Swap
    const temp = layout[index];
    layout[index] = layout[nextIndex];
    layout[nextIndex] = temp;

    updateSettingNode(null, "dashboardLayout", layout);
  };

  // ─── Account Save Handler ──────────────────────────────────────────────────
  const handleAccountSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      showError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email,
        phone,
        avatar,
        emergencyContact,
      };
      if (newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }

      const { data } = await api.post("/settings/account", payload);
      
      // Update local storage user
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      if (data.preferences) {
        setPreferences(data.preferences);
      }

      showSuccess("Account details updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update account details.");
    } finally {
      setLoading(false);
    }
  };

  // Base64 uploader helper
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ─── Privacy Zone Actions ──────────────────────────────────────────────────
  const handleExportData = () => {
    window.open("http://localhost:5000/api/settings/privacy/export", "_blank");
    showSuccess("Data export started!");
  };

  const handleDeleteHistory = async (type) => {
    if (!window.confirm(`Are you sure you want to delete all your ${type}? This action cannot be undone.`)) return;

    try {
      const { data } = await api.post("/settings/privacy/delete-history", { type });
      showSuccess(data.message || "History deleted successfully.");
    } catch {
      showError("Failed to delete history.");
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate your account? You will be signed out.")) return;
    try {
      await api.post("/settings/privacy/deactivate");
      localStorage.clear();
      window.location.href = "/login";
    } catch {}
  };

  const handleDeleteAccount = async () => {
    const doubleCheck = window.prompt("To permanently delete your account and all travel history, type 'DELETE MY ACCOUNT' below:");
    if (doubleCheck !== "DELETE MY ACCOUNT") {
      showError("Confirmation text did not match.");
      return;
    }

    try {
      await api.delete("/settings/privacy/delete-account");
      localStorage.clear();
      window.location.href = "/register";
    } catch {
      showError("Failed to delete account.");
    }
  };

  // ─── Application Policy Views ──────────────────────────────────────────────
  const [modalText, setModalText] = useState("");
  const showPolicyModal = (title, text) => {
    setModalText({ title, text });
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-400" /> System Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Configure your personal preferences, theme mode, dashboard layout, and security keys.</p>
        </div>

        {/* Feedback Banners */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-2xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Settings panel grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Side tabs selector */}
          <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 custom-scrollbar shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-accent text-white shadow-accent"
                      : "text-slate-500 hover:bg-white/45 hover:text-sky-700"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Content Panel */}
          <div className="lg:col-span-3 bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 md:p-8 min-h-[500px] shadow-2xl">
            
            {/* SECTION 1: APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-blue-400" /> Theme & Accent Styling
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Changes are applied immediately across all dashboards, maps, and inputs.</p>
                </div>

                {/* Theme Selector */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interface Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "dark", label: "Dark Mode", icon: Moon },
                      { id: "light", label: "Light Mode", icon: Sun },
                      { id: "system", label: "Follow System OS", icon: Monitor },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateSettingNode(null, "theme", t.id)}
                        className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition cursor-pointer ${
                          settings.theme === t.id
                            ? "bg-accent/10 border-accent text-accent shadow-accent"
                            : "bg-white/80 border-sky-100 text-slate-500 hover:border-sky-100"
                        }`}
                      >
                        <t.icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Accent Highlight Color</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {Object.keys(ACCENT_COLORS_MAP).map(colorKey => (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => updateSettingNode(null, "accentColor", colorKey)}
                        className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer capitalize ${
                          settings.accentColor === colorKey
                            ? "border-white scale-105"
                            : "border-sky-100 hover:border-sky-100"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-black/40"
                          style={{ backgroundColor: ACCENT_COLORS_MAP[colorKey].hex }}
                        />
                        <span className="text-[9px] font-bold text-slate-500">{colorKey}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: DASHBOARD CUSTOMIZATION */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-blue-400" /> Dashboard Customization
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Show, hide, and reorder widgets dynamically. Drag-and-drop simulated via reorder controls.</p>
                </div>

                {/* Widgets toggler list */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Widget Panels</label>
                  <div className="space-y-2.5">
                    {settings.dashboardLayout.map((widget, index) => (
                      <div
                        key={widget}
                        className="flex items-center justify-between p-3.5 bg-white/80/40 border border-sky-100 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-600 capitalize">{widget} Panel</span>
                        </div>

                        {/* Reorder and Hide controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveWidget(index, -1)}
                            className="p-1.5 bg-white border border-sky-100 text-slate-500 hover:text-sky-700 rounded-lg transition disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === settings.dashboardLayout.length - 1}
                            onClick={() => moveWidget(index, 1)}
                            className="p-1.5 bg-white border border-sky-100 text-slate-500 hover:text-sky-700 rounded-lg transition disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" /> Notification Channels
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Configure email alerts and browser-based system push notifications.</p>
                </div>

                <div className="space-y-3.5">
                  <ToggleRow
                    label="Email Alerts"
                    desc="Receive trip digests (placeholder)"
                    val={settings.notifications?.email}
                    onChange={(v) => updateSettingNode("notifications", "email", v)}
                  />
                  <ToggleRow
                    label="Browser Notifications"
                    desc="Enable browser notification push states"
                    val={settings.notifications?.browser}
                    onChange={(v) => updateSettingNode("notifications", "browser", v)}
                  />
                  <ToggleRow
                    label="Trip Reminders"
                    desc="Notify me of scheduled events and deadlines"
                    val={settings.notifications?.reminders}
                    onChange={(v) => updateSettingNode("notifications", "reminders", v)}
                  />
                  <ToggleRow
                    label="Budget Alerts"
                    desc="Warn when monthly budgets approach limits"
                    val={settings.notifications?.budgetAlerts}
                    onChange={(v) => updateSettingNode("notifications", "budgetAlerts", v)}
                  />
                  <ToggleRow
                    label="Weather Notifications"
                    desc="Get destination storm/rain weather advisories"
                    val={settings.notifications?.weatherAlerts}
                    onChange={(v) => updateSettingNode("notifications", "weatherAlerts", v)}
                  />
                </div>
              </div>
            )}

            {/* SECTION 4: PREFERENCES */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-400" /> Default Travel Preferences
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Customize units and formats used for itinerary generators and advisor logs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Currency */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Default Currency</label>
                    <input
                      type="text"
                      value={settings.travel?.currency}
                      onChange={(e) => updateSettingNode("travel", "currency", e.target.value.toUpperCase().slice(0, 3))}
                      maxLength={3}
                      className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>

                  {/* Date Format */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date Format</label>
                    <select
                      value={settings.travel?.dateFormat}
                      onChange={(e) => updateSettingNode("travel", "dateFormat", e.target.value)}
                      className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    >
                      {DATE_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  {/* Distance Unit */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Distance Unit</label>
                    <select
                      value={settings.travel?.distanceUnit}
                      onChange={(e) => updateSettingNode("travel", "distanceUnit", e.target.value)}
                      className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    >
                      <option value="km">Kilometers (km)</option>
                      <option value="miles">Miles (mi)</option>
                    </select>
                  </div>

                  {/* Temperature Unit */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Temperature Unit</label>
                    <select
                      value={settings.travel?.tempUnit}
                      onChange={(e) => updateSettingNode("travel", "tempUnit", e.target.value)}
                      className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    >
                      <option value="celsius">Celsius (°C)</option>
                      <option value="fahrenheit">Fahrenheit (°F)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: ACCOUNT */}
            {activeTab === "account" && (
              <form onSubmit={handleAccountSave} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" /> Credentials & Profiles
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Manage passwords, email validations, and emergency logs.</p>
                </div>

                {/* Avatar block */}
                <div className="flex items-center gap-4 border-b border-sky-100 pb-4">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-xl font-bold text-white">U</div>
                  )}
                  <label className="px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold transition hover:bg-sky-100 cursor-pointer">
                    Change Picture
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/80 border border-sky-100 rounded-xl py-2.5 px-3.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white/80 border border-sky-100 rounded-xl py-2.5 px-3.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="border-t border-sky-100 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-600">Security Password Change</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Emergency contact */}
                <div className="border-t border-sky-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-600">🚨 Emergency Contact Log</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={emergencyContact.name}
                      onChange={e => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                      className="bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={emergencyContact.phone}
                      onChange={e => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                      className="bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Relation"
                      value={emergencyContact.relation}
                      onChange={e => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                      className="bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> {loading ? "Saving..." : "Save Settings"}
                </button>
              </form>
            )}

            {/* SECTION 6: ACCESSIBILITY */}
            {activeTab === "accessibility" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AccessibilityIcon className="w-5 h-5 text-blue-400" /> Accessibility Adjustments
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Configure layout scale size and screen optimizations.</p>
                </div>

                <div className="space-y-4">
                  {/* Font scale */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">App Layout Font Size</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {FONT_SIZES.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updateSettingNode("accessibility", "fontSize", f.id)}
                          className={`p-3 border rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                            settings.accessibility?.fontSize === f.id
                              ? "bg-accent/10 border-accent text-accent"
                              : "bg-white/80 border-sky-100 text-slate-500 hover:border-sky-100"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contrast & Animation toggle settings */}
                  <ToggleRow
                    label="High Contrast Colors"
                    desc="Pure contrast modes for screen legibility"
                    val={settings.accessibility?.highContrast}
                    onChange={(v) => updateSettingNode("accessibility", "highContrast", v)}
                  />
                  <ToggleRow
                    label="Reduce Transitions & Motion"
                    desc="Disable all dashboard page transitions and charts fade-ins"
                    val={settings.accessibility?.reduceMotion}
                    onChange={(v) => updateSettingNode("accessibility", "reduceMotion", v)}
                  />
                  <ToggleRow
                    label="Force Accessibility Focus Indicators"
                    desc="Retain solid blue focus borders when using keyboard tab actions"
                    val={settings.accessibility?.focusIndicators}
                    onChange={(v) => updateSettingNode("accessibility", "focusIndicators", v)}
                  />
                </div>
              </div>
            )}

            {/* SECTION 7: PRIVACY & DANGER */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" /> Privacy & Danger Zone
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Export your travel metadata files or permanently wipe your account history.</p>
                </div>

                <div className="space-y-4">
                  {/* Export block */}
                  <div className="p-4 bg-white/80/40 border border-sky-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold" style={{color:"var(--text-heading)"}}>Export All Data</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Downloads all trips, budget charts, and packing items as a JSON file.</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-sky-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Data
                    </button>
                  </div>

                  {/* Wipe records */}
                  <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-red-400 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Clear Records History</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Select specific segments to delete from databases. These actions cannot be undone.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["trips", "chats", "journals", "reminders", "packing"].map(type => (
                        <button
                          key={type}
                          onClick={() => handleDeleteHistory(type)}
                          className="px-3 py-1.5 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/45 text-[10px] font-bold rounded-lg capitalize transition cursor-pointer"
                        >
                          Clear {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-red-400 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Danger Zone</h4>
                    <p className="text-[10px] text-slate-400">
                      Permanently deactivate or destroy your entire account profile.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeactivate}
                        className="px-4 py-2 bg-white hover:bg-white border border-sky-100 text-slate-500 hover:text-sky-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Deactivate Account
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: APPLICATION */}
            {activeTab === "application" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" /> Application Details
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">System status and platform policy information.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white/80/30 border border-sky-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">VERSION</span>
                      <span className="font-semibold text-white">v1.0.0 (Production)</span>
                    </div>
                    <div className="p-3 bg-white/80/30 border border-sky-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">ENVIRONMENT</span>
                      <span className="font-semibold text-white">Production Stable</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => showPolicyModal("Privacy Policy", "Your data is stored locally in your MongoDB instance. AI requests are sent securely to Groq with no training persistence.")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-sky-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Privacy Policy
                    </button>
                    <button
                      onClick={() => showPolicyModal("Terms & Conditions", "This software is provided 'as is' for travel organization. Free APIs (Nominatim, Overpass) are subject to global rate limits.")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-sky-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Terms & Conditions
                    </button>
                    <button
                      onClick={() => {
                        resetSettings();
                        showSuccess("Settings restored to factory defaults.");
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-sky-100 text-slate-500 hover:text-sky-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Factory Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Policy Modal Overlay */}
      <AnimatePresence>
        {modalText && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalText("")}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white/80 border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-base" style={{color:"var(--text-heading)"}}>{modalText.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{modalText.text}</p>
              <button
                onClick={() => setModalText("")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

// Inline toggle row helper
function ToggleRow({ label, desc, val, onChange }) {
  return (
    <div className="p-4 bg-white/80/40 border border-sky-100 rounded-2xl flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold" style={{color:"var(--text-heading)"}}>{label}</h4>
        {desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!val)}
        style={{ width: "44px", height: "24px" }}
        className={`relative rounded-full transition-colors cursor-pointer flex-shrink-0 ${
          val ? "bg-accent" : "bg-sky-100"
        }`}
        aria-label={`Toggle ${label}`}
        role="switch"
        aria-checked={val}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: val ? "23px" : "3px",
            width: "18px",
            height: "18px",
            backgroundColor: "white",
            borderRadius: "50%",
            transition: "left 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}
