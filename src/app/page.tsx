import { PacingCalculator } from "@/components/pacing-calculator";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50/60">
      {/* Top navigatie */}


      {/* Hero + Calculator */}
      <section id="calculator" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            Bereken je wedstrijdtempo. Vind direct je trainingsgroep.
          </h1>
          <p className="text-base text-muted-foreground">
            Stel je splittijden samen voor je volgende hardloopwedstrijd of toertocht en haak aan bij sporters in jouw regio op exact ditzelfde niveau.
          </p>
        </div>

        <PacingCalculator />
      </section>
    </main>
  );
}