import HeroSection from "./HeroSection";
import ExperienceSection from "./ExperienceSection";
import FaqSection from "./FaqSection";
import FeaturedPandals from "./FeaturedPandals";
import PujaTrail from "./PujaTrail";
import TrustStrip from "./TrustStrip";
import ValuePromise from "./ValuePromise";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <ExperienceSection />
      <FeaturedPandals />
      <PujaTrail />
      <ValuePromise />
      <FaqSection />
    </>
  );
}
