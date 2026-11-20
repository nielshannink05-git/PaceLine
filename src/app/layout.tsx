import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PaceLine — Start met een plan. Finish met een groep.",
    template: "%s | PaceLine",
  },
  description:
    "Bereken je ideale wedstrijdtempo, vind een pace-treintje in het startvak en deel lokale parcours-tips voor hardlopen en wielrennen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-stone-100 font-sans text-zinc-900 antialiased selection:bg-orange-100 selection:text-orange-900">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}