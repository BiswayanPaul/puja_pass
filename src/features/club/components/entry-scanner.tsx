"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Keyboard, ScanLine, UsersRound, XCircle } from "lucide-react";
import { Input } from "@/components/ui/field";
import { recentCheckIns, scannablePasses } from "@/data/club";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/types";
import { ClubPageHeader } from "./club-shell";

type ScanResult =
  | { kind: "admitted" | "duplicate"; pass: (typeof scannablePasses)[number] }
  | { kind: "invalid"; code: string };

const resultStyles = {
  admitted: { title: "Valid pass", icon: CheckCircle2, className: "border-emerald-300 bg-emerald-50 text-emerald-950", iconClass: "text-emerald-600" },
  duplicate: { title: "Already checked in", icon: AlertTriangle, className: "border-amber-300 bg-amber-50 text-amber-950", iconClass: "text-amber-600" },
  invalid: { title: "Invalid pass", icon: XCircle, className: "border-rose-300 bg-rose-50 text-rose-950", iconClass: "text-rose-600" },
};

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function EntryScanner() {
  const [cameraOn, setCameraOn] = useState(false);
  const [code, setCode] = useState("");
  const [usedCodes, setUsedCodes] = useState(() => scannablePasses.filter((pass) => pass.used).map((pass) => pass.code));
  const [result, setResult] = useState<ScanResult | null>(null);
  const [log, setLog] = useState<CheckIn[]>(recentCheckIns);

  const verify = (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    const pass = scannablePasses.find((item) => item.code === value);
    const next: ScanResult = !pass ? { kind: "invalid", code: value } : { kind: usedCodes.includes(pass.code) ? "duplicate" : "admitted", pass };
    setResult(next);
    setCode("");
    if (next.kind !== "admitted") {
      setLog((entries) => [
        {
          id: `scan-${Date.now()}`,
          passCode: value,
          holderName: next.kind === "duplicate" ? next.pass.holderName : "Unknown",
          tierName: next.kind === "duplicate" ? next.pass.tierName : "—",
          quantity: next.kind === "duplicate" ? next.pass.quantity : 0,
          time: nowTime(),
          result: next.kind,
        },
        ...entries,
      ]);
    }
  };

  const admit = () => {
    if (result?.kind !== "admitted") return;
    const { pass } = result;
    setUsedCodes((codes) => [...codes, pass.code]);
    setLog((entries) => [
      { id: `scan-${Date.now()}`, passCode: pass.code, holderName: pass.holderName, tierName: pass.tierName, quantity: pass.quantity, time: nowTime(), result: "admitted" },
      ...entries,
    ]);
    setResult(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verify(code);
  };

  const admittedPeople = log.filter((entry) => entry.result === "admitted").reduce((total, entry) => total + entry.quantity, 0);
  const rejected = log.filter((entry) => entry.result !== "admitted").length;
  const style = result ? resultStyles[result.kind] : null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader title="Entry scanner" description="Scan visitor QR passes at the PujaPass lane. Works on any phone or tablet." />

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Admitted this session", value: admittedPeople },
          { label: "Passes scanned", value: log.length },
          { label: "Rejected", value: rejected },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4">
            <dt className="text-xs text-stone-500 sm:text-sm">{label}</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold text-stone-950 sm:text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-stone-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="absolute inset-[18%] rounded-2xl">
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((corner) => (
                <span key={corner} className={cn("absolute size-10 border-orange-500", corner)} />
              ))}
              {cameraOn && <span className="absolute inset-x-3 h-0.5 animate-scan bg-orange-400 shadow-[0_0_16px_4px_rgba(251,146,60,0.6)]" />}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-linear-to-t from-black/80 to-transparent p-4">
              <p className="text-sm text-stone-200">{cameraOn ? "Point the camera at a PujaPass QR code" : "Camera is off"}</p>
              <button
                type="button"
                onClick={() => setCameraOn((value) => !value)}
                className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", cameraOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-orange-600 text-white hover:bg-orange-700")}
              >
                {cameraOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
                {cameraOn ? "Stop" : "Start camera"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Pass code</span>
              <Keyboard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter pass code, e.g. SRB-2930-8841" className="pl-9 font-mono uppercase" />
            </label>
            <button type="submit" className="rounded-lg bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800">Verify</button>
          </form>

          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Demo: simulate a scan</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...scannablePasses.map((pass) => pass.code), "XYZ-0000-0000"].map((sample) => (
                <button key={sample} type="button" onClick={() => verify(sample)} className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 font-mono text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-700">
                  <ScanLine className="size-3.5" aria-hidden="true" /> {sample}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div aria-live="polite">
            {result && style ? (
              <div className={cn("rounded-2xl border-2 p-6", style.className)}>
                <div className="flex items-center gap-3">
                  <style.icon className={cn("size-9", style.iconClass)} aria-hidden="true" />
                  <div>
                    <p className="font-serif text-2xl font-semibold">{style.title}</p>
                    <p className="font-mono text-sm opacity-70">{result.kind === "invalid" ? result.code : result.pass.code}</p>
                  </div>
                </div>
                {result.kind === "invalid" ? (
                  <p className="mt-4 text-sm">This code does not match any pass for your pandal. Ask the visitor to show the booking on the PujaPass app, or direct them to the free-entry gate.</p>
                ) : (
                  <>
                    <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                      <div><dt className="opacity-70">Visitor</dt><dd className="font-semibold">{result.pass.holderName}</dd></div>
                      <div><dt className="opacity-70">Pass type</dt><dd className="font-semibold">{result.pass.tierName}</dd></div>
                      <div><dt className="opacity-70">Slot</dt><dd className="font-semibold">{result.pass.slot}</dd></div>
                      <div><dt className="opacity-70">Admits</dt><dd className="flex items-center gap-1 font-semibold"><UsersRound className="size-4" aria-hidden="true" />{result.pass.quantity}</dd></div>
                    </dl>
                    {result.kind === "admitted" ? (
                      <div className="mt-6 flex gap-2">
                        <button type="button" onClick={admit} className="flex-1 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                          Admit {result.pass.quantity} {result.pass.quantity === 1 ? "visitor" : "visitors"}
                        </button>
                        <button type="button" onClick={() => setResult(null)} className="rounded-full px-4 py-3 text-sm font-semibold hover:bg-white/60">Dismiss</button>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm">This pass has already been used. Check the visitor&apos;s ID before allowing re-entry.</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 py-12 text-center">
                <ScanLine className="size-10 text-stone-300" aria-hidden="true" />
                <p className="mt-3 font-semibold text-stone-800">Waiting for a scan</p>
                <p className="mt-1 text-sm text-stone-500">Results will appear here.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Scan history</h2>
            <ul className="mt-3 max-h-80 divide-y divide-stone-100 overflow-y-auto">
              {log.map((entry) => {
                const entryStyle = resultStyles[entry.result];
                return (
                  <li key={entry.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <entryStyle.icon className={cn("size-4 shrink-0", entryStyle.iconClass)} aria-label={entryStyle.title} />
                    <span className="w-12 shrink-0 text-stone-500">{entry.time}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-stone-900">{entry.holderName}</span>
                    <span className="hidden font-mono text-xs text-stone-500 sm:block">{entry.passCode}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
