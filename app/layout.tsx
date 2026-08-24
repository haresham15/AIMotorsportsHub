import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  title: "The Motorsport Hub | Your Racing Universe",
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
    "racing AI"
  ],
  authors: [{ name: "Haresh Murugesan" }],
  creator: "Haresh Murugesan",
  publisher: "The Motorsport Hub",
  openGraph: {
    title: "The Motorsport Hub | Your Racing Universe",
    description:
      "Live telemetry, AI insights, and comprehensive coverage across F1, NASCAR, Formula E, and more.",
    type: "website",
    siteName: "The Motorsport Hub",
    images: [
      {
        url: "/icon.jpg",
        width: 1024,
        height: 1024,
        alt: "The Motorsport Hub Logo",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "The Motorsport Hub | Your Racing Universe",
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
      <body
        className={`${inter.variable} ${jetbrainsMono.variable}`}
        style={{ fontFamily: "var(--font-sans)" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
