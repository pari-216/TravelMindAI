import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function EditTrip() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    destination: "",
    country: "",
    coverImage: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    travelType: "Solo",
    budget: "",
    notes: "",
    status: "Upcoming"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await api.get(`/trips/${id}`);
        
        // Convert ISO dates to YYYY-MM-DD for input fields
        const start = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "";
        const end = data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : "";
        
        setFormData({ ...data, startDate: start, endDate: end });
      } catch (error) {
        setError("Failed to load trip data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return setError("End date cannot be before start date.");
    }
    if (Number(formData.budget) < 0) {
      return setError("Budget cannot be less than 0.");
    }

    setSaving(true);
    try {
      await api.put(`/trips/${id}`, formData);
      navigate(`/dashboard/trips/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link to={`/dashboard/trips/${id}`} className="p-2 bg-white/80 hover:bg-sky-50 text-slate-500 rounded-full transition-colors border border-sky-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold" style={{color:"var(--text-heading)"}}>Edit Trip</h1>
          <p className="text-slate-500 mt-1">Make changes to your itinerary.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white backdrop-blur-xl border border-sky-100 rounded-3xl p-6 md:p-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Destination *</label>
            <input type="text" name="destination" value={formData.destination} onChange={handleChange} required className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Country *</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange} required className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Cover Image URL</label>
            <input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors">
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Start Date *</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">End Date *</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Travelers</label>
            <input type="number" min="1" name="travelers" value={formData.travelers} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Travel Type</label>
            <select name="travelType" value={formData.travelType} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors">
              <option value="Solo">Solo</option>
              <option value="Family">Family</option>
              <option value="Friends">Friends</option>
              <option value="Business">Business</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Budget ($) *</label>
            <input type="number" min="0" step="0.01" name="budget" value={formData.budget} onChange={handleChange} required className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600">Notes</label>
          <textarea name="notes" value={formData.notes || ""} onChange={handleChange} rows="3" className="w-full px-4 py-3 bg-white border border-sky-100 rounded-xl text-slate-800 outline-none focus:border-blue-500 transition-colors resize-none"></textarea>
        </div>

        <div className="pt-4 border-t border-sky-100 flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
            {saving ? "Updating..." : <><Save className="w-5 h-5 mr-2" /> Update Trip</>}
          </button>
        </div>
      </form>
    </div>
  );
}
