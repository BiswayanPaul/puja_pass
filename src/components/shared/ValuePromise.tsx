import { QrCode, ShieldCheck, TicketCheck } from "lucide-react";

const promises = [
  { title: "Clear entry details", description: "See ticketed and free-entry information upfront.", icon: TicketCheck },
  { title: "Authorised passes", description: "Only from participating, verified Puja clubs.", icon: ShieldCheck },
  { title: "Easy QR check-in", description: "Quick and secure entry at the pandal.", icon: QrCode },
];

export default function ValuePromise() {
  return (
    <section className="bg-stone-950 py-18 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-bold tracking-[0.18em] text-orange-400">THE PUJAPASS PROMISE</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Made for the spirit of Puja</h2>
        <p className="mt-3 text-stone-300">A more meaningful and manageable Puja experience for everyone.</p>
        <div className="mt-10 grid gap-8 md:grid-cols-3 md:divide-x md:divide-stone-700">
          {promises.map(({ title, description, icon: Icon }) => (
            <div key={title} className="flex gap-4 md:px-8 first:pl-0 last:pr-0">
              <Icon className="size-8 shrink-0 text-orange-500" aria-hidden="true" />
              <div>
                <h3 className="font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-300">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
