import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowUpRight, Mail, Sparkles } from "lucide-react";

const exploreLinks = [
  { label: "Explore Pandals", href: "/pandals" },
  { label: "Plan Your Puja Trail", href: "/trail" },
  { label: "My Bookings", href: "/my-bookings" },
];

const companyLinks = [
  { label: "About PujaPass", href: "/#about" },
  { label: "Register Your Club", href: "/clubs/register" },
  { label: "Club Login", href: "/login?next=/club/dashboard" },
  { label: "Contact Us", href: "/#contact" },
];

/** Cached for a day, so the footer stays static and still rolls over each year. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export default async function Footer() {
  const copyrightYear = await currentYear();
  return (
    <footer id="contact" className="border-t border-stone-200 bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              aria-label="PujaPass home"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                <Sparkles className="size-5" />
              </span>

              <span className="text-xl font-bold text-white">
                Puja<span className="text-orange-400">Pass</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
              Discover beautiful pandals, explore neighbourhoods and make your
              Durga Puja journey memorable.
            </p>

            <a
              href="mailto:hello@pujapass.com"
              className="mt-4 inline-flex items-center gap-2 py-1.5 text-sm transition-colors hover:text-orange-400"
            >
              <Mail className="size-4" />
              Get in touch
              <ArrowUpRight className="size-3" />
            </a>
          </div>

          {/* Explore */}
          <div>
            <h2 className="font-semibold text-white">Discover</h2>

            <ul className="mt-3 space-y-1">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-block py-1.5 text-sm text-stone-400 transition-colors hover:text-orange-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h2 className="font-semibold text-white">PujaPass</h2>

            <ul className="mt-3 space-y-1">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-block py-1.5 text-sm text-stone-400 transition-colors hover:text-orange-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-stone-800 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {copyrightYear} PujaPass. All rights reserved.</p>

          <p>Made with care for the spirit of Puja.</p>
        </div>
      </div>
    </footer>
  );
}
