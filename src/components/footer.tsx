import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t bg-muted/20 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight">
            <span className="h-2 w-2 rounded-full bg-orange-600" />
            <span>PaceLine</span>
          </Link>
          <p className="text-xs text-muted-foreground max-w-md">
            Start met een plan, finish met een groep. Pacing-berekeningen en startvak-treintjes voor hardlopers en wielrenners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          <Link href="/calculator" className="hover:text-foreground transition-colors">
            Pacing Tool
          </Link>
          <Link href="/wedstrijden" className="hover:text-foreground transition-colors">
            Wedstrijdkalender
          </Link>
          <Link href="/social" className="hover:text-foreground transition-colors">
            Social Agenda
          </Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Kennisbank
          </Link>
          <Link href="/clubhuis" className="hover:text-foreground transition-colors">
            Mijn Clubhuis
          </Link>
          <Link
            href="/over-ons"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Over ons
          </Link>
        </div>
      </div>
    </footer>
  );
}