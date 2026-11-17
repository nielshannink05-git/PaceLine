import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar"; // <-- 1. Importeer je navigatiebalk

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaceClub — Pacing Tool & Social Runs",
  description: "Bereken je wedstrijdtempo en vind direct je trainingsgroep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar /> {/* <-- 2. Zet de balk boven {children} */}
        {children} {/* <-- 3. Hier laadt Next.js automatisch je huidige page.tsx */}
      </body>
    </html>
  );
}