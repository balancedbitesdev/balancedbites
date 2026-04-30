import type { Metadata } from "next";
import { Dancing_Script, Fraunces, Geist } from "next/font/google";
import { AppProviders } from "@/components/balanced-bites/AppProviders";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeDir } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  weight: ["400", "500"],
  variable: "--font-dancing",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Balanced Bites",
    template: "%s | Balanced Bites",
  },
  description:
    "Health-focused meals and desserts—delivery in 6th October & Sheikh Zayed, Saturday pickup, and personalized nutrition plans.",
  icons: {
    icon: [{ url: "/favicon (3).ico", type: "image/x-icon" }],
    shortcut: "/favicon (3).ico",
    apple: "/favicon (3).ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale === "ar" ? "ar-EG" : "en"}
      dir={localeDir(locale)}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${fraunces.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
