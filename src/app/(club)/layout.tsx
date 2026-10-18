import { ClubShell } from "@/features/club/components/club-shell";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <ClubShell>{children}</ClubShell>;
}
