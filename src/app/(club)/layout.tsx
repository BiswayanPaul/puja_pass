import { ClubShell } from "@/features/club/components/club-shell";

// Static frame: each club page checks the member's access itself, inside a
// Suspense boundary (see requireClubAccess in src/server/auth/session.ts).
export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <ClubShell>{children}</ClubShell>;
}
