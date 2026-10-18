import type { Metadata } from "next";
import { ClubRegisterForm } from "@/features/auth/components/club-register-form";

export const metadata: Metadata = {
  title: "Register your Puja club",
  description: "Join PujaPass to offer authorised timed entry, manage capacity and check visitors in with QR codes.",
};

export default function ClubRegisterPage() {
  return <ClubRegisterForm />;
}
