import { motion } from "framer-motion";

const SUGGESTIONS = [
  "Suggest hidden places in Kyoto.",
  "Plan a 5-day trip to Bali under ₹40,000.",
  "What should I pack for Iceland in winter?"
];

export default function AIAssistant() {
  return (
    <section id="assistant" className="py-24 px-6 bg-gradient-to-br from-white to-sky-50">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
         
         {/* Left Side */}
         <div className="w-full lg:w-1/2 space-y-6">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-coral/10 text-coral mb-2">
              AI Assistant
            </span>
            <h2 className="font-heading text-[42px] sm:text-[52px] font-extrabold text-navy leading-[1.1]">
               Your personal <span className="text-sky-primary whitespace-nowrap">travel co-pilot</span>
            </h2>
            <p className="text-slate-400 text-[17px] leading-relaxed max-w-md">
               Ask anything — from hidden gems to smart budgets. Get expert-level answers in seconds, tailored to you.
            </p>

            <div className="flex flex-col gap-4 mt-8">
               {SUGGESTIONS.map((text, i) => (
                  <motion.div
                     key={i}
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1, duration: 0.5 }}
                     className="bg-white rounded-[24px] border border-gray-100 p-5 flex items-center justify-between text-navy font-medium shadow-[0_4px_24px_rgb(0,0,0,0.02)] cursor-pointer hover:border-sky-primary/30 transition-colors"
                  >
                     {text}
                     <span className="text-sky-primary font-light">→</span>
                  </motion.div>
               ))}
            </div>
         </div>

         {/* Right Side: Chat Mockup */}
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full lg:w-1/2"
         >
            <div className="bg-[#E5F6F9] rounded-[32px] p-6 lg:p-10 border border-sky-primary/10 shadow-2xl shadow-sky-primary/5">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 rounded-full bg-sky-primary flex items-center justify-center text-white">
                      🤖
                   </div>
                   <div>
                      <h4 className="font-heading font-bold text-navy">TravelMind AI</h4>
                      <p className="text-xs text-sky-primary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-primary inline-block"></span> Online</p>
                   </div>
                </div>

                <div className="space-y-6">
                    {/* User Question */}
                    <div className="flex justify-end">
                       <div className="bg-sky-primary text-white px-6 py-4 rounded-[24px] rounded-tr-[4px] max-w-[85%] font-medium">
                          Plan a 5-day trip to Bali under ₹40,000.
                       </div>
                    </div>

                    {/* AI Answer */}
                    <div className="flex justify-start">
                       <div className="bg-white text-navy px-6 py-5 rounded-[24px] rounded-tl-[4px] max-w-[90%] shadow-sm leading-relaxed">
                          Absolutely! Here's a balanced 5-day plan with beaches, culture and food:<br/><br/>
                          <ul className="space-y-2">
                             <li>• Day 1 — Seminyak sunset · ₹6,200</li>
                             <li>• Day 2 — Ubud temples & rice terraces · ₹5,800</li>
                             <li>• Day 3 — Nusa Penida island hop · ₹9,400</li>
                          </ul>
                       </div>
                    </div>

                    {/* AI Suggestion Chip */}
                    <div className="flex justify-end pt-2">
                       <div className="bg-sky-primary text-white px-5 py-3 rounded-full text-sm font-medium">
                          Add a volcano trek on Day 4.
                       </div>
                    </div>

                    <div className="flex justify-start">
                       <div className="bg-transparent flex gap-1 px-2 py-4">
                           <div className="w-2 h-2 rounded-full bg-sky-primary animate-pulse" />
                           <div className="w-2 h-2 rounded-full bg-sky-primary animate-pulse delay-75" />
                           <div className="w-2 h-2 rounded-full bg-sky-primary animate-pulse delay-150" />
                       </div>
                    </div>
                </div>

                <div className="mt-4 relative">
                   <input type="text" placeholder="Ask TravelMind AI..." className="w-full bg-white/50 border border-white px-6 py-4 rounded-full text-navy placeholder:text-slate-500 focus:outline-none focus:bg-white" disabled />
                   <div className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-sky-primary flex items-center justify-center text-white">
                      ➤
                   </div>
                </div>
            </div>
         </motion.div>
      </div>
    </section>
  );
}
