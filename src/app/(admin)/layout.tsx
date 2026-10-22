import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata: Metadata = {
  title: { template: "%s · PujaPass admin", default: "PujaPass admin" },
  robots: { index: false, follow: false },
};

// Each admin page checks access itself with `requirePlatformAdmin()` inside a
// Suspense boundary, so this layout stays static.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
