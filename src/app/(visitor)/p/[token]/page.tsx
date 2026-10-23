import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, CheckCircle2, Clock3, ShieldAlert, Ticket, UsersRound, XCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { formatPujaDate, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { verifyPassToken } from "@/server/booking-links";
import { getPassCheck } from "@/server/bookings";
import type { PassCheck } from "@/types";

// Opens when anyone scans a pass QR code with a phone camera. It confirms the
// pass is genuine and shows its state; it never shows the booker's details.
// Gate check-in happens in the club scanner, which reads the same link.

export const metadata: Metadata = {
  title: "Pass check",
  robots: { index: false },
  referrer: "no-referrer",
};

const istTime = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

export default function PassCheckPage({ params }: PageProps<"/p/[token]">) {
  return (
    <>
      <PageHeader eyebrow="PUJAPASS ENTRY PASS" title="Pass check" description="Confirms that a PujaPass QR code is genuine." />
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-stone-200/60" />}>
          <PassResult params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function PassResult({ params }: { params: PageProps<"/p/[token]">["params"] }) {
  const { token } = await params;
  const code = verifyPassToken(token);
  const pass = code ? await getPassCheck(code) : null;

  if (!pass) {
    return (
      <StatusCard tone="danger" icon={ShieldAlert} title="Not a valid PujaPass" detail="This QR code wasn't issued by PujaPass, or it has been altered. Don't accept it for entry.">
        <p className="mt-4 text-sm text-stone-600">Free public entry is always available through the general gates of every pandal.</p>
      </StatusCard>
    );
  }

  return <PassCard pass={pass} />;
}

function PassCard({ pass }: { pass: PassCheck }) {
  const status = {
    valid: { tone: "success", icon: CheckCircle2, title: "Valid pass", detail: "Show this QR code at the PujaPass entry lane. One scan admits everyone on the pass." },
    used: {
      tone: "warning",
      icon: Clock3,
      title: "Already used",
      detail: pass.checkedInAt ? `Checked in at ${istTime.format(new Date(pass.checkedInAt))}. It can't be used again.` : "This pass has already been checked in.",
    },
    cancelled: { tone: "danger", icon: XCircle, title: "Cancelled", detail: "This booking was cancelled. The pass is no longer valid." },
  } as const;
  const { tone, icon, title, detail } = status[pass.status];

  return (
    <StatusCard tone={tone} icon={icon} title={title} detail={detail}>
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-xs font-bold tracking-[0.14em] text-orange-600">{pass.tierName.toUpperCase()}</p>
        <h3 className="mt-1 font-serif text-2xl font-semibold text-stone-950">{pass.pandal.name}</h3>
        <p className="text-sm text-stone-500">{pass.pandal.neighbourhood}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Detail icon={CalendarDays} label="Date" value={formatPujaDate(pass.date)} />
          <Detail icon={Clock3} label="Entry window" value={formatTimeRange(pass.startTime, pass.endTime)} />
          <Detail icon={UsersRound} label="Admits" value={`${pass.quantity} ${pass.quantity === 1 ? "person" : "people"}`} />
          <Detail icon={Ticket} label="Pass code" value={pass.code} mono />
        </dl>
      </div>
      <Link href={`/pandals/${pass.pandal.slug}`} className="mt-5 inline-flex text-sm font-semibold text-orange-700 hover:text-orange-800">
        About this pandal →
      </Link>
    </StatusCard>
  );
}

const tones = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

function StatusCard({
  tone,
  icon: Icon,
  title,
  detail,
  children,
}: {
  tone: keyof typeof tones;
  icon: typeof CheckCircle2;
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border p-6", tones[tone])} role="status">
      <Icon className="size-10" aria-hidden="true" />
      <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-950">{title}</h2>
      <p className="mt-1 text-sm text-stone-700">{detail}</p>
      {children}
    </section>
  );
}

function Detail({ icon: Icon, label, value, mono }: { icon: typeof CheckCircle2; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-stone-500"><Icon className="size-3.5" aria-hidden="true" />{label}</dt>
      <dd className={cn("mt-0.5 font-semibold text-stone-900", mono && "font-mono tracking-wide")}>{value}</dd>
    </div>
  );
}
