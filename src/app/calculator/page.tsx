import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { PacingCalculator } from "@/components/pacing-calculator";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Calendar, Users } from "lucide-react";

export const metadata = {
  title: "Pacing Calculator — Tempo, Splits & Wattage | PaceLine",
  description:
    "Bereken je ideale wedstrijdtempo, negative splits en benodigd wattage voor hardlopen en wielrennen. Inclusief hoogtemeter- en W/kg-correctie.",
};

type SearchParamsShape = {
  sport?: string;
  km?: string;
  hm?: string;
  event?: string;
  slug?: string;
};

type Props = {
  searchParams: Promise<SearchParamsShape>;
};

async function CalculatorContent({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  await connection();
  const params = await searchParams;

  const initialSport =
    params.sport === "ride" || params.sport === "run" ? params.sport : undefined;
  const parsedKm = params.km ? Number(params.km) : NaN;
  const parsedHm = params.hm ? Number(params.hm) : NaN;

  const initialKm =
    Number.isFinite(parsedKm) && parsedKm > 0 ? parsedKm : undefined;
  const initialHm =
    Number.isFinite(parsedHm) && parsedHm >= 0 ? parsedHm : undefined;
  const eventTitle = params.event ? params.event : undefined;
  const eventSlug = params.slug ? params.slug : undefined;

  const calculatorKey = `${initialSport ?? "run"}-${initialKm ?? "default"}-${initialHm ?? "default"}-${eventSlug ?? "none"}`;

  return (
    <PacingCalculator
      key={calculatorKey}
      initialSport={initialSport}
      initialKm={initialKm}
      initialHm={initialHm}
      eventTitle={eventTitle}
      eventSlug={eventSlug}
    />
  );
}

export default function CalculatorPage({ searchParams }: Props) {
  return (
    <main className="min-h-screen bg-stone-100 pb-20 text-zinc-900">
      {/* Compacte header + de Pacing Calculator */}
      <section className="border-b border-stone-200 bg-white pt-8 pb-14 sm:pt-10">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border border-orange-200 bg-orange-50 text-orange-700 font-semibold"
              >
                Hardlopen
              </Badge>
              <Badge
                variant="secondary"
                className="border font-semibold"
                style={{
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                  borderColor: "#a7f3d0",
                }}
              >
                Wielrennen
              </Badge>
              <span className="text-xs font-medium text-zinc-500">
                · PaceLine Pacing Engine
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Pacing Calculator
            </h1>

            <p className="mt-2 text-base leading-relaxed text-zinc-600">
              Stel je afstand, hoogtemeters en streeftijd of wattage in. Bekijk
              direct je ideale tussentijden (inclusief negative split) en ontdek
              welk tempo bij je past.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm font-medium text-zinc-600">
                Pacing calculator laden...
              </div>
            }
          >
            <CalculatorContent searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      {/* Subtiele vervolgstap onder de calculator */}
      <section className="container mx-auto max-w-5xl px-4 pt-10">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Race-plan klaar?
            </h2>
            <p className="text-sm text-zinc-600">
              Zoek een wedstrijd op en haak aan bij een pace-treintje op jouw
              streeftijd.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wedstrijden"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className:
                  "bg-orange-600 hover:bg-orange-700 text-white font-semibold",
              })}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Wedstrijdkalender
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/social"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "border-stone-300 bg-white text-zinc-800 hover:bg-stone-100 font-semibold",
              })}
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