import Link from "next/link";
import { connection } from "next/server";
import { PacingCalculator } from "@/components/pacing-calculator";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Calendar, Users } from "lucide-react";

export const metadata = {
  title: "Pacing Calculator — Tempo, Splits & Wattage | PaceClub",
  description:
    "Bereken je ideale wedstrijdtempo, negative splits en benodigd wattage voor hardlopen en wielrennen. Inclusief hoogtemeter- en W/kg-correctie.",
};

type Props = {
  searchParams: Promise<{
    sport?: string;
    km?: string;
    hm?: string;
    event?: string;
    slug?: string;
  }>;
};

export default async function CalculatorPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;

  const initialSport =
    params.sport === "ride" || params.sport === "run" ? params.sport : undefined;
  const parsedKm = params.km ? Number(params.km) : NaN;
  const parsedHm = params.hm ? Number(params.hm) : NaN;

  const initialKm = Number.isFinite(parsedKm) && parsedKm > 0 ? parsedKm : undefined;
  const initialHm = Number.isFinite(parsedHm) && parsedHm >= 0 ? parsedHm : undefined;
  const eventTitle = params.event ? params.event : undefined;
  const eventSlug = params.slug ? params.slug : undefined;

  const calculatorKey = `${initialSport ?? "run"}-${initialKm ?? "default"}-${initialHm ?? "default"}-${eventSlug ?? "none"}`;

  return (
    <main className="pb-20">
      {/* Compacte header + de Pacing Calculator */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background pt-10 pb-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Hardlopen
              </Badge>
              <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                Wielrennen
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                · PaceClub Pacing Engine
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pacing Calculator
            </h1>

            <p className="mt-2 text-base text-muted-foreground leading-relaxed">
              Stel je afstand, hoogtemeters en streeftijd of wattage in. Bekijk direct je 
              ideale tussentijden (inclusief negative split) en ontdek welk tempo bij je past.
            </p>
          </div>

            <PacingCalculator
                key={calculatorKey}
                initialSport={initialSport}
                initialKm={initialKm}
                initialHm={initialHm}
                eventTitle={eventTitle}
                eventSlug={eventSlug}
            />
        </div>
      </section>

      {/* Subtiele vervolgstap onder de calculator */}
      <section className="container mx-auto max-w-5xl px-4 pt-10">
        <div className="flex flex-col justify-between gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold">Race-plan klaar?</h2>
            <p className="text-sm text-muted-foreground">
              Zoek een wedstrijd op en haak aan bij een pace-treintje op jouw streeftijd.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wedstrijden"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Wedstrijdkalender
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/social"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Users className="mr-2 h-4 w-4" />
              Social Agenda
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}