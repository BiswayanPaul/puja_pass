import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
