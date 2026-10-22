import { CheckCircle2, Clock3, Copy, FileWarning, Sprout, XCircle } from "lucide-react";
import { REVIEW_DUE_DAYS } from "@/server/admin";
import type { ApplicationStatus, ClubApplicationSummary } from "@/types";
import { Pill } from "./admin-ui";

export function ApplicationStatusPill({ status }: { status: ApplicationStatus }) {
  if (status === "approved") return <Pill tone="success" icon={CheckCircle2}>Approved</Pill>;
  if (status === "rejected") return <Pill tone="danger" icon={XCircle}>Rejected</Pill>;
  return <Pill tone="accent" icon={Clock3}>Pending</Pill>;
}

function waitingLabel(days: number) {
  if (days === 0) return "Submitted today";
  return `Waiting ${days} ${days === 1 ? "day" : "days"}`;
}

/** Problems an admin should notice before opening the application. */
export function ApplicationFlags({ application }: { application: ClubApplicationSummary }) {
  const missing = [!application.hasCertificate && "registration", !application.hasPermission && "permission"].filter(Boolean);
  const pending = application.status === "pending";
  return (
    <div className="flex flex-wrap gap-1.5">
      {pending && (
        <Pill tone={application.waitingDays > REVIEW_DUE_DAYS ? "warning" : "neutral"} icon={Clock3}>
          {waitingLabel(application.waitingDays)}
        </Pill>
      )}
      {pending && missing.length > 0 && (
        <Pill tone="warning" icon={FileWarning}>
          {missing.length === 2 ? "No documents" : `Missing ${missing[0]}`}
        </Pill>
      )}
      {pending && application.duplicateOfClub && (
        <Pill tone="danger" icon={Copy}>Registration no. in use</Pill>
      )}
      {pending && application.established >= new Date(application.submittedAt).getUTCFullYear() && (
        <Pill tone="neutral" icon={Sprout}>First-year club</Pill>
      )}
    </div>
  );
}
