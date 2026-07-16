import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Plus, MapPin } from "lucide-react";
import TripCard from "../components/TripCard";
import { Link } from "react-router-dom";

export default function Trips() {
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get("http://localhost:5000/api/trips", config);
        setTrips(data);
      } catch (error) {
        console.error("Error fetching trips", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{color:"var(--text-heading)"}}>My Trips</h1>
          <p className="text-slate-500 mt-1">Manage and view all your travel itineraries.</p>
        </div>
        <Link 
          to="/dashboard/trips/new" 
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Trip
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-white/80 rounded-2xl animate-pulse border border-sky-100"></div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-sky-50/50 border border-dashed border-sky-100 rounded-2xl">
          <MapPin className="w-16 h-16 text-slate-400 mb-4" />
          <h3 className="text-xl font-bold" style={{color:"var(--text-heading)"}}>No trips found</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm text-center">You haven't planned any trips yet. Click the button above to start your first journey!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <TripCard key={trip._id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
