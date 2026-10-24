"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Flashlight, FlashlightOff, Keyboard, Loader2, ScanLine, UsersRound, XCircle } from "lucide-react";
import { Input } from "@/components/ui/field";
import { useFestivalDays } from "@/features/festival/festival-context";
import { formatPujaDate, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/types";
import { admitPass, verifyScan, type PassTiming, type ScanResult } from "../scan-actions";
import { ClubPageHeader } from "./club-shell";

// The gate scanner. Reads QR codes with the phone's rear camera (the browser's
// BarcodeDetector where available, otherwise jsQR), asks the server whether
// the pass may enter, and admits it on a tap. Needs HTTPS (or localhost) for
// camera access.

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
type BarcodeDetectorClass = (new (options: { formats: string[] }) => BarcodeDetectorLike) & { getSupportedFormats(): Promise<string[]> };
type Decoder = (video: HTMLVideoElement) => Promise<string | null>;

/** Milliseconds between decode attempts. */
const SCAN_INTERVAL = 150;
/** The same QR code is ignored for this long after a result is dismissed, so it isn't read twice. */
const REPEAT_COOLDOWN = 5000;

async function createDecoder(canvas: HTMLCanvasElement): Promise<Decoder> {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
  if (Detector && (await Detector.getSupportedFormats()).includes("qr_code")) {
    const detector = new Detector({ formats: ["qr_code"] });
    return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
  }
  // Safari on iPhone has no BarcodeDetector: decode frames ourselves.
  const { default: jsQR } = await import("jsqr");
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  return async (video) => {
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    if (!width || !height) return null;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    return jsQR(context.getImageData(0, 0, width, height).data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

type CameraState = { status: "off" | "starting" | "on" } | { status: "error"; message: string };

/** Rear camera + QR decoding loop. Calls `onCode` once per code; call `resume()` to scan again. */
function useQrCamera(onCode: (value: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pausedRef = useRef(false);
  const lastCodeRef = useRef<{ value: string; at: number } | null>(null);
  const onCodeRef = useRef(onCode);
  const [camera, setCamera] = useState<CameraState>({ status: "off" });
  const [torch, setTorch] = useState<{ available: boolean; on: boolean }>({ available: false, on: false });

  useEffect(() => {
    onCodeRef.current = onCode;
  });

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setTorch({ available: false, on: false });
    setCamera({ status: "off" });
  };

  // Decode loop while the camera is on.
  useEffect(() => {
    if (camera.status !== "on") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let decode: Decoder | null = null;
    const tick = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      try {
        decode ??= await createDecoder(canvasRef.current!);
        if (!pausedRef.current && video && video.readyState >= 2) {
          const value = await decode(video);
          const last = lastCodeRef.current;
          if (value && !(last && last.value === value && Date.now() - last.at < REPEAT_COOLDOWN)) {
            pausedRef.current = true;
            lastCodeRef.current = { value, at: Date.now() };
            onCodeRef.current(value);
          }
        }
      } catch {
        // A frame that can't be decoded; try the next one.
      }
      timer = setTimeout(tick, SCAN_INTERVAL);
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [camera.status]);

  // Release the camera when leaving the page.
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera({ status: "error", message: "This browser can't use the camera here. Open the scanner over HTTPS in Chrome or Safari." });
      return;
    }
    setCamera({ status: "starting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const capabilities = stream.getVideoTracks()[0]?.getCapabilities?.() as { torch?: boolean } | undefined;
      setTorch({ available: Boolean(capabilities?.torch), on: false });
      pausedRef.current = false;
      setCamera({ status: "on" });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCamera({
        status: "error",
        message:
          name === "NotAllowedError"
            ? "Camera access was blocked. Allow it for this site in your browser settings, then try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "The camera couldn't start. Close other apps using it and try again.",
      });
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const on = !torch.on;
    await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => undefined);
    setTorch((current) => ({ ...current, on }));
  };

  const resume = () => {
    if (lastCodeRef.current) lastCodeRef.current.at = Date.now();
    pausedRef.current = false;
  };

  return { videoRef, canvasRef, camera, start, stop, resume, torch, toggleTorch };
}

const timingNotes: Record<Exclude<PassTiming, "on-time">, string> = {
  early: "This visitor is early for their entry window.",
  late: "This visitor's entry window has already ended.",
  "other-day": "This pass is for a different day.",
};

const logStyles = {
  admitted: { label: "Admitted", icon: CheckCircle2, className: "text-emerald-600" },
  duplicate: { label: "Already used", icon: AlertTriangle, className: "text-amber-600" },
  invalid: { label: "Invalid", icon: XCircle, className: "text-rose-600" },
};

type Shown = ScanResult | { kind: "admitted"; pass: Extract<ScanResult, { kind: "valid" }>["pass"] } | { kind: "error"; reason: string };

export function EntryScanner({ initialLog }: { initialLog: CheckIn[] }) {
  const days = useFestivalDays();
  const [result, setResult] = useState<Shown | null>(null);
  const [log, setLog] = useState(initialLog);
  const [session, setSession] = useState({ admitted: 0, scanned: 0, rejected: 0 });
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const record = (entry: CheckIn | null) => {
    if (entry) setLog((current) => [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 30));
  };

  const check = (raw: string) =>
    startTransition(async () => {
      try {
        const outcome = await verifyScan(raw);
        setResult(outcome);
        setSession((current) => ({ ...current, scanned: current.scanned + 1, rejected: current.rejected + (outcome.kind === "valid" ? 0 : 1) }));
        if (outcome.kind !== "valid") record(outcome.log);
        navigator.vibrate?.(outcome.kind === "valid" ? 80 : [60, 40, 60]);
      } catch {
        setResult({ kind: "error", reason: "Couldn't reach PujaPass. Check the phone's internet connection and scan again." });
      }
    });

  const { videoRef, canvasRef, camera, start, stop, resume, torch, toggleTorch } = useQrCamera(check);

  const next = () => {
    setResult(null);
    resume();
  };

  const admit = (override: boolean) => {
    if (result?.kind !== "valid") return;
    const passId = result.pass.id;
    startTransition(async () => {
      try {
        const outcome = await admitPass(passId, override);
        if (outcome.kind === "error") return setResult(outcome);
        record(outcome.log);
        if (outcome.kind === "admitted") {
          setSession((current) => ({ ...current, admitted: current.admitted + outcome.pass.quantity }));
          navigator.vibrate?.(150);
        }
        setResult(outcome);
      } catch {
        setResult({ kind: "error", reason: "Couldn't reach PujaPass. The visitor was not checked in; try again." });
      }
    });
  };

  const handleManual = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) return;
    check(code);
    setCode("");
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader title="Entry scanner" description="Scan visitors' QR passes at the PujaPass lane with this phone's camera." />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-900 sm:aspect-4/3">
            <video ref={videoRef} playsInline muted className={cn("absolute inset-0 size-full object-cover", camera.status !== "on" && "hidden")} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="pointer-events-none absolute inset-[15%] rounded-2xl">
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((corner) => (
                <span key={corner} className={cn("absolute size-10 border-orange-500", corner)} />
              ))}
              {camera.status === "on" && !result && <span className="absolute inset-x-3 h-0.5 animate-scan bg-orange-400 shadow-[0_0_16px_4px_rgba(251,146,60,0.6)]" />}
            </div>
            {camera.status !== "on" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-stone-200">
                {camera.status === "error" ? (
                  <>
                    <CameraOff className="size-9 text-rose-300" aria-hidden="true" />
                    <p className="max-w-xs text-sm">{camera.message}</p>
                  </>
                ) : (
                  <>
                    <ScanLine className="size-9 text-orange-300" aria-hidden="true" />
                    <p className="max-w-xs text-sm">Start the camera, then hold the visitor&apos;s QR code inside the frame.</p>
                  </>
                )}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-black/80 to-transparent p-3">
              {torch.available ? (
                <button type="button" onClick={toggleTorch} aria-pressed={torch.on} aria-label={torch.on ? "Turn torch off" : "Turn torch on"} className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  {torch.on ? <FlashlightOff className="size-5" /> : <Flashlight className="size-5" />}
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={camera.status === "on" ? stop : start}
                disabled={camera.status === "starting"}
                className={cn("inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-70", camera.status === "on" ? "bg-white/15 text-white hover:bg-white/25" : "bg-orange-600 text-white hover:bg-orange-700")}
              >
                {camera.status === "starting" ? <Loader2 className="size-4 animate-spin" /> : camera.status === "on" ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
                {camera.status === "on" ? "Stop camera" : camera.status === "error" ? "Try again" : "Start camera"}
              </button>
            </div>
          </div>

          <div aria-live="polite">
            {pending && !result ? (
              <p className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Checking pass…
              </p>
            ) : result ? (
              <ResultCard result={result} pending={pending} days={days} onAdmit={admit} onNext={next} />
            ) : null}
          </div>

          <form onSubmit={handleManual} className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Pass code</span>
              <Keyboard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Or type the code under the QR" autoCapitalize="characters" className="pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case" />
            </label>
            <button type="submit" disabled={pending} className="rounded-lg bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60">Check</button>
          </form>
        </section>

        <section className="space-y-4">
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: "Admitted", value: session.admitted },
              { label: "Scanned", value: session.scanned },
              { label: "Rejected", value: session.rejected },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4">
                <dt className="text-xs text-stone-500">{label} <span className="sr-only">this session</span></dt>
                <dd className="mt-1 font-serif text-2xl font-semibold text-stone-950">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="-mt-2 text-xs text-stone-500">Counts for this scanning session; the dashboard shows the day&apos;s totals.</p>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Recent scans</h2>
            {log.length ? (
              <ul className="mt-3 max-h-96 divide-y divide-stone-100 overflow-y-auto">
                {log.map((entry) => {
                  const style = logStyles[entry.result];
                  return (
                    <li key={entry.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <style.icon className={cn("size-4 shrink-0", style.className)} aria-label={style.label} />
                      <span className="w-24 shrink-0 text-stone-500">{entry.time}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-stone-900">{entry.holderName}{entry.quantity ? ` · ${entry.quantity}` : ""}</span>
                      <span className="hidden font-mono text-xs text-stone-500 sm:block">{entry.passCode}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-500">No scans yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  pending,
  days,
  onAdmit,
  onNext,
}: {
  result: Shown;
  pending: boolean;
  days: ReturnType<typeof useFestivalDays>;
  onAdmit: (override: boolean) => void;
  onNext: () => void;
}) {
  const nextButton = (
    <button type="button" onClick={onNext} className="min-h-12 flex-1 rounded-full border border-current/20 bg-white/70 px-5 py-3 text-sm font-bold hover:bg-white">
      Scan next
    </button>
  );

  if (result.kind === "invalid" || result.kind === "error") {
    return (
      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 text-rose-950">
        <div className="flex items-center gap-3">
          <XCircle className="size-9 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <p className="font-serif text-2xl font-semibold">{result.kind === "error" ? "Not checked in" : "Not valid"}</p>
            {result.kind === "invalid" && result.code && <p className="font-mono text-sm opacity-70">{result.code}</p>}
          </div>
        </div>
        <p className="mt-3 text-sm">{result.reason}</p>
        {result.kind === "invalid" && <p className="mt-1 text-sm opacity-80">Direct the visitor to the free-entry gate, or ask them to show the booking email.</p>}
        <div className="mt-4 flex">{nextButton}</div>
      </div>
    );
  }

  const { pass } = result;
  const details = (
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div><dt className="opacity-70">Visitor</dt><dd className="font-semibold">{pass.holderName}</dd></div>
      <div><dt className="opacity-70">Pass type</dt><dd className="font-semibold">{pass.tierName}</dd></div>
      <div><dt className="opacity-70">Entry window</dt><dd className="font-semibold">{formatPujaDate(pass.date, days)}, {formatTimeRange(pass.startTime, pass.endTime)}</dd></div>
      <div><dt className="opacity-70">Admits</dt><dd className="flex items-center gap-1 text-lg font-bold"><UsersRound className="size-4" aria-hidden="true" />{pass.quantity}</dd></div>
    </dl>
  );

  if (result.kind === "admitted") {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-9 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="font-serif text-2xl font-semibold">Admitted {pass.quantity} {pass.quantity === 1 ? "visitor" : "visitors"}</p>
            <p className="font-mono text-sm opacity-70">{pass.code}</p>
          </div>
        </div>
        {details}
        <div className="mt-4 flex">{nextButton}</div>
      </div>
    );
  }

  if (result.kind === "duplicate") {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-9 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-serif text-2xl font-semibold">Already checked in</p>
            <p className="font-mono text-sm opacity-70">{pass.code}{result.checkedInAt && ` · at ${result.checkedInAt}`}</p>
          </div>
        </div>
        {details}
        <p className="mt-3 text-sm">Each pass works once. Check the visitor&apos;s booking email before letting anyone back in.</p>
        <div className="mt-4 flex">{nextButton}</div>
      </div>
    );
  }

  const outOfWindow = result.timing !== "on-time";
  return (
    <div className={cn("rounded-2xl border-2 p-5", outOfWindow ? "border-amber-300 bg-amber-50 text-amber-950" : "border-emerald-300 bg-emerald-50 text-emerald-950")}>
      <div className="flex items-center gap-3">
        {outOfWindow ? <AlertTriangle className="size-9 shrink-0 text-amber-600" aria-hidden="true" /> : <CheckCircle2 className="size-9 shrink-0 text-emerald-600" aria-hidden="true" />}
        <div>
          <p className="font-serif text-2xl font-semibold">{outOfWindow ? "Valid, outside its window" : "Valid pass"}</p>
          <p className="font-mono text-sm opacity-70">{pass.code}</p>
        </div>
      </div>
      {details}
      {result.timing !== "on-time" && <p className="mt-3 text-sm font-medium">{timingNotes[result.timing]}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onAdmit(outOfWindow)}
          disabled={pending}
          className={cn("inline-flex min-h-12 flex-2 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-70", outOfWindow ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700")}
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {outOfWindow ? "Admit anyway" : `Admit ${pass.quantity} ${pass.quantity === 1 ? "visitor" : "visitors"}`}
        </button>
        <button type="button" onClick={onNext} disabled={pending} className="min-h-12 flex-1 rounded-full px-4 py-3 text-sm font-semibold hover:bg-white/60">
          Don&apos;t admit
        </button>
      </div>
    </div>
  );
}
