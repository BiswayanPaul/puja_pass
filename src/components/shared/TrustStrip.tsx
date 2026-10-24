import { Clock3, Route, ShieldCheck } from "lucide-react";

const assurances = [
  {
    title: "Verified pandals",
    description: "Official and authentic information",
    icon: ShieldCheck,
  },
  {
    title: "Timed entry passes",
    description: "Plan your visit, avoid long queues",
    icon: Clock3,
  },
  {
    title: "Your own Puja trail",
    description: "Create a personalised multi-pandal plan",
    icon: Route,
  },
];

export default function TrustStrip() {
  return (
    <section aria-label="PujaPass benefits" className="bg-orange-50">
      <div className="mx-auto grid max-w-7xl divide-y divide-orange-100 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
        {assurances.map(({ title, description, icon: Icon }) => (
          <div key={title} className="flex items-center gap-4 py-5 md:px-5 md:py-6 lg:px-6">
            <Icon className="size-8 shrink-0 text-orange-600" aria-hidden="true" />
            <div>
              <h2 className="font-serif text-lg font-semibold text-stone-950 lg:text-xl">{title}</h2>
              <p className="mt-0.5 text-sm text-stone-600">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
