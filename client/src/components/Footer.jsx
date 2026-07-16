export default function Footer() {
  return (
    <footer id="footer" className="bg-[#0D2040] pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20 text-white">
          {/* Logo & Tangline */}
          <div className="space-y-6">
             <a href="#home" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-primary flex items-center justify-center">
                  <span className="text-white text-[15px]">🧭</span>
                </div>
                <span className="font-heading text-[22px] font-bold tracking-tight text-white">
                  TravelMind <span className="text-sunny">AI</span>
                </span>
             </a>
             <p className="text-slate-600 text-[15px] leading-relaxed max-w-xs">
                Plan smarter, travel further. Your AI-powered companion for unforgettable journeys.
             </p>
             {/* Socials */}
             <div className="flex gap-3 pt-2">
                {['Instagram', 'Twitter', 'Facebook', 'Youtube'].map((s, i) => (
                   <a key={s} href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                      <span className="sr-only">{s}</span>
                      {/* Placeholder icons */}
                      <div className="w-4 h-4 bg-white/40 mask-image rounded-sm" />
                   </a>
                ))}
             </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
             <h4 className="font-heading font-bold text-lg">Quick Links</h4>
             <ul className="space-y-3">
                {["Features", "Trips", "AI Assistant", "Journal", "Pricing"].map(link => (
                   <li key={link}>
                      <a href={`#${link.toLowerCase().replace(' ', '')}`} className="text-slate-600 hover:text-white transition-colors text-[15px]">
                         {link}
                      </a>
                   </li>
                ))}
             </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
             <h4 className="font-heading font-bold text-lg">Contact</h4>
             <ul className="space-y-4">
                 <li>
                    <a href="mailto:hello@travelmind.ai" className="text-slate-600 hover:text-white transition-colors text-[15px] flex items-center gap-3">
                       <span className="text-slate-500">✉</span> hello@travelmind.ai
                    </a>
                 </li>
                 <li>
                    <a href="tel:+15550102026" className="text-slate-600 hover:text-white transition-colors text-[15px] flex items-center gap-3">
                       <span className="text-slate-500">📞</span> +1 (555) 010-2026
                    </a>
                 </li>
                 <li className="text-slate-600 text-[15px] flex items-center gap-3">
                    <span className="text-slate-500">📍</span> San Francisco · Mumbai
                 </li>
             </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
             <h4 className="font-heading font-bold text-lg">Newsletter</h4>
             <p className="text-slate-600 text-[15px]">
                Weekly travel inspiration & AI tips.
             </p>
             <form className="relative flex w-full" onSubmit={e => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Your email"
                  className="w-full bg-white/10 border-0 rounded-full py-4 pl-6 pr-24 text-white text-[15px] focus:outline-none focus:ring-1 focus:ring-white/30 placeholder:text-slate-500"
                />
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-sunny hover:bg-sunny/90 text-navy font-bold px-6 rounded-full transition-colors"
                >
                   Join
                </button>
             </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
           <p className="text-slate-500 text-sm">
             © {new Date().getFullYear()} TravelMind AI. All rights reserved.
           </p>
           
           <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service'].map(s => (
                 <a key={s} href="#" className="text-slate-500 hover:text-white transition-colors text-sm">
                    {s}
                 </a>
              ))}
           </div>
        </div>
      </div>
    </footer>
  )
}
