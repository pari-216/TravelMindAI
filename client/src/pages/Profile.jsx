import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  User, Mail, Lock, Edit3, Save, X, CheckCircle,
  AlertCircle, Map, Receipt, BookOpen, Briefcase,
  Camera, Shield, Calendar, Sparkles, Phone, Globe,
  Heart, HeartCrack, Info, Plus
} from "lucide-react";
import api from "../services/api";
import PageTransition from "../components/PageTransition";

export default function Profile() {
  const { token, user: authUser } = useAuth();

  // Profile basic data
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ trips: 0, expenses: 0, journals: 0, packingLists: 0 });

  // Preferences data
  const [prefs, setPrefs] = useState({
    avatar: "", phone: "", nationality: "", bio: "", currency: "USD",
    language: "English", travelStyle: "Adventure", budgetPreference: "Moderate",
    favoriteActivities: [], foodPreferences: [], emergencyContact: { name: "", phone: "", relation: "" }
  });

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Tag fields input
  const [newActivity, setNewActivity] = useState("");
  const [newFood, setNewFood] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchProfileAndPrefs();
  }, [token]);

  const fetchProfileAndPrefs = async () => {
    setLoading(true);
    try {
      const [profileRes, prefsRes, tripsRes, expensesRes, journalsRes, packingRes] = await Promise.allSettled([
        api.get("/auth/profile"),
        api.get("/preferences"),
        api.get("/trips"),
        api.get("/expenses"),
        api.get("/journal"),
        api.get("/packing"),
      ]);

      if (profileRes.status === "fulfilled") {
        const p = profileRes.value.data;
        setProfile(p);
        setName(p.name);
        setEmail(p.email);
      }

      if (prefsRes.status === "fulfilled") {
        setPrefs(prefsRes.value.data);
      }

      setStats({
        trips: tripsRes.status === "fulfilled" ? tripsRes.value.data.length : 0,
        expenses: expensesRes.status === "fulfilled" ? expensesRes.value.data.length : 0,
        journals: journalsRes.status === "fulfilled" ? journalsRes.value.data.length : 0,
        packingLists: packingRes.status === "fulfilled" ? packingRes.value.data.length : 0,
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      // 1. Update basic profile credentials
      const payload = { name, email };
      if (newPassword) {
        payload.password = newPassword;
        payload.currentPassword = currentPassword;
      }
      const { data: updatedProfile } = await api.put("/auth/profile", payload);
      setProfile(updatedProfile);

      // 2. Update extended preferences
      const { data: updatedPrefs } = await api.put("/preferences", prefs);
      setPrefs(updatedPrefs);

      setSuccessMsg("Profile and preferences saved successfully!");
      setEditMode(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // Avatar Base64 uploader
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrefs(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setEditMode(false);
    setName(profile?.name || "");
    setEmail(profile?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    fetchProfileAndPrefs();
  };

  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-10 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
            <User className="w-8 h-8 text-blue-400" /> Account & Preferences
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your avatar, preferences, and security settings.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar block */}
            <div className="relative shrink-0 group">
              {prefs.avatar ? (
                <img
                  src={prefs.avatar}
                  alt={profile?.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/20 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg border-2 border-blue-500/20">
                  {initials}
                </div>
              )}
              {editMode && (
                <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer text-xs font-bold text-white">
                  <Camera className="w-4 h-4 mr-1" /> Edit
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-1">
              <h2 className="text-2xl font-bold" style={{color:"var(--text-heading)"}}>{profile?.name}</h2>
              <p className="text-slate-500 text-sm">{profile?.email}</p>
              {prefs.bio && <p className="text-xs text-slate-400 max-w-lg mt-2">{prefs.bio}</p>}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  <Calendar className="w-3 h-3" /> Member since {memberSince}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <Shield className="w-3 h-3" /> Verified Member
                </span>
              </div>
            </div>

            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Trips Planned", value: stats.trips, icon: Map, color: "text-blue-400" },
            { label: "Expenses Logged", value: stats.expenses, icon: Receipt, color: "text-emerald-400" },
            { label: "Journal Memories", value: stats.journals, icon: BookOpen, color: "text-amber-400" },
            { label: "Packing Lists", value: stats.packingLists, icon: Briefcase, color: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-sky-100 rounded-2xl p-5 text-center shadow-md">
              <stat.icon className={`w-7 h-7 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl text-xs">
            <CheckCircle className="w-4.5 h-4.5 shrink-0" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-2xl text-xs">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Form View / Info View */}
        {editMode ? (
          <form onSubmit={handleSave} className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-sky-100 pb-3">
              <Edit3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold" style={{color:"var(--text-heading)"}}>Edit Profile & Preferences</h3>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={prefs.phone}
                  onChange={e => setPrefs({ ...prefs, phone: e.target.value })}
                  placeholder="+1 555-0199"
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nationality</label>
                <input
                  type="text"
                  value={prefs.nationality}
                  onChange={e => setPrefs({ ...prefs, nationality: e.target.value })}
                  placeholder="e.g. Canadian"
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Travel preferences */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Preferred Travel Style</label>
                <select
                  value={prefs.travelStyle}
                  onChange={e => setPrefs({ ...prefs, travelStyle: e.target.value })}
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {["Adventure", "Luxury", "Budget", "Business", "Family", "Solo", "Couple", "Cultural"].map(t => (
                    <option key={t} value={t} className="text-slate-800">{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Budget Tier</label>
                <select
                  value={prefs.budgetPreference}
                  onChange={e => setPrefs({ ...prefs, budgetPreference: e.target.value })}
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {["Budget", "Moderate", "Luxury"].map(b => (
                    <option key={b} value={b} className="text-slate-800">{b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Default Currency</label>
                <input
                  type="text"
                  value={prefs.currency}
                  onChange={e => setPrefs({ ...prefs, currency: e.target.value.toUpperCase().slice(0, 3) })}
                  maxLength={3}
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bio / Travel Philosophy</label>
              <textarea
                value={prefs.bio}
                onChange={e => setPrefs({ ...prefs, bio: e.target.value })}
                placeholder="Share a bit about your travel plans or style..."
                className="w-full h-20 bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Tags lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Favorite Activities</label>
                <div className="flex flex-wrap gap-1.5">
                  {prefs.favoriteActivities.map(act => (
                    <span key={act} className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      {act}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setPrefs({ ...prefs, favoriteActivities: prefs.favoriteActivities.filter(a => a !== act) })} />
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={e => setNewActivity(e.target.value)}
                    placeholder="e.g. Hiking"
                    className="flex-1 bg-white/80 border border-sky-100 rounded-xl py-1.5 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newActivity.trim() && !prefs.favoriteActivities.includes(newActivity.trim())) {
                        setPrefs({ ...prefs, favoriteActivities: [...prefs.favoriteActivities, newActivity.trim()] });
                        setNewActivity("");
                      }
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-sky-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-sky-100"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Food Preferences</label>
                <div className="flex flex-wrap gap-1.5">
                  {prefs.foodPreferences.map(food => (
                    <span key={food} className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      {food}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setPrefs({ ...prefs, foodPreferences: prefs.foodPreferences.filter(f => f !== food) })} />
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFood}
                    onChange={e => setNewFood(e.target.value)}
                    placeholder="e.g. Vegetarian"
                    className="flex-1 bg-white/80 border border-sky-100 rounded-xl py-1.5 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFood.trim() && !prefs.foodPreferences.includes(newFood.trim())) {
                        setPrefs({ ...prefs, foodPreferences: [...prefs.foodPreferences, newFood.trim()] });
                        setNewFood("");
                      }
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-sky-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-sky-100"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-sky-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-600">🚨 Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Contact Name</label>
                  <input
                    type="text"
                    value={prefs.emergencyContact?.name || ""}
                    onChange={e => setPrefs({ ...prefs, emergencyContact: { ...prefs.emergencyContact, name: e.target.value } })}
                    className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Contact Phone</label>
                  <input
                    type="text"
                    value={prefs.emergencyContact?.phone || ""}
                    onChange={e => setPrefs({ ...prefs, emergencyContact: { ...prefs.emergencyContact, phone: e.target.value } })}
                    className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Relation</label>
                  <input
                    type="text"
                    value={prefs.emergencyContact?.relation || ""}
                    onChange={e => setPrefs({ ...prefs, emergencyContact: { ...prefs.emergencyContact, relation: e.target.value } })}
                    className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password security */}
            <div className="border-t border-sky-100 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" /> Change Security Password (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 transition"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 transition"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full bg-white/80 border border-sky-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl disabled:opacity-50 transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-sky-50 hover:bg-white text-slate-600 font-bold text-xs rounded-2xl transition cursor-pointer border border-sky-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Info display card */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* About card */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="font-bold text-base" style={{color:"var(--text-heading)"}}>Travel Bio</h3>
                {prefs.bio ? (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{prefs.bio}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No travel bio written yet. Click edit profile to add one!</p>
                )}
              </div>

              {/* Preferences Summary */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-5 shadow-xl">
                <h3 className="font-bold text-base" style={{color:"var(--text-heading)"}}>Preferences & Settings</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Travel Style</span>
                    <span className="font-semibold text-slate-800">{prefs.travelStyle}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Budget Category</span>
                    <span className="font-semibold text-slate-800">{prefs.budgetPreference}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Currency</span>
                    <span className="font-semibold text-slate-800">{prefs.currency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Language</span>
                    <span className="font-semibold text-slate-800">{prefs.language}</span>
                  </div>
                </div>

                {/* Favorite activities tags */}
                {prefs.favoriteActivities?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Favorite Activities</span>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.favoriteActivities.map(act => (
                        <span key={act} className="text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Food preferences tags */}
                {prefs.foodPreferences?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Food & Dining</span>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.foodPreferences.map(food => (
                        <span key={food} className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Details block */}
            <div className="space-y-6">
              <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="font-bold text-base" style={{color:"var(--text-heading)"}}>Contact Information</h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Phone</p>
                      <p className="text-slate-600">{prefs.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nationality</p>
                      <p className="text-slate-600">{prefs.nationality || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {prefs.emergencyContact?.name && (
                <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-3.5 shadow-xl">
                  <h3 className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
                    🚨 Emergency Contact
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold">NAME</p>
                      <p className="text-slate-800 font-bold">{prefs.emergencyContact.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400">PHONE</p>
                      <p className="text-slate-800 font-bold">{prefs.emergencyContact.phone}</p>
                    </div>
                    {prefs.emergencyContact.relation && (
                      <div>
                        <p className="text-[9px] text-slate-400">RELATIONSHIP</p>
                        <p className="text-slate-600">{prefs.emergencyContact.relation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
}
