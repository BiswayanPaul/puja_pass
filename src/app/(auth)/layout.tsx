import Image from "next/image";
import Logo from "@/components/shared/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-stone-50 lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative isolate hidden overflow-hidden bg-stone-950 text-white lg:block">
        <Image
          src="/images/Golden Durga Puja Pandal at Night.png"
          alt="A golden Durga Puja pandal illuminated at night"
          fill
          preload
          sizes="50vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/40 to-black/30" />
        <div className="flex h-full flex-col justify-between p-10">
          <Logo />
          <div className="max-w-md">
            <p className="text-sm font-bold tracking-[0.16em] text-orange-300">YOUR PUJA, ONE PASS</p>
            <p className="mt-3 font-serif text-4xl font-semibold leading-tight">
              Every pandal, every slot, every QR pass — in one place.
            </p>
            <p className="mt-4 text-sm leading-6 text-stone-300">
              Authorised passes from verified Puja clubs. Free entry details are always shown.
            </p>
          </div>
        </div>
      </aside>
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo tone="dark" />
        </div>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </main>
  );
}
