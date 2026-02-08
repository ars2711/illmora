import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { cookies, headers } from "next/headers";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { FeedbackWidget } from "@/components/common/FeedbackWidget";
import SyncIndicator from "@/components/common/SyncIndicator";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import QuickActions from "@/components/common/QuickActions";
import ServiceWorkerRegister from "@/components/common/ServiceWorkerRegister";
import ScrollMotion from "@/components/common/ScrollMotion";
import DemoOverlay from "@/components/common/DemoOverlay";
import {
  defaultLocale,
  localeDirection,
  locales,
  type Locale,
} from "@/i18n/config";

export const dynamic = "force-dynamic";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilmora.ai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Ilmora | The Cognitive Engine",
  description:
    "An academic intelligence system to upgrade human thinking. Built for depth, mastery, and independence.",
  applicationName: "Ilmora",
  authors: [{ name: "Arsalan", url: "https://github.com/ars2711" }],
  keywords: [
    "AI",
    "Education",
    "Learning OS",
    "Cognitive Engine",
    "Memory Graph",
    "Offline-first",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon-light.svg",
        sizes: "any",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",
        sizes: "any",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    apple: [
      {
        url: "/favicon-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: [
      "/favicon-light.svg",
      "/favicon-dark.svg",
      "/favicon.svg",
      "/favicon.ico",
    ],
  },
  appleWebApp: {
    title: "Ilmora",
    statusBarStyle: "default",
    capable: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "Ilmora | The Cognitive Engine",
    description:
      "Build memory, mastery, and momentum with an ethical AI learning OS.",
    url: siteUrl,
    siteName: "Ilmora",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Ilmora hero visuals",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ilmora | The Cognitive Engine",
    description:
      "Build memory, mastery, and momentum with an ethical AI learning OS.",
    images: ["/og-image.svg"],
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
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on mobile for native-like feel
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const acceptLanguage = headers().get("accept-language") ?? "";

  const pickLocale = (value: string | undefined) => {
    if (!value) return defaultLocale;
    const match = value
      .split(",")
      .map((part) => part.trim().split(";")[0])
      .map((part) => part.split("-")[0])
      .find((part) => locales.includes(part as Locale));
    return (match as Locale) ?? defaultLocale;
  };

  const locale = cookieLocale
    ? pickLocale(cookieLocale)
    : pickLocale(acceptLanguage);
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const direction =
    localeDirection[locale as keyof typeof localeDirection] ?? "ltr";

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
                <DemoOverlay />
                <FeedbackWidget />
                <SyncIndicator />
                <QuickActions />
                <ServiceWorkerRegister />
                <ScrollMotion />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
