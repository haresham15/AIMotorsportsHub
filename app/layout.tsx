import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import SuggestionsModal from '@/components/SuggestionsModal';
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060a13",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://apexis-racing.vercel.app'),
  title: "Apexis | Your Racing Universe",
  description:
    "The ultimate personalized dashboard for motorsport fans. Live telemetry, AI insights, and comprehensive coverage across F1, F2, F3, Formula E, NASCAR, GT World Challenge, and Top Fuel Drag Racing.",
  keywords: [
    "motorsport",
    "F1",
    "Formula 1",
    "NASCAR",
    "Formula E",
    "live racing",
    "race dashboard",
    "Top Fuel",
    "live telemetry",
    "racing AI",
    "Apexis",
    "Apexis racing"
  ],
  authors: [{ name: "Haresh Murugesan" }],
  creator: "Haresh Murugesan",
  publisher: "Apexis",
  openGraph: {
    title: "Apexis | Your Racing Universe",
    description:
      "Live telemetry, AI insights, and comprehensive coverage across F1, NASCAR, Formula E, and more.",
    type: "website",
    siteName: "Apexis",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apexis | Your Racing Universe",
    description:
      "Live telemetry, AI insights, and comprehensive coverage across F1, NASCAR, Formula E, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,700&family=Big+Shoulders+Display:wght@600;700;800;900&family=Chakra+Petch:ital,wght@0,500;0,600;0,700;1,700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <SiteHeader />
        <div className="flex-1">
          {children}
        </div>
        <SiteFooter />
        <SuggestionsModal />
        <Toaster theme="dark" richColors position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}
