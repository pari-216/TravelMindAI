import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import PageTransition from "../components/PageTransition";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-bounce">
          <Compass className="w-12 h-12 text-blue-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-white">404</h1>
          <h2 className="text-2xl font-bold text-slate-600">Lost in Transit?</h2>
          <p className="text-slate-400 max-w-md">
            The destination you are trying to reach doesn't exist, has been moved, or is temporarily unavailable.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-500/20"
        >
          <Home className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </PageTransition>
  );
}
