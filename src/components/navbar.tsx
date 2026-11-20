"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Home, LogIn, LogOut, UserCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/wedstrijden", label: "Wedstrijden" },
    { href: "/social", label: "Social Agenda" },
    { href: "/calculator", label: "Pacing Tool" },
    { href: "/blog", label: "Kennisbank" },
  ];

  const isHomeActive = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/90 bg-white/95 backdrop-blur-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Merk & Home-knop met duidelijke knop-omlijning */}
        <Link
          href="/"
          title="Terug naar home"
          className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 font-extrabold text-base sm:text-lg tracking-tight transition-all shadow-2xs ${
            isHomeActive
              ? "border-orange-200 bg-orange-50/70 text-zinc-900"
              : "border-stone-200 bg-stone-50/90 text-zinc-900 hover:border-stone-300 hover:bg-stone-100/80"
          }`}
        >
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#047857" }}
            />
          </span>
          <span>PaceLine</span>
          <span
            className={`ml-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              isHomeActive
                ? "border-orange-200/80 bg-white text-orange-700"
                : "border-stone-200/80 bg-white text-zinc-500 group-hover:text-zinc-800"
            }`}
          >
            <Home className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">Home</span>
          </span>
        </Link>

        {/* Desktop navigatie met dun lijntje om elke knop */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg border px-3 py-1.5 transition-all ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white font-semibold shadow-2xs"
                    : "border-stone-200/90 bg-white text-zinc-700 hover:border-stone-300 hover:bg-stone-50 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Rechts: Clubhuis / Inloggen */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/clubhuis"
                className={buttonVariants({
                  variant: pathname === "/clubhuis" ? "default" : "outline",
                  size: "sm",
                  className:
                    pathname === "/clubhuis"
                      ? "gap-1.5 bg-orange-600 hover:bg-orange-700 text-white border-orange-600 font-semibold"
                      : "gap-1.5 border-stone-200 bg-white text-zinc-800 hover:bg-stone-50 hover:border-stone-300 font-semibold",
                })}
              >
                <UserCheck className="h-4 w-4" />
                <span>Mijn Clubhuis</span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                title="Uitloggen"
                className="px-2.5 border-stone-200 text-zinc-500 hover:text-zinc-900 hover:bg-stone-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className:
                  "gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-2xs",
              })}
            >
              <LogIn className="h-4 w-4" />
              <span>Inloggen</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobiele navigatiebalk (< md) met echte knop-pills en dun kader */}
      <nav className="flex md:hidden items-center gap-1.5 overflow-x-auto border-t border-stone-200/80 bg-stone-50/90 px-4 py-2 text-xs font-medium">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full border px-3 py-1.5 transition-all ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white font-semibold shadow-2xs"
                  : "border-stone-200/90 bg-white text-zinc-700 shadow-2xs active:scale-[0.98]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}