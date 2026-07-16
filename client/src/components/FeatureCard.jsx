import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "✨",
    title: "AI Trip Planner",
    desc: "Generate personalized day-by-day itineraries tuned to your style, pace, and budget.",
    color: "bg-sky-primary"
  },
  {
    icon: "💰",
    title: "Budget Manager",
    desc: "Set intelligent budgets and let AI keep every category on track — no spreadsheets.",
    color: "bg-sunny"
  },
  {
    icon: "📊",
    title: "Expense Tracker",
    desc: "Snap receipts, split with friends, and see real-time spending analytics on the go.",
    color: "bg-coral"
  },
  {
    icon: "🏨",
    title: "Hotel Suggestions",
    desc: "Get curated stays matched to your vibe, from boutique to beachfront, at the best rates.",
    color: "bg-turquoise"
  },
  {
    icon: "🎒",
    title: "AI Packing Assistant",
    desc: "Smart packing lists based on weather, activities, and trip length — never forget again.",
    color: "bg-indigo-400"
  },
  {
    icon: "📓",
    title: "AI Travel Journal",
    desc: "Turn photos and notes into beautiful, AI-narrated travel stories you'll cherish forever.",
    color: "bg-emerald-400"
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-bg-light">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-sky-primary/10 text-sky-primary mb-4">
            Features
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-extrabold text-navy mb-4">
            Everything you need, <br/>
            <span className="text-sky-primary">powered by AI</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Six intelligent tools that turn trip chaos into effortless adventure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div 
               key={f.title}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1, duration: 0.5 }}
               className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.03)] hover:-translate-y-1 transition-transform duration-300"
            >
               <div className={`w-14 h-14 rounded-full ${f.color} flex items-center justify-center text-2xl mb-6 shadow-sm`}>
                  <span className={f.title === "AI Trip Planner" ? "text-white" : ""}>{f.icon}</span>
               </div>
               <h3 className="font-heading text-[22px] font-bold text-navy mb-3">
                  {f.title}
               </h3>
               <p className="text-slate-400 text-[15px] leading-relaxed">
                  {f.desc}
               </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
