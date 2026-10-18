import { CalendarDays, QrCode, Search } from "lucide-react";

const steps = [
  { title: "Discover", description: "Explore verified pandals across Kolkata", icon: Search },
  { title: "Select slots", description: "Choose your preferred date and time", icon: CalendarDays },
  { title: "Get QR passes", description: "Receive secure tickets for every visit", icon: QrCode },
];

export default function PujaTrail() {
  return (
    <section id="trail" className="bg-orange-50 py-18 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1.9fr] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-orange-600">ONE CHECKOUT, MANY MEMORIES</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Build your Puja trail
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-stone-600">
            Select participating pandals, choose available entry slots, and receive all your QR passes in a single booking.
          </p>
        </div>
        <ol className="grid gap-7 sm:grid-cols-3">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="relative text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/20">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-5 text-sm font-bold text-orange-700">{index + 1}. {title}</p>
              <p className="mx-auto mt-2 max-w-40 text-sm leading-5 text-stone-600">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
