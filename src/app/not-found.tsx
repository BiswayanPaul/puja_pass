import Link from "next/link";
import Logo from "@/components/shared/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-stone-950 px-4 text-center text-white">
      <Logo />
      <p className="mt-12 text-sm font-bold tracking-[0.16em] text-orange-300">404 · PAGE NOT FOUND</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">This pandal seems to have moved.</h1>
      <p className="mt-4 max-w-md text-stone-300">The page you were looking for doesn&apos;t exist. Let&apos;s get you back on your Puja trail.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/pandals" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold hover:bg-orange-700">Explore pandals</Link>
        <Link href="/" className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold hover:bg-white hover:text-stone-950">Go home</Link>
      </div>
    </main>
  );
}
