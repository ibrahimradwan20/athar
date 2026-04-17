import MainLayout from "@/components/layout/main-layout";
import HeroSection from "@/components/home/hero-section";
import StatsSection from "@/components/home/stats-section";
import FeaturedCampaigns from "@/components/home/featured-campaigns";
import HowItWorks from "@/components/home/how-it-works";
import TrustSection from "@/components/home/trust-section";
import CtaSection from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <StatsSection />
      <FeaturedCampaigns />
      <HowItWorks />
      <TrustSection />
      <CtaSection />
    </MainLayout>
  );
}
