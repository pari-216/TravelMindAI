import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Ananya Rao",
    role: "Solo Traveler",
    text: '"TravelMind planned my 3-week Europe trip in minutes. The AI even caught a rail strike and rerouted me perfectly."',
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "Marcus Lee",
    role: "Digital Nomad",
    text: '"The budget tracker alone saved me $600 in Bali. The packing assistant is scarily accurate for weather."',
    image: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Sofia Martinez",
    role: "Family Traveler",
    text: '"Finally an app that plans trips my kids actually enjoy. The journal feature is a beautiful keepsake."',
    image: "https://randomuser.me/api/portraits/women/68.jpg"
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-bg-light">
      <div className="max-w-7xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
           className="text-center mb-16"
        >
           <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-sunny/20 text-navy mb-4">
              Testimonials
           </span>
           <h2 className="font-heading text-4xl md:text-[54px] font-extrabold text-navy leading-[1.1] max-w-2xl mx-auto">
              Loved by travelers<br/>worldwide
           </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
             <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-[32px] p-10 flex flex-col justify-between shadow-[0_4px_24px_rgb(0,0,0,0.02)] min-h-[300px]"
             >
                <div>
                   <div className="flex gap-1 text-sunny text-xl mb-6">
                      ★★★★★
                   </div>
                   <p className="text-navy text-[17px] leading-relaxed mb-8">
                      {t.text}
                   </p>
                </div>
                <div className="flex items-center gap-4">
                   <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-100" />
                   <div>
                      <h4 className="font-heading font-semibold text-navy leading-none mb-1">{t.name}</h4>
                      <p className="text-slate-400 text-sm leading-none">{t.role}</p>
                   </div>
                </div>
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
