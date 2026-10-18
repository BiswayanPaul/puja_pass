"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { LayoutDashboard, LogOut, Menu, Route, Sparkles, Ticket, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/shared/Logo";
import { signOut, useSession } from "@/features/auth/use-session";
import { useTrail } from "@/features/trail/use-trail";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Home", href: "/" },
  { label: "Explore Pandals", href: "/pandals" },
  { label: "My Trail", href: "/trail" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function UserMenu() {
  const router = useRouter();
  const user = useSession();
  if (!user) return null;
  const items = user.role === "club_admin"
    ? [{ label: "Club dashboard", href: "/club/dashboard", icon: LayoutDashboard }]
    : [
        { label: "My bookings", href: "/my-bookings", icon: Ticket },
        { label: "My Puja trail", href: "/trail", icon: Route },
      ];

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        aria-label="Account menu"
        className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-800 ring-2 ring-white/40 transition hover:ring-orange-300"
      >
        {initials(user.name)}
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={8} align="end" className="z-50">
          <MenuPrimitive.Popup className="w-60 rounded-xl border border-stone-200 bg-white p-1.5 text-sm text-stone-700 shadow-xl outline-none transition data-ending-style:opacity-0 data-starting-style:opacity-0">
            <div className="px-3 py-2">
              <p className="font-semibold text-stone-950">{user.name}</p>
              <p className="truncate text-xs text-stone-500">{user.email}</p>
            </div>
            <MenuPrimitive.Separator className="my-1 h-px bg-stone-100" />
            {items.map(({ label, href, icon: Icon }) => (
              <MenuPrimitive.LinkItem
                key={href}
                render={<Link href={href} />}
                className="flex items-center gap-2 rounded-lg px-3 py-2 outline-none data-highlighted:bg-orange-50 data-highlighted:text-orange-700"
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </MenuPrimitive.LinkItem>
            ))}
            <MenuPrimitive.Separator className="my-1 h-px bg-stone-100" />
            <MenuPrimitive.Item
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none data-highlighted:bg-rose-50 data-highlighted:text-rose-700"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

function TrailButton() {
  const { passCount } = useTrail();
  return (
    <Link
      href="/trail"
      aria-label={`My Puja trail, ${passCount} passes`}
      className="relative flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
    >
      <Route className="size-5" aria-hidden="true" />
      {passCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white">
          {passCount}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const user = useSession();

  return (
    <header className="absolute inset-x-0 top-0 z-50 bg-linear-to-b from-black/65 to-transparent">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className="border-b-2 border-transparent py-1 text-base font-medium text-white/90 transition-colors hover:text-orange-300 aria-[current=page]:border-orange-500 aria-[current=page]:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <TrailButton />
          {user ? (
            <UserMenu />
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-full border border-white/60 px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-stone-950"
              >
                Login
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants(),
                  "h-9 rounded-full bg-orange-600 px-5 text-white shadow-sm hover:bg-orange-700",
                )}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile navigation */}
        <div className="flex items-center gap-2 lg:hidden">
          <TrailButton />
          {user && <UserMenu />}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="border-white/50 bg-black/10 text-white hover:bg-white/15 hover:text-white"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent side="right" className="flex w-75 flex-col p-5 sm:w-90">
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="size-5 text-orange-600" />
                PujaPass
              </SheetTitle>

              <nav
                aria-label="Mobile navigation"
                className="mt-6 flex flex-col gap-1"
              >
                {[...links, ...(user?.role === "visitor" ? [{ label: "My Bookings", href: "/my-bookings" }] : []), ...(user?.role === "club_admin" ? [{ label: "Club Dashboard", href: "/club/dashboard" }] : [])].map((link) => (
                  <SheetClose
                    key={link.label}
                    render={
                      <Link
                        href={link.href}
                        className="rounded-lg px-3 py-3 text-base font-medium text-stone-700 transition-colors hover:bg-orange-50 hover:text-orange-700"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto space-y-3 pb-4">
                {user ? (
                  <SheetClose
                    render={
                      <button
                        type="button"
                        onClick={() => signOut()}
                        className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full rounded-full")}
                      />
                    }
                  >
                    <LogOut className="size-4" /> Sign out
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose
                      render={
                        <Link
                          href="/register"
                          className={cn(
                            buttonVariants(),
                            "h-10 w-full rounded-full bg-orange-600 text-white hover:bg-orange-700",
                          )}
                        />
                      }
                    >
                      Create an account
                    </SheetClose>
                    <SheetClose
                      render={
                        <Link
                          href="/login"
                          className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full rounded-full")}
                        />
                      }
                    >
                      <UserRound className="size-4" /> Login
                    </SheetClose>
                  </>
                )}

                <p className="text-center text-xs text-stone-500">
                  Celebrate the spirit of Puja.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
