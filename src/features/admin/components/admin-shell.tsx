"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ExternalLink, FileCheck2, LayoutDashboard, Menu, ShieldCheck, Store, Users } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Applications", href: "/admin/applications", icon: FileCheck2 },
  { label: "Clubs", href: "/admin/clubs", icon: Users },
  { label: "Pandals", href: "/admin/pandals", icon: Store },
];

// The active link depends on the URL, which isn't known while prerendering
// dynamic routes such as /admin/applications/[id]. Render the plain links as
// the fallback so the shell stays static.
function NavLinks({ onNavigate }: { onNavigate?: boolean }) {
  return (
    <Suspense fallback={<NavList pathname={null} onNavigate={onNavigate} />}>
      <ActiveNavLinks onNavigate={onNavigate} />
    </Suspense>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate?: boolean }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavList({ pathname, onNavigate }: { pathname: string | null; onNavigate?: boolean }) {
  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {nav.map(({ label, href, icon: Icon, exact }) => {
        const active = pathname !== null && (exact ? pathname === href : pathname.startsWith(href));
        const linkProps = {
          href,
          "aria-current": active ? ("page" as const) : undefined,
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

function AdminBadge() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-orange-300">
        <ShieldCheck className="size-3.5" aria-hidden="true" /> PLATFORM ADMIN
      </p>
      <p className="mt-1.5 text-xs leading-5 text-stone-400">Development preview. Sign-in arrives with auth.</p>
    </div>
  );
}

const footer = (
  <Link href="/" className="flex items-center gap-2 border-t border-white/10 px-3 pt-4 pb-1.5 text-xs font-medium text-stone-400 hover:text-orange-300">
    <ExternalLink className="size-3.5" aria-hidden="true" /> View public site
  </Link>
);

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-stone-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 bg-stone-950 p-5 lg:flex">
        <Logo href="/admin" />
        <AdminBadge />
        <NavLinks />
        <div className="mt-auto">{footer}</div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-stone-950 px-4 lg:hidden">
        <Logo href="/admin" />
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open admin menu" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-6 border-white/10 bg-stone-950 p-5 text-white">
            <SheetTitle className="text-white">Admin menu</SheetTitle>
            <AdminBadge />
            <NavLinks onNavigate />
            <div className="mt-auto">{footer}</div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
