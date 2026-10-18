import { Building2, UsersRound } from "lucide-react";
import RedirectionCard from "./Redirection_Card";

const experiences = [
  {
    title: "For Visitors",
    description: "Discover pandals, reserve entry slots, and keep every pass in one place.",
    cta: "Plan your Puja trail",
    href: "/trail",
    imageSrc: "/images/Visitors_Card_Image.png",
    imageAlt: "Visitors exploring a Durga Puja pandal in Kolkata",
    icon: UsersRound,
  },
  {
    title: "For Puja Clubs",
    description: "Manage your profile, entry slots, capacity, ticket tiers, and visitor flow.",
    cta: "Register your club",
    href: "/clubs/register",
    imageSrc: "/images/Bengali-Women-Performing-Dhunuchi-Dance-On-The-Occasion-Of-Durga-Puja-Hinduism.webp",
    imageAlt: "Dhunuchi dance at a Durga Puja celebration",
    icon: Building2,
  },
];

export default function ExperienceSection() {
  return (
    <section id="club-registration" className="bg-stone-50 py-18 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-[0.18em] text-orange-600">PUJAPASS FOR EVERYONE</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Choose your experience
          </h2>
          <p className="mt-4 text-base leading-7 text-stone-600">
            Whether you&apos;re here to explore or host, PujaPass makes Durga Puja more organised and enjoyable for everyone.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {experiences.map((experience) => (
            <RedirectionCard key={experience.title} {...experience} />
          ))}
        </div>
      </div>
    </section>
  );
}
