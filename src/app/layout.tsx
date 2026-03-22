import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Routesmith — Personalized Exercise Routes",
  description:
    "Generate personalized running, walking, and biking routes based on your preferences for distance, elevation, scenery, and safety.",
  openGraph: {
    title: "Routesmith — Personalized Exercise Routes",
    description:
      "Generate personalized running, walking, and biking routes based on your preferences for distance, elevation, scenery, and safety.",
    type: "website",
    siteName: "Routesmith",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
