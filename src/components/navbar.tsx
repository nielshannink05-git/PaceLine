import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
          <span>PaceClub</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Pacing Tool
          </Link>
          <Link href="/wedstrijden" className="hover:text-foreground transition-colors">
            Wedstrijden
          </Link>
          <Link href="/#agenda" className="hover:text-foreground transition-colors">
            Social Agenda
          </Link>
        </nav>
      </div>
    </header>
  );
}