"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BadgeCheck, ExternalLink, LayoutDashboard, LogOut, Menu, ScanLine, Store, Ticket } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { demoClubAdmin } from "@/data/users";
import { signOut, useSession } from "@/features/auth/use-session";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/club/dashboard", icon: LayoutDashboard },
  { label: "Pandal profile", href: "/club/pandals", icon: Store },
  { label: "Tickets & slots", href: "/club/tickets", icon: Ticket },
  { label: "Entry scanner", href: "/club/scanner", icon: ScanLine },
];

function NavLinks({ onNavigate }: { onNavigate?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Club navigation" className="flex flex-col gap-1">
      {nav.map(({ label, href, icon: Icon }) => {
        const linkProps = {
          href,
          "aria-current": pathname.startsWith(href) ? ("page" as const) : undefined,
          className: "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 transition-colors hover:bg-white/5 hover:text-white aria-[current=page]:bg-orange-600 aria-[current=page]:text-white",
        };
        const content = (
          <>
            <Icon className="size-4.5" aria-hidden="true" />
            {label}
          </>
        );
        return onNavigate ? (
          <SheetClose key={href} render={<Link {...linkProps} />}>{content}</SheetClose>
        ) : (
          <Link key={href} {...linkProps}>{content}</Link>
        );
      })}
    </nav>
  );
}

export function ClubShell({ pandal, children }: { pandal: { name: string; clubName: string; slug: string } | null; children: ReactNode }) {
  const router = useRouter();
  const user = useSession();
  // The mock club area is browsable without signing in; it falls back to the demo admin.
  const admin = user?.role === "club_admin" ? user : demoClubAdmin;

  const handleSignOut = () => {
    signOut();
    router.push("/login?role=club");
  };

  const footer = (
    <div className="space-y-3 border-t border-white/10 pt-4">
      {pandal && (
        <Link href={`/pandals/${pandal.slug}`} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-orange-300">
          <ExternalLink className="size-3.5" aria-hidden="true" /> View public page
        </Link>
      )}
      <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-800">
          {admin.name.split(" ").map((part) => part[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{admin.name}</p>
          <p className="truncate text-xs text-stone-400">Club admin</p>
        </div>
        <button type="button" onClick={handleSignOut} aria-label="Sign out" className="rounded-md p-1.5 text-stone-400 hover:bg-white/10 hover:text-white">
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-stone-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 bg-stone-950 p-5 lg:flex">
        <Logo href="/club/dashboard" />
        <ClubBadge name={pandal?.clubName} />
        <NavLinks />
        <div className="mt-auto">{footer}</div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-stone-950 px-4 lg:hidden">
        <Logo href="/club/dashboard" />
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open club menu" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-6 border-white/10 bg-stone-950 p-5 text-white">
            <SheetTitle className="text-white">Club menu</SheetTitle>
            <ClubBadge name={pandal?.clubName} />
            <NavLinks onNavigate />
            <div className="mt-auto">{footer}</div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}

function ClubBadge({ name }: { name?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] font-bold tracking-[0.14em] text-orange-300">MANAGING</p>
      <p className="mt-1 font-serif text-lg font-semibold leading-tight text-white">{name ?? "Your club"}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-400">
        <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified club
      </p>
    </div>
  );
}

/** Page heading used inside the club area. */
export function ClubPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between")}>
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">{title}</h1>
        <p className="mt-1.5 text-sm text-stone-600">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
