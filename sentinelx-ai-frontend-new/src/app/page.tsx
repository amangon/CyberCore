import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import SecurityStats from "@/components/landing/SecurityStats";
import DashboardPreview from "@/components/landing/DashboardPreview";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <SecurityStats />
        <DashboardPreview />
        <IntegrationsSection />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
