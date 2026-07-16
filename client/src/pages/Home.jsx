import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";
import DashboardPreview from "../components/DashboardPreview";
import AIAssistant from "../components/AIAssistant";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="bg-white overflow-x-hidden font-body text-navy antialiased">
      <Navbar />
      <Hero />
      <FeatureCard />
      <AIAssistant />
      <Testimonials />
      
      {/* CTA Banner Section matching Lovable UI */}
      <section className="py-20 px-6">
         <div className="max-w-7xl mx-auto rounded-[32px] bg-gradient-to-r from-[#0DB8D6] to-[#0A88AA] py-20 px-8 text-center flex flex-col items-center">
             <h2 className="font-heading text-4xl md:text-[54px] font-bold text-white mb-6">
                Your next adventure starts here.
             </h2>
             <p className="text-white/90 text-lg mb-10 max-w-xl">
                Join 50,000+ travelers already planning smarter with TravelMind AI.
             </p>
             <div className="flex gap-4">
                <a href="/login" className="px-8 py-4 bg-white text-navy font-bold rounded-full hover:bg-gray-50 transition-colors">
                   Plan My Trip
                </a>
                <a href="#features" className="px-8 py-4 bg-transparent border border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors">
                   Explore Features
                </a>
             </div>
         </div>
      </section>

      <Footer />
    </div>
  );
}
