import type { Metadata } from "next";
import Home from "@/components/shared/Home";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Home />;
}
