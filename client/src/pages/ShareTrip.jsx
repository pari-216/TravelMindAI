import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { 
  MapPin, Calendar, DollarSign, Users, Briefcase, 
  Sparkles, CheckCircle2, ChevronRight, Award, ShieldAlert,
  BookOpen, Receipt, CheckSquare, Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function ShareTrip() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPublicTrip = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/shares/public/${token}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError("This shared trip link is invalid, expired, or has been deleted by the owner.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicTrip();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white/80 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading shared trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white/80 flex items-center justify-center text-white p-6">
        <div className="bg-white border border-sky-100 rounded-3xl p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>Access Failed</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const { trip, itinerary, expenses, packingList, journals } = data;

  const durationDays = Math.ceil(
    (new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-white/80 text-white pb-16">
      
      {/* Brand Header */}
      <header className="border-b border-gray-900 bg-white/80/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent truncate">
            TravelMind AI
          </span>
        </div>
        <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
          <Award className="w-3.5 h-3.5" /> Shared Trip View
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Cover Section */}
        <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src={trip.coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} 
            alt="Destination Cover" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-50 via-white/60 to-transparent" />
          
          <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
            <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 backdrop-blur border border-blue-500/30 text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              {trip.status}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{trip.destination}</h1>
            <span className="flex items-center text-slate-600 font-medium">
              <MapPin className="w-5 h-5 mr-1 text-slate-500" /> {trip.country}
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-sky-100 rounded-2xl p-5 flex items-center space-x-4">
            <Calendar className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dates</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-white border border-sky-100 rounded-2xl p-5 flex items-center space-x-4">
            <DollarSign className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Budget</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">${trip.budget}</p>
            </div>
          </div>

          <div className="bg-white border border-sky-100 rounded-2xl p-5 flex items-center space-x-4">
            <Users className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Travelers</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{trip.travelers} ({trip.travelType})</p>
            </div>
          </div>

          <div className="bg-white border border-sky-100 rounded-2xl p-5 flex items-center space-x-4">
            <Briefcase className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{durationDays} Days</p>
            </div>
          </div>
        </div>

        {/* Content Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Itinerary timeline (Left Column, Wider) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Itinerary */}
            <section className="bg-white/30 border border-sky-100 rounded-3xl p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-sky-100 pb-4">
                <Clock className="w-5 h-5 text-blue-400" /> Daily Itinerary
              </h2>

              {itinerary && itinerary.days && itinerary.days.length > 0 ? (
                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white">
                  {itinerary.days.map((day) => (
                    <div key={day.day} className="relative pl-10 space-y-4">
                      {/* Timeline Dot */}
                      <span className="absolute left-[10px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-gray-950 shadow-md"></span>
                      
                      <div>
                        <h3 className="text-lg font-bold" style={{color:"var(--text-heading)"}}>Day {day.day}</h3>
                        <p className="text-xs text-blue-400 font-semibold">{day.estimatedBudget ? `Estimated Budget: ${day.estimatedBudget}` : ""}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {day.morning && (
                          <div className="bg-white/80/40 border border-gray-900 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">🌅 Morning</span>
                            <p className="text-slate-600 leading-relaxed">{day.morning}</p>
                          </div>
                        )}
                        {day.afternoon && (
                          <div className="bg-white/80/40 border border-gray-900 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">☀️ Afternoon</span>
                            <p className="text-slate-600 leading-relaxed">{day.afternoon}</p>
                          </div>
                        )}
                        {day.evening && (
                          <div className="bg-white/80/40 border border-gray-900 rounded-2xl p-4">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">🌙 Evening</span>
                            <p className="text-slate-600 leading-relaxed">{day.evening}</p>
                          </div>
                        )}
                      </div>

                      {day.restaurants && day.restaurants.length > 0 && (
                        <div className="text-xs text-slate-500 pl-2">
                          <strong className="text-slate-600">🍽 Recommended Dining:</strong> {day.restaurants.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-4">No daily itinerary generated for this shared trip.</p>
              )}
            </section>

            {/* Travel Journal Memory Snippets */}
            <section className="bg-white/30 border border-sky-100 rounded-3xl p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-sky-100 pb-4">
                <BookOpen className="w-5 h-5 text-purple-400" /> Travel Journal memories
              </h2>

              {journals && journals.length > 0 ? (
                <div className="space-y-6">
                  {journals.map((j) => (
                    <div key={j._id} className="bg-white/80/40 border border-sky-100/60 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-base" style={{color:"var(--text-heading)"}}>{j.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{j.date} {j.location ? `• ${j.location}` : ""}</p>
                        </div>
                        <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                          Mood: {j.mood}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {j.aiEnhanced ? j.aiData?.improvedContent || j.content : j.content}
                      </p>
                      {j.aiData?.hashtags && j.aiData.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {j.aiData.hashtags.map((tag, idx) => (
                            <span key={idx} className="text-xs text-blue-400 font-medium">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-4">No public journal memories shared for this trip.</p>
              )}
            </section>
          </div>

          {/* Sidebar components (Right Column, Narrower) */}
          <div className="space-y-8">
            
            {/* Notes */}
            <section className="bg-white/30 border border-sky-100 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">Trip Notes</h3>
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                {trip.notes || "No notes shareable for this trip."}
              </p>
            </section>

            {/* Expenses Summary */}
            <section className="bg-white/30 border border-sky-100 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" /> Expenses Summary
              </h3>

              {expenses && expenses.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/80/60 p-4 rounded-xl border border-gray-900">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Total Spent</span>
                    <span className="text-lg font-bold text-emerald-400">
                      ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {expenses.slice(0, 5).map((e) => (
                      <div key={e._id} className="flex justify-between items-center text-xs py-2 border-b border-sky-100/50 last:border-0">
                        <div>
                          <p className="font-bold text-slate-700">{e.description || e.category}</p>
                          <p className="text-[10px] text-slate-400">{new Date(e.date).toLocaleDateString()}</p>
                        </div>
                        <span className="font-bold text-slate-600">${e.amount}</span>
                      </div>
                    ))}
                    {expenses.length > 5 && (
                      <p className="text-[10px] text-slate-400 text-center italic pt-1">
                        + {expenses.length - 5} more expenses logged
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No expenses logged for this trip.</p>
              )}
            </section>

            {/* Packing Checklist Progress */}
            <section className="bg-white/30 border border-sky-100 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" /> Packing List Progress
              </h3>

              {packingList && packingList.items && packingList.items.length > 0 ? (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Completion</span>
                      <span>{packingList.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-gray-900">
                      <div 
                        className="bg-amber-500 h-full transition-all duration-500" 
                        style={{ width: `${packingList.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Checklist Sample */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {packingList.items.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs py-1">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.packed ? "text-emerald-500" : "text-gray-700"}`} />
                        <span className={`truncate ${item.packed ? "text-slate-400 line-through" : "text-slate-600"}`}>{item.name}</span>
                      </div>
                    ))}
                    {packingList.items.length > 10 && (
                      <p className="text-[10px] text-slate-400 text-center italic pt-1">
                        + {packingList.items.length - 10} more packing items
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No packing list shareable for this trip.</p>
              )}
            </section>

          </div>

        </div>

      </div>

    </div>
  );
}
