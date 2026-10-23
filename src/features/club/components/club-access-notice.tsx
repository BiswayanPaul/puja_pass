import Link from "next/link";
import { ScanLine, Store, Users } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

/** Shown instead of a club page when the signed-in user can't use it. */
export function ClubAccessNotice({ reason }: { reason: "no-club" | "role" | "no-pandal" }) {
  const content = {
    "no-club": {
      icon: Users,
      title: "You're not part of a Puja club yet",
      description: "Register your club for review. Once it's approved, you'll manage it from here.",
      action: { href: "/clubs/register", label: "Register your club" },
    },
    role: {
      icon: ScanLine,
      title: "This page is for club owners and admins",
      description: "Your role in the club is gate scanning. Ask the club owner if you need more access.",
      action: { href: "/club/scanner", label: "Open the entry scanner" },
    },
    "no-pandal": {
      icon: Store,
      title: "Your club doesn't have a pandal yet",
      description: "A draft pandal is created when PujaPass approves your club. Contact us if it's missing.",
      action: { href: "/", label: "Back to PujaPass" },
    },
  }[reason];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <EmptyState
        icon={content.icon}
        title={content.title}
        description={content.description}
        action={<Link href={content.action.href} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">{content.action.label}</Link>}
      />
    </div>
  );
}

export function ClubPageSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8" aria-hidden="true">
      <div className="h-12 w-72 animate-pulse rounded-lg bg-stone-200" />
      <div className="h-40 animate-pulse rounded-2xl bg-stone-200/70" />
      <div className="h-72 animate-pulse rounded-2xl bg-stone-200/70" />
    </div>
  );
}
