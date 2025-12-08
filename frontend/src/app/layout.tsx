import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scaff-Pro | Scaffold Planning System",
  description: "AI-powered scaffold planning and calculation system for the construction industry",
  keywords: ["scaffold", "construction", "planning", "AI", "building"],
};

import { ThemeRegistry } from "@/components/ThemeRegistry";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 font-sans antialiased`}
      >
        <ThemeRegistry />
        {children}
      </body>
    </html>
  );
}
