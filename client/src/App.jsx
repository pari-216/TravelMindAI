import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import { Loader2 } from "lucide-react";

// Sleek loading screen for lazy loaded components
const PageLoader = () => (
  <div className="min-h-[70vh] flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
  </div>
);

// Lazy Loaded Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Trips = lazy(() => import("./pages/Trips"));
const CreateTrip = lazy(() => import("./pages/CreateTrip"));
const TripDetails = lazy(() => import("./pages/TripDetails"));
const EditTrip = lazy(() => import("./pages/EditTrip"));
const Budget = lazy(() => import("./pages/Budget"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Packing = lazy(() => import("./pages/Packing"));
const AIItinerary = lazy(() => import("./pages/AIItinerary"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Journal = lazy(() => import("./pages/Journal"));
const Hotels = lazy(() => import("./pages/Hotels"));
const Reminders = lazy(() => import("./pages/Reminders"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Currency = lazy(() => import("./pages/Currency"));
const ShareTrip = lazy(() => import("./pages/ShareTrip"));

// Phase 7 Pages
const Analytics = lazy(() => import("./pages/Analytics"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Favorites = lazy(() => import("./pages/Favorites"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { SettingsProvider } from "./context/SettingsContext";

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/share/:token" element={<ShareTrip />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="trips" element={<Trips />} />
              <Route path="trips/new" element={<CreateTrip />} />
              <Route path="trips/:id" element={<TripDetails />} />
              <Route path="trips/:id/edit" element={<EditTrip />} />
              <Route path="budget" element={<Budget />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="packing" element={<Packing />} />
              <Route path="planner" element={<AIItinerary />} />
              <Route path="ai-itinerary" element={<AIItinerary />} />
              <Route path="ai-chat" element={<AIChat />} />
              <Route path="journal" element={<Journal />} />
              <Route path="hotels" element={<Hotels />} />
              <Route path="currency" element={<Currency />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              
              {/* Fallback inside dashboard */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Global fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
     </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
