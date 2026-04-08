import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/session-provider";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "InsideOil — Crude Oil Trading Intelligence",
    template: "%s | InsideOil",
  },
  description:
    "Real-time crude oil intelligence platform. Track 18,000+ tankers, get algorithmic trading signals, analyze crack spreads and arbitrage opportunities.",
  keywords: [
    "crude oil", "trading intelligence", "tanker tracking", "AIS",
    "crack spread", "arbitrage", "commodity trading", "oil market",
    "vessel tracking", "maritime intelligence",
  ],
  authors: [{ name: "InsideOil" }],
  creator: "InsideOil",
  metadataBase: new URL("https://insideoil.it"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://insideoil.it",
    siteName: "InsideOil",
    title: "InsideOil — Crude Oil Trading Intelligence",
    description:
      "Real-time crude oil intelligence platform. Track 18,000+ tankers, get algorithmic trading signals, analyze crack spreads and arbitrage opportunities.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InsideOil — Crude Oil Trading Intelligence",
    description:
      "Real-time crude oil intelligence. Track tankers, analyze crack spreads, get algorithmic trading signals.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://insideoil.it",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "InsideOil",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              description:
                "Real-time crude oil intelligence platform with tanker tracking, trading signals, and market analytics.",
              url: "https://insideoil.it",
              offers: [
                { "@type": "Offer", price: "19", priceCurrency: "EUR", name: "Junior Trader" },
                { "@type": "Offer", price: "99", priceCurrency: "EUR", name: "Trader" },
                { "@type": "Offer", price: "499", priceCurrency: "EUR", name: "Professional" },
              ],
            }),
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        <AuthProvider>
          {children}
          <CookieBanner />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
