import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { FeedbackWidget } from "@/components/common/FeedbackWidget";
import SyncIndicator from "@/components/common/SyncIndicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ilmora | The Cognitive Engine",
  description: "An academic intelligence system to upgrade human thinking. Built for depth, mastery, and independence.",
  applicationName: "Ilmora",
  authors: [{ name: "Arsalan", url: "https://github.com/ars2711" }],
  keywords: ["AI", "Education", "Mastery", "NUST", "Pakistan", "Global"],
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Ilmora",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on mobile for native-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
            <FeedbackWidget />
            <SyncIndicator />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
