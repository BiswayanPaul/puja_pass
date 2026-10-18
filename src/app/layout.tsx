import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

// Set NEXT_PUBLIC_SITE_URL to your real production domain.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "PujaPass | Discover and Book Puja Services",
    template: "%s | PujaPass",
  },

  description:
    "Discover puja services and plan your religious ceremonies with PujaPass.",

  applicationName: "PujaPass",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: "PujaPass",
    title: "PujaPass | Discover and Book Puja Services",
    description:
      "Discover puja services and plan your religious ceremonies with PujaPass.",
    url: "/",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "PujaPass | Discover and Book Puja Services",
    description:
      "Discover puja services and plan your religious ceremonies with PujaPass.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
