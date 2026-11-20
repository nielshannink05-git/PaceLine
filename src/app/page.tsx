import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Calendar,
  Clock,
  Compass,
  Flag,
  ShieldCheck,
  Users,
} from "lucide-react";

export const metadata = {
  title: "PaceLine — Race-voorbereiding, Pacing & Community voor Duursporters",
  description:
    "De brug tussen jouw wedstrijdplan en het startvak. Bereken je ideale splits, vind een pace-treintje voor je volgende race en deel parcours-tips.",
};

export default function HomePage() {
  // Haal de 3 nieuwste kennisbank-artikelen op uit content/blog/
  const latestPosts = getAllPosts().slice(0, 3);

  return (
    <main className="pb-24">
      {/* TOP AANKONDIGINGSBANNER */}
<div className="border-b bg-zinc-900 text-zinc-100">
  <div className="container mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs sm:text-sm">
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-orange-600 px-2 py-0.5 text-[11px] font-semibold text-white">
        Nieuw
      </span>
      <span className="text-zinc-200">
        Voorjaar 2027 geopend: vind jouw pace-treintje in het startvak.
      </span>
    </div>

    <Link
      href="/wedstrijden"
      className="inline-flex items-center gap-1 font-medium text-teal-400 hover:text-teal-300 hover:underline"
    >
      Bekijk kalender
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  </div>
</div>
      {/* 1. HERO: Rustig, helder verhaal met 2 concrete ingangen */}
{/* 1. HERO MET VISUELE BANNER */}
<section className="relative overflow-hidden border-b bg-zinc-950 pt-20 pb-24 text-white">
  {/* Achtergrondfoto uit public/hero-banner.jpg */}
  <img
    src="/hero-banner.jpg"
    alt="Duursporters op weg naar de finish"
    className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
  />
  {/* Subtiele donkere gradient voor maximaal leescontrast */}
  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/40" />

  <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur-xs">
      <span className="h-2 w-2 rounded-full bg-orange-500" />
      <span>Hardlopen</span>
      <span>&</span>
      <span className="h-2 w-2 rounded-full bg-teal-400" />
      <span>Wielrennen</span>
    </div>

    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl leading-[1.12] text-white">
      Start met een plan.{" "}
      <span className="block text-zinc-300 mt-1">
        Finish met een groep.
      </span>
    </h1>

    <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-300 leading-relaxed">
      PaceClub is het platform voor duursporters dat individuele race-voorbereiding verbindt 
      met echte mensen in het startvak. Reken je ideale tempo of wattage uit, deel lokale 
      parcourskennis en haak aan bij een pace-treintje op jouw niveau.
    </p>

    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Link
        href="/calculator"
        className={buttonVariants({
          size: "lg",
          className: "bg-orange-600 hover:bg-orange-700 text-white border-0",
        })}
      >
        <Calculator className="mr-2 h-4 w-4" />
        Open Pacing Calculator
      </Link>

      <Link
        href="/wedstrijden"
        className={buttonVariants({
          variant: "outline",
          size: "lg",
          className: "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white",
        })}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Bekijk Wedstrijdkalender
      </Link>
    </div>
  </div>
</section>

      {/* 2. HOE WERKT PACELINE? (Uitleg in 3 logische stappen) */}
      <section className="container mx-auto max-w-5xl px-4 py-20 border-b">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Meer dan alleen een rekenmachine
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Veel platforms draaien om terugkijken op wat je al hebt gedaan. PaceLine draait om 
            de voorpret, je tactiek en samen onderweg zijn.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">1. Reken je race-plan door</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Gebruik onze Pacing Engine om je streeftijd te vertalen naar realistische splittijden. 
              Met slimme opties zoals een <strong>2,5% negative split</strong> voor hardlopers en 
              hoogtemeter- en W/kg-correctie voor wielrenners.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">2. Vind jouw pace-treintje</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Koppel je streeftijd aan een wedstrijd in onze kalender. Zie direct wie er op 
              hetzelfde tempo start, spreek een vast punt af in het startvak en loop of fiets 
              samen uit de wind.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">3. Deel parcours-intel</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Geen onoverzichtelijke fora, maar gestructureerde tips van eerdere finishers. 
              Van bandenspanning en schoenkeuze tot verraderlijke klimmetjes, windrichting en 
              de beste koffiestop.
            </p>
          </div>
        </div>
      </section>

      {/* 3. DE FILOSOFIE ACHTER PACELINE (Algemene info over de website) */}
      <section className="container mx-auto max-w-5xl px-4 py-20 border-b">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-4">
            <Badge variant="secondary">Over PaceLine</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl leading-snug">
              Gebouwd vanuit de praktijk, zonder onnodige ruis
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Of je nu traint voor je eerste 10 kilometer, een halve marathon onder de 1:25 wilt 
              lopen of een cyclo met duizenden hoogtemeters in de bergen rijdt: een goede indeling 
              bepaalt of je de laatste kilometers stuk gaat of juist mensen inhaalt.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Daarom houden we PaceLine bewust laagdrempelig. Geen verplichte maandabonnementen of 
              eindeloze feeds vol kudos, maar directe tools, eerlijke kennis en vaste ritten met 
              lokale clubs via onze Social Agenda.
            </p>
          </div>

          <div className="lg:col-span-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-5">
              <Flag className="h-5 w-5 text-orange-600 mb-2" />
              <h3 className="font-semibold text-sm">Geen lege sport-app</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Door groepen te koppelen aan bestaande wedstrijden en vaste clubritten, weet je 
                altijd waar en wanneer er gestart wordt.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-5">
              <ShieldCheck className="h-5 w-5 text-teal-600 mb-2" />
              <h3 className="font-semibold text-sm">Samen uit, samen thuis</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Bij elk treintje en elke social ride staat vooraf duidelijk of het een no-drop 
                groep is of strak op wedstrijdschema.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-5 sm:col-span-2">
              <BookOpen className="h-5 w-5 text-foreground mb-2" />
              <h3 className="font-semibold text-sm">Eerlijke data & uitleg</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Onze berekeningen en artikelen zijn gebaseerd op bewezen trainings- en 
                wedstrijdprincipes — helder uitgelegd zodat je ze direct kunt toepassen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KENNISBANK & BLOGS (Inhoudelijke waarde direct zichtbaar) */}
      <section className="container mx-auto max-w-5xl px-4 py-20 border-b">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Uit de Kennisbank</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verdiep je in pacing-strategieën, voeding en materiaal voor je volgende start.
            </p>
          </div>

          <Link
            href="/blog"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Alle artikelen bekijken
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Binnenkort verschijnen hier onze eerste gidsen over pacing en materiaal.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {latestPosts.map((post) => {
              const isRun = post.sport === "run";
              const isRide = post.sport === "ride";

              return (
                <Card key={post.slug} className="flex flex-col justify-between transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          isRun
                            ? "bg-orange-100 text-orange-700"
                            : isRide
                            ? "bg-teal-100 text-teal-700"
                            : ""
                        }
                      >
                        {isRun ? "Hardlopen" : isRide ? "Wielrennen" : "Algemeen"}
                      </Badge>

                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono tabular-nums">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTimeMinutes} min
                      </span>
                    </div>

                    <CardTitle className="text-lg leading-snug">
                      <Link href={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>
                  </CardContent>

                  <CardFooter>
                    <Link
                      href={`/blog/${post.slug}`}
                      className={buttonVariants({ variant: "ghost", size: "sm", className: "px-0" })}
                    >
                      Lees artikel
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. RUSTIGE VERWIJZING NAAR AGENDA & SOCIAL CLUBS */}
      <section className="container mx-auto max-w-5xl px-4 pt-16">
        <div className="rounded-2xl border bg-muted/40 p-8 sm:p-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Klaar om je volgende doel te plannen?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base text-muted-foreground">
            Zoek een wedstrijd op onze kalender om een pace-treintje te vinden, of sluit 
            komend weekend aan bij een lokale fietsclub of hardloopgroep.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/wedstrijden"
              className={buttonVariants({ variant: "default" })}
            >
              Naar de Wedstrijdkalender
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/social"
              className={buttonVariants({ variant: "outline" })}
            >
              Ontdek Social Clubs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}