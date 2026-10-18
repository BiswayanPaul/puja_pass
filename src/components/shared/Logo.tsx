import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ tone = "light", href = "/", className }: { tone?: "light" | "dark"; href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="PujaPass home" className={cn("flex shrink-0 items-center gap-2", className)}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
        <Sparkles className="size-5" />
      </span>
      <span className={cn("text-xl font-bold tracking-tight", tone === "light" ? "text-white" : "text-stone-950")}>
        Puja<span className={tone === "light" ? "text-orange-400" : "text-orange-600"}>Pass</span>
      </span>
    </Link>
  );
}
