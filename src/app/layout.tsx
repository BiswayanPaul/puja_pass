import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/features/auth/use-session";
import { FestivalProvider } from "@/features/festival/festival-context";
import { getFestivalDays } from "@/server/festival";
import { siteUrl } from "@/lib/site";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "PujaPass | Durga Puja Pandals & Timed Entry Passes in Kolkata",
    template: "%s | PujaPass",
  },

  description:
    "Discover Kolkata's Durga Puja pandals, reserve timed entry passes, and plan your own multi-pandal Puja trail.",

  applicationName: "PujaPass",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: "PujaPass",
    title: "PujaPass | Durga Puja Pandals & Timed Entry Passes in Kolkata",
    description:
      "Discover Kolkata's Durga Puja pandals, reserve timed entry passes, and plan your own multi-pandal Puja trail.",
    url: "/",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "PujaPass | Durga Puja Pandals & Timed Entry Passes in Kolkata",
    description:
      "Discover Kolkata's Durga Puja pandals, reserve timed entry passes, and plan your own multi-pandal Puja trail.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cached, so every page can still be prerendered.
  const festivalDays = await getFestivalDays();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SessionProvider>
          <FestivalProvider days={festivalDays}>{children}</FestivalProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
