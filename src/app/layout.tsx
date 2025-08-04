import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quote & Invoice Management System",
  description: "Professional quote and invoice management system for backup power generating unit services",
  keywords: ["quotes", "invoices", "backup power", "services", "management"],
  authors: [{ name: "Quote & Invoice System" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "Quote & Invoice Management System",
    description: "Professional quote and invoice management for backup power services",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quote & Invoice Management System",
    description: "Professional quote and invoice management for backup power services",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
