"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { LogIn, LogOut, UserCheck } from "lucide-react";
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
    { href: "/calculator", label: "Pacing Tool" },
    { href: "/wedstrijden", label: "Wedstrijden" },
    { href: "/social", label: "Social Agenda" },
    { href: "/blog", label: "Kennisbank" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
          <span>PaceLine</span>
        </Link>

        {/* Desktop navigatie */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-foreground font-semibold transition-colors"
                    : "hover:text-foreground transition-colors"
                }
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
                      ? "gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                      : "gap-1.5",
                })}
              >
                <UserCheck className="h-4 w-4" />
                <span>Mijn Clubhuis</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                title="Uitloggen"
                className="px-2 text-muted-foreground hover:text-foreground"
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
                className: "gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white",
              })}
            >
              <LogIn className="h-4 w-4" />
              <span>Inloggen</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobiele navigatiebalk (alleen zichtbaar < md) */}
      <nav className="flex md:hidden items-center gap-1 overflow-x-auto border-t bg-muted/20 px-4 py-2 text-xs font-medium text-muted-foreground">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-3 py-1 transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white font-semibold"
                  : "hover:bg-muted hover:text-foreground"
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