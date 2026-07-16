import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const DESTINATIONS = [
  { name: "EIFFEL TOWER",          url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80" },
  { name: "TAJ MAHAL",             url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80" },
  { name: "SANTORINI",             url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80" },
  { name: "BURJ KHALIFA",          url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80" },
  { name: "MALDIVES",              url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=80" },
  { name: "MOUNT FUJI",            url: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1600&q=80" },
  { name: "SYDNEY OPERA HOUSE",    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80" },
  { name: "STATUE OF LIBERTY",     url: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1600&q=80" },
  { name: "GOLDEN GATE BRIDGE",    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=80" },
  { name: "COLOSSEUM",             url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=80" },
];

// Preload images for flicker-free transitions
function preloadImages(urls) {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  // Preload all images on mount
  useEffect(() => {
    preloadImages(DESTINATIONS.map(d => d.url));
  }, []);

  // Auto-advance every 2 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(prev => {
          const nc = (prev + 1) % DESTINATIONS.length;
          setNext((nc + 1) % DESTINATIONS.length);
          return nc;
        });
        setTransitioning(false);
      }, 1100); // Match the CSS transition duration
    }, 2000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <section id="home" className="relative w-full h-[85vh] min-h-[600px] overflow-hidden flex items-center">
      
      {/* ===== Background Slideshow with Ken Burns ===== */}
      <div className="absolute inset-0 z-0">
        {DESTINATIONS.map((dest, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${dest.url})`,
              opacity: current === i ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
              animation: current === i ? "ken-burns 15s ease-in-out infinite alternate" : "none",
              willChange: "opacity, transform",
            }}
          />
        ))}
      </div>

      {/* ===== Semi-transparent gradient overlay ===== */}
      <div
        className="absolute inset-0 z-1"
        style={{
          background: "linear-gradient(135deg, rgba(30,58,138,0.88) 0%, rgba(56,189,248,0.55) 60%, rgba(6,182,212,0.35) 100%)"
        }}
      />

      {/* ===== Floating animated clouds ===== */}
      <motion.div
        animate={{ x: [0, 25, 0], opacity: [0.12, 0.18, 0.12] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-16 left-1/4 z-5 pointer-events-none"
      >
        <svg width="120" height="60" viewBox="0 0 120 60" fill="white" opacity="0.15">
          <ellipse cx="60" cy="40" rx="55" ry="20" />
          <ellipse cx="40" cy="30" rx="35" ry="22" />
          <ellipse cx="80" cy="28" rx="30" ry="20" />
        </svg>
      </motion.div>
      <motion.div
        animate={{ x: [0, -20, 0], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-32 right-1/3 z-5 pointer-events-none"
      >
        <svg width="90" height="45" viewBox="0 0 90 45" fill="white" opacity="0.12">
          <ellipse cx="45" cy="30" rx="40" ry="15" />
          <ellipse cx="28" cy="22" rx="26" ry="18" />
          <ellipse cx="62" cy="20" rx="22" ry="16" />
        </svg>
      </motion.div>

      {/* ===== Floating airplane ===== */}
      <motion.div
        animate={{
          x: ["-10%", "110%"],
          y: [0, -30, 10, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        className="absolute top-[20%] z-10 pointer-events-none"
        style={{ opacity: 0.75 }}
      >
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6 0 .2 0 .5.1.7L8 11.7l-4.5 4.5-2.8-.9c-.2 0-.5.1-.6.3-.1.3 0 .7.3.9l4.5 2 2 4.5c.2.3.6.4.9.3.2-.1.3-.4.3-.6l-.9-2.8 4.5-4.5 4.2 4.2c.2.1.5.1.7.1.4-.2.7-.6.6-1.1z"/>
        </svg>
      </motion.div>

      {/* ===== Dotted flight path ===== */}
      <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 1600 600" preserveAspectRatio="none" opacity="0.10">
          <path
            d="M0 400 Q400 100 800 300 Q1200 500 1600 200"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="12 8"
            fill="none"
          />
          <path
            d="M0 200 Q300 350 700 150 Q1100 -50 1600 400"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="8 12"
            fill="none"
          />
        </svg>
      </div>

      {/* ===== Floating location pins ===== */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-16 top-20 z-10 pointer-events-none hidden md:block"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(255,209,102,0.85)", border: "2px solid rgba(255,255,255,0.6)" }}
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute left-1/3 bottom-24 z-10 pointer-events-none hidden md:block"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(56,189,248,0.85)", border: "2px solid rgba(255,255,255,0.6)" }}
        >
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </motion.div>

      {/* ===== Rotating globe ===== */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-12 right-24 z-10 pointer-events-none hidden lg:block opacity-20"
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="white" strokeWidth="1.5">
          <circle cx="40" cy="40" r="36" />
          <ellipse cx="40" cy="40" rx="18" ry="36" />
          <line x1="4" y1="40" x2="76" y2="40" />
          <ellipse cx="40" cy="40" rx="36" ry="14" />
        </svg>
      </motion.div>

      {/* ===== Main content ===== */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between">
        <div className="w-full md:w-3/5 text-left pt-20 md:pt-0">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.25)"
            }}
          >
            <span className="text-sm">✨</span>
            <span className="text-white text-sm font-medium">AI-powered travel, reimagined</span>
          </motion.div>

          {/* Title with floating plane */}
          <div className="relative">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 left-12"
            >
              <svg className="w-10 h-10 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6 0 .2 0 .5.1.7L8 11.7l-4.5 4.5-2.8-.9c-.2 0-.5.1-.6.3-.1.3 0 .7.3.9l4.5 2 2 4.5c.2.3.6.4.9.3.2-.1.3-.4.3-.6l-.9-2.8 4.5-4.5 4.2 4.2c.2.1.5.1.7.1.4-.2.7-.6.6-1.1z"/>
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-heading text-[60px] md:text-[85px] font-extrabold text-white leading-[1.1] mb-6"
            >
              Travel Smarter<br/>
              with <span style={{ color: "#FFD166" }}>AI</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90 max-w-xl leading-relaxed mb-10"
          >
            Plan personalized itineraries, manage budgets, discover destinations,
            organize packing lists, and create unforgettable travel memories — all
            powered by AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="/dashboard"
              className="px-8 py-4 rounded-full text-white font-semibold text-lg hover:shadow-xl hover:opacity-95 transition-all outline-none text-center"
              style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 20px rgba(255,209,102,0.40)" }}
            >
              Plan My Trip <span className="inline-block ml-1">→</span>
            </a>
            <a
              href="#features"
              className="px-8 py-4 rounded-full text-white font-semibold text-lg transition-all border outline-none block text-center"
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                borderColor: "rgba(255,255,255,0.30)"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              Explore Features
            </a>
          </motion.div>
          
          {/* Social proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 flex items-center gap-4"
          >
            <div className="flex -space-x-4">
              {[1,2,3,4].map(n => (
                <img key={n} src={`https://randomuser.me/api/portraits/thumb/women/${n+10}.jpg`} className="w-10 h-10 rounded-full border-2 border-white/40 overflow-hidden" alt="user" />
              ))}
            </div>
            <p className="text-white/80 text-sm font-medium">
              Loved by <strong className="text-white">50,000+</strong> travelers worldwide
            </p>
          </motion.div>
        </div>

        {/* Right side — Destination badge */}
        <div className="hidden md:block w-2/5 relative h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-10 right-0 px-6 py-4 rounded-2xl flex items-center gap-4"
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.25)"
              }}
            >
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#FFD166" }} />
              <div>
                <p className="text-xs text-white/70">Now exploring</p>
                <p className="text-white font-semibold">{DESTINATIONS[current].name}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Destination counter dots */}
          <div className="absolute bottom-4 right-0 flex gap-1.5">
            {DESTINATIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "20px" : "6px",
                  height: "6px",
                  background: i === current ? "#FFD166" : "rgba(255,255,255,0.40)"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
