import { WhySection } from "./_components/benefits";
import { FeatureOverview } from "./_components/feature-overview";
import { FeaturesSection } from "./_components/features";
import { FooterSection } from "./_components/footer";
import { HeroSection } from "./_components/hero";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeatureOverview />
      <WhySection />
      <FeaturesSection />
      <FooterSection />
    </>
  );
}
