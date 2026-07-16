import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Trips", href: "#dashboard" },
  { label: "AI Assistant", href: "#assistant" },
  { label: "Journal", href: "#testimonials" },
  { label: "Contact", href: "#footer" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-sky-primary flex items-center justify-center">
              <span className="text-white text-[15px]">🧭</span>
            </div>
            <span
              className={`font-heading text-[22px] font-bold tracking-tight transition-colors duration-300 ${
                scrolled ? "text-navy" : "text-white"
              }`}
            >
              TravelMind <span className="text-sunny">AI</span>
            </span>
          </a>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-8 translate-x-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`text-[15px] font-medium transition-colors duration-200 ${
                  scrolled
                    ? "text-navy hover:text-sky-primary"
                    : "text-white hover:text-white/80"
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <a
              href="/login"
              className={`text-[15px] font-semibold transition-colors duration-200 ${
                scrolled
                  ? "text-navy hover:text-sky-primary"
                  : "text-white hover:text-white/80"
              }`}
            >
              Login
            </a>
            <a
              href="/register"
              className="px-6 py-2.5 rounded-full text-[15px] font-semibold text-white bg-sky-primary hover:bg-sky-primary/90 transition-colors shadow-md shadow-sky-primary/20"
            >
              Sign Up
            </a>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg transition-colors ${
              scrolled ? "text-navy" : "text-white"
            }`}
          >
            <span className={`block h-0.5 w-6 rounded bg-current transition-all ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block h-0.5 w-6 rounded bg-current transition-all mt-1.5 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 rounded bg-current transition-all mt-1.5 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 w-full bg-white shadow-xl z-40 flex flex-col p-6 gap-4 lg:hidden border-t border-gray-100"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-[15px] font-medium text-navy hover:text-sky-primary"
              >
                {l.label}
              </a>
            ))}
            <hr className="my-2 border-gray-100" />
            <a href="/login" className="text-[15px] font-semibold text-navy">Login</a>
            <a href="/register" className="text-[15px] font-semibold text-sky-primary">Sign Up</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
