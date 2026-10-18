import type { ReactNode } from "react";

/** Dark title band used at the top of visitor pages (sits under the overlay navbar). */
export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-stone-950 pt-16 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_20%,rgba(234,88,12,0.35),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(251,146,60,0.15),transparent_40%)]" />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8 lg:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.16em] text-orange-300">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          {description && <p className="mt-4 text-base leading-7 text-stone-300">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
