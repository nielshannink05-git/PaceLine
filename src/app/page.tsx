import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GUIDE_ARTICLES } from "@/lib/guides";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowRight,
  Bike,
  BookOpen,
  Calculator,
  Calendar,
  Footprints,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";

export const metadata = {
  title: "PaceLine — Start met een plan. Finish met een groep.",
  description:
    "Het platform voor duursporters dat voorbereiding verbindt met echte mensen in het startvak en tijdens weekendritten.",
};

// 👇 PAS DIT PAD AAN ALS JOUW FOTO IN /public ANDERS HEET (bijv. "/hero.jpg" of "/images/startvak.jpg")
const HERO_IMAGE_SRC = "/hero-banner.jpg";

function isRunningSport(sport: string | null | undefined): boolean {
  const normalized = (sport ?? "").toLowerCase().trim();
  return normalized === "run" || normalized === "hardlopen";
}

async function HomeContent() {
  await connection();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: upcomingRides }, { data: upcomingEvents }] = await Promise.all([
    supabase
      .from("social_rides")
      .select(
        `
        id,
        sport,
        title,
        ride_date,
        distance_km,
        start_location,
        social_ride_participants ( id, guest_count )
      `
      )
      .gte("ride_date", nowIso)
      .order("ride_date", { ascending: true })
      .limit(2),
    supabase
      .from("events")
      .select(
        `
        id,
        slug,
        title,
        sport,
        event_date,
        distance_km,
        city,
        pace_trains ( id )
      `
      )
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true })
      .limit(1),
  ]);

  const rides = (upcomingRides as any[]) ?? [];
  const nextEvent = ((upcomingEvents as any[]) ?? [])[0] ?? null;

  return (
    <>
      {/* 1. TOPBALK + HERO MET JOUW ACHTERGRONDFOTO */}
      <div className="bg-zinc-950 text-white">
        <div className="border-b border-white/10 bg-zinc-950">
          <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Nieuw
              </span>
              <span className="text-zinc-300">
                Lokale Clubs &amp; Social Ritten met vaste tempogroepen staan nu live.
              </span>
            </div>
            <Link
              href="/social"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Bekijk social agenda →
            </Link>
          </div>
        </div>

        <section className="relative overflow-hidden">
          {/* Achtergrondafbeelding goed zichtbaar achter de tekst */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE_SRC}
            alt="Hardlopers en wielrenners bij de start"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
          />
          {/* Subtiele donkere waas zodat de witte tekst scherp leesbaar blijft */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/55 to-zinc-950/85" />

          <div className="relative container mx-auto max-w-4xl px-4 py-20 sm:py-32 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 py-1 text-xs font-medium text-zinc-100 backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Hardlopen &amp;</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "#10b981" }}
              />
              <span>Wielrennen</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl leading-[1.08] drop-shadow-xs">
              Start met een plan.
              <br />
              Finish met een groep.
            </h1>

            <p className="mx-auto max-w-xl text-sm sm:text-base text-zinc-200 leading-relaxed drop-shadow-xs">
              PaceLine verbindt duursporters met echte groepen op de weg en in het
              startvak. Sluit aan bij een lokale club, kies jouw tempovak voor de
              zondagrit of vind een pace-treintje op jouw niveau.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/social"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-2 border-0 shadow-md",
                })}
              >
                <Users className="h-4 w-4" />
                Ontdek Social Ritten &amp; Clubs
              </Link>

              <Link
                href="/wedstrijden"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/25 bg-black/45 text-white hover:bg-black/65 hover:text-white font-semibold gap-2 backdrop-blur-xs",
                })}
              >
                <Calendar className="h-4 w-4" />
                Bekijk Wedstrijdkalender
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* 2. COMMUNITY-OVERZICHT OP WARME STONE-ACHTERGROND MET GEKLEURDE KAARTKOPPEN */}
      {(rides.length > 0 || nextEvent) && (
        <section className="border-b border-stone-200/90 bg-stone-100 py-14 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4 space-y-8 sm:space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  Binnenkort op de agenda
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
                  Sluit aan bij een groep
                </h2>
              </div>

              <div className="flex items-center gap-5 text-xs font-bold">
                <Link
                  href="/social"
                  className="text-zinc-700 hover:text-orange-600 transition-colors"
                >
                  Alle ritten &amp; clubs →
                </Link>
                <Link
                  href="/wedstrijden"
                  className="text-zinc-700 hover:text-orange-600 transition-colors"
                >
                  Alle wedstrijden →
                </Link>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {rides.map((ride) => {
                const isRun = isRunningSport(ride.sport);
                const totalHeads = (
                  (ride.social_ride_participants as any[]) ?? []
                ).reduce((sum, p) => sum + 1 + (p.guest_count ?? 0), 0);

                return (
                  <Link
                    key={ride.id}
                    href={`/social/${ride.id}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 border-t-4 bg-white shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
                    style={{
                      borderTopColor: isRun ? "#ea580c" : "#047857",
                    }}
                  >
                    <div>
                      {/* Gekleurde sport-header */}
                      <div
                        className="flex items-center justify-between px-4 py-2.5 border-b text-xs"
                        style={{
                          backgroundColor: isRun ? "#fff7ed" : "#ecfdf5",
                          borderBottomColor: isRun ? "#ffedd5" : "#d1fae5",
                        }}
                      >
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono font-bold text-white shadow-2xs"
                          style={{
                            backgroundColor: isRun ? "#ea580c" : "#047857",
                          }}
                        >
                          {isRun ? (
                            <Footprints className="h-3 w-3 shrink-0" />
                          ) : (
                            <Bike className="h-3 w-3 shrink-0" />
                          )}
                          <span>
                            {isRun ? "Hardlopen" : "Wielrennen"} ·{" "}
                            {ride.distance_km} km
                          </span>
                        </span>

                        <span className="font-semibold text-zinc-700">
                          {totalHeads} sporter(s)
                        </span>
                      </div>

                      {/* Titel & Details */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-lg font-extrabold text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                          {ride.title}
                        </h3>

                        <div className="space-y-1.5 text-xs font-medium text-zinc-600">
                          <p className="flex items-center gap-1.5 font-mono tabular-nums">
                            <Calendar
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: isRun ? "#ea580c" : "#047857" }}
                            />
                            {new Date(ride.ride_date).toLocaleString("nl-NL", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <MapPin
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: isRun ? "#ea580c" : "#047857" }}
                            />
                            <span className="truncate">
                              {ride.start_location}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/80 px-5 py-3 text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                      <span>Kies tempogroep</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })}

              {nextEvent && (() => {
                const isEventRun = isRunningSport(nextEvent.sport);
                return (
                  <Link
                    href={`/wedstrijden/${nextEvent.slug}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 border-t-4 bg-white shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
                    style={{
                      borderTopColor: isEventRun ? "#ea580c" : "#047857",
                    }}
                  >
                    <div>
                      <div
                        className="flex items-center justify-between px-4 py-2.5 border-b text-xs"
                        style={{
                          backgroundColor: isEventRun ? "#fff7ed" : "#ecfdf5",
                          borderBottomColor: isEventRun ? "#ffedd5" : "#d1fae5",
                        }}
                      >
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono font-bold text-white shadow-2xs"
                          style={{
                            backgroundColor: isEventRun ? "#ea580c" : "#047857",
                          }}
                        >
                          <Trophy className="h-3 w-3 shrink-0" />
                          <span>Wedstrijd · {nextEvent.distance_km} km</span>
                        </span>

                        <span className="font-semibold text-zinc-700">
                          {Array.isArray(nextEvent.pace_trains)
                            ? nextEvent.pace_trains.length
                            : 0}{" "}
                          treintje(s)
                        </span>
                      </div>

                      <div className="p-5 space-y-3">
                        <h3 className="text-lg font-extrabold text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                          {nextEvent.title}
                        </h3>

                        <div className="space-y-1.5 text-xs font-medium text-zinc-600">
                          <p className="flex items-center gap-1.5 font-mono tabular-nums">
                            <Calendar
                              className="h-3.5 w-3.5 shrink-0"
                              style={{
                                color: isEventRun ? "#ea580c" : "#047857",
                              }}
                            />
                            {new Date(nextEvent.event_date).toLocaleDateString(
                              "nl-NL",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin
                              className="h-3.5 w-3.5 shrink-0"
                              style={{
                                color: isEventRun ? "#ea580c" : "#047857",
                              }}
                            />
                            {nextEvent.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/80 px-5 py-3 text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                      <span>Bekijk startvak-treintjes</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {/* 3. MEER DAN ALLEEN EEN REKENMACHINE (3 PIJLERS MET EIGEN KLEURACCENT) */}
      <section className="bg-white py-14 sm:py-20">
        <div className="container mx-auto max-w-6xl px-4 space-y-10 sm:space-y-12">
          <div className="mx-auto max-w-xl text-center space-y-2.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              Meer dan alleen een rekenmachine
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Veel platforms draaien om terugkijken op wat je al hebt gedaan. PaceLine
              draait om de voorpret, je tactiek en samen onderweg zijn.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Pijler 1: Oranje */}
            <Link
              href="/social"
              className="group rounded-2xl border border-stone-200 border-t-4 border-t-orange-600 bg-orange-50/35 p-6 transition-all hover:bg-orange-50/70 hover:shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-2xs">
                  <Users className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs font-bold text-orange-700">
                  01
                </span>
              </div>
              <h3 className="font-extrabold text-base text-zinc-900">
                Sluit aan bij ritten &amp; clubs
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Stap in het tempovak dat bij je past voor de zondagrit of een
                voorbereidingsloop, zonder chaotische groepsapps.
              </p>
            </Link>

            {/* Pijler 2: Bosgroen */}
            <Link
              href="/wedstrijden"
              className="group rounded-2xl border border-stone-200 border-t-4 p-6 transition-all hover:shadow-sm space-y-3"
              style={{
                borderTopColor: "#047857",
                backgroundColor: "#f2fbf7",
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-2xs"
                  style={{ backgroundColor: "#047857" }}
                >
                  <Trophy className="h-5 w-5" />
                </div>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: "#047857" }}
                >
                  02
                </span>
              </div>
              <h3 className="font-extrabold text-base text-zinc-900">
                Vind jouw pace-treintje
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Haak aan bij sporters met dezelfde streeftijd en spreek 10 minuten
                voor het startschot af in het startvak.
              </p>
            </Link>

            {/* Pijler 3: Zwart / Warm Stone */}
            <Link
              href="/calculator"
              className="group rounded-2xl border border-stone-200 border-t-4 border-t-zinc-900 bg-stone-50 p-6 transition-all hover:bg-stone-100/80 hover:shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-2xs">
                  <Calculator className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs font-bold text-zinc-700">
                  03
                </span>
              </div>
              <h3 className="font-extrabold text-base text-zinc-900">
                Reken je race-plan door
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Gebruik onze Pacing Tool voor vlakke splittijden of W/kg-schatting
                voordat je jouw groep kiest.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. GIDSEN & VOORBEREIDING OP WARME STONE-ACHTERGROND */}
      <section className="border-t border-stone-200/90 bg-stone-100 py-14 sm:py-20">
        <div className="container mx-auto max-w-6xl px-4 space-y-8 sm:space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Praktijk &amp; Strategie
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
                Wekelijkse gidsen voor onderweg
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600">
              <BookOpen className="h-3.5 w-3.5 text-orange-600" />
              Tips voor pacing, groepsritten en wedstrijddag
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {GUIDE_ARTICLES.map((article, idx) => {
              const isOrangeTag = idx % 2 === 0;
              return (
                <Link
                  key={article.slug}
                  href={`/gidsen/${article.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
                >
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className="rounded-full px-2.5 py-0.5 font-bold"
                        style={
                          isOrangeTag
                            ? { backgroundColor: "#fff7ed", color: "#c2410c" }
                            : { backgroundColor: "#ecfdf5", color: "#065f46" }
                        }
                      >
                        {article.category}
                      </span>
                      <span className="font-mono text-zinc-500">
                        {article.readTime}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-zinc-900 group-hover:text-orange-600 transition-colors leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/80 px-5 sm:px-6 py-3 text-xs font-bold text-zinc-800 group-hover:text-orange-600 transition-colors">
                    <span>Lees gids</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. RUSTIGE AFSLUITER */}
      <section className="border-t border-stone-200 bg-white py-14 sm:py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
            Klaar voor jouw volgende rit of startvak?
          </h2>
          <p className="text-sm text-zinc-600 max-w-lg mx-auto">
            Blader vrij door de agenda of log in met een Magic Link om je aan te
            melden bij een tempogroep.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/social"
              className={buttonVariants({
                className:
                  "bg-orange-600 hover:bg-orange-700 text-white font-semibold",
              })}
            >
              Naar de Social Agenda
            </Link>
            <Link
              href="/login"
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-stone-300 text-zinc-800 hover:bg-stone-100 font-semibold",
              })}
            >
              Inloggen / Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-100 text-zinc-900">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm font-medium text-zinc-600">
              PaceLine laden...
            </div>
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  );
}