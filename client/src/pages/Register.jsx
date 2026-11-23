import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Sparkles, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Frontend: Submitting registration...");
    setLoading(true);
    setMessage("Submitting registration...");
    setError("");

    try {
      console.log("Frontend: Sending request...");
      const { data } = await api.post("/auth/register", { name, email, password });
      
      console.log("Frontend: Registration successful.");
      setMessage("Registration successful. Redirecting to dashboard...");
      
      const userData = { _id: data._id, name: data.name, email: data.email };
      login(userData, data.token);
      
      console.log("Frontend: Redirecting to dashboard...");
      navigate("/dashboard");
    } catch (err) {
      console.log("Frontend Error:", err);
      const backendMessage = err.response?.data?.message;
      const status = err.response?.status;
      let errMsg;
      if (backendMessage) {
        errMsg = backendMessage;
      } else if (!err.response || status === 502 || status === 503 || status === 504) {
        errMsg = "Cannot reach the server. Please make sure the backend is running and try again.";
      } else {
        errMsg = err.message || "An unexpected error occurred.";
      }
      setError(errMsg);
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--gradient-page)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(circle, #38BDF8 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #FFD166 0%, transparent 70%)" }} />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Card */}
        <div
          className="rounded-3xl p-8 space-y-6"
          style={{
            background: "rgba(255,255,255,0.80)",
            backdropFilter: "blur(20px) saturate(150%)",
            border: "1.5px solid var(--border-color)",
            boxShadow: "0 20px 60px rgba(56,189,248,0.15), 0 4px 16px rgba(0,0,0,0.04)"
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-heading)" }}>Create account</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Start your journey with TravelMind AI</p>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="p-3 rounded-xl text-center text-sm font-medium"
              style={{ background: "rgba(56,189,248,0.10)", color: "#0284C7", border: "1px solid rgba(56,189,248,0.25)" }}>
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl text-center text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.20)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all text-sm"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)"
                }}
                onFocus={e => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-color)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all text-sm"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)"
                }}
                onFocus={e => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-color)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl outline-none transition-all text-sm"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)"
                }}
                onFocus={e => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-color)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all"
              style={{
                background: loading ? "#BAE6FD" : "var(--gradient-primary)",
                boxShadow: loading ? "none" : "0 4px 20px rgba(56,189,248,0.40)"
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold" style={{ color: "var(--color-primary)" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          ✈️ Join 50,000+ travelers worldwide
        </p>
      </motion.div>
    </div>
  );
}
