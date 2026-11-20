import Link from "next/link";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import { buttonVariants } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Mountain,
  Footprints,
  Bike,
  ArrowRight,
  Calculator,
  Users,
  Trophy,
  Ruler,
} from "lucide-react";

interface SportEvent {
  id: string;
  slug: string;
  title: string;
  sport: string;
  event_date: string;
  distance_km: number;
  elevation_m: number;
  city: string | null;
}

function isRunningSport(sport: string | null | undefined): boolean {
  const normalized = (sport ?? "").toLowerCase().trim();
  return normalized === "run" || normalized === "hardlopen";
}

function formatDutchDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function WedstrijdenPage() {
  await connection();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, slug, title, sport, event_date, distance_km, elevation_m, city")
    .order("event_date", { ascending: true });

  const eventList = (events as SportEvent[] | null) ?? [];
  const runCount = eventList.filter((e) => isRunningSport(e.sport)).length;
  const rideCount = eventList.filter((e) => !isRunningSport(e.sport)).length;

  return (
    <main className="min-h-screen bg-stone-100 pb-24">
      {/* Lichte, frisse kopsectie met subtiele kleuraccenten */}
      <section className="bg-white border-b border-stone-200 pt-6 pb-6 sm:pt-9 sm:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
              <Trophy className="h-3.5 w-3.5 text-orange-400" />
              Wedstrijdkalender
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200 font-mono tabular-nums">
              <Footprints className="h-3 w-3" /> {runCount} hardlopen
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border font-mono tabular-nums"
              style={{
                backgroundColor: "#ecfdf5",
                color: "#065f46",
                borderColor: "#a7f3d0",
              }}
            >
              <Bike className="h-3 w-3" /> {rideCount} wielrennen
            </span>
          </div>

          <div className="max-w-2xl space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
              Wedstrijden &amp; Toertochten
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Kies je volgende doel, bereken je ideale wedstrijdtempo en stap in
              een pace-treintje voor het startvak.
            </p>
          </div>
        </div>
      </section>

      {/* Kaarten-overzicht */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            Kon wedstrijden niet laden: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventList.map((event) => {
            const isRun = isRunningSport(event.sport);
            const sportParam = isRun ? "run" : "ride";

            return (
              <article
                key={event.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 border-t-4 bg-white shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
                style={{
                  borderTopColor: isRun ? "#ea580c" : "#047857",
                }}
              >
                <div>
                  {/* ZONE 1: Zacht getinte Sport-Header */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5 border-b"
                    style={{
                      backgroundColor: isRun ? "#fff7ed" : "#ecfdf5",
                      borderBottomColor: isRun ? "#ffedd5" : "#d1fae5",
                    }}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-xs"
                      style={{
                        backgroundColor: isRun ? "#ea580c" : "#047857",
                      }}
                    >
                      {isRun ? (
                        <>
                          <Footprints className="h-3 w-3 shrink-0" />
                          <span>Hardlopen</span>
                        </>
                      ) : (
                        <>
                          <Bike className="h-3 w-3 shrink-0" />
                          <span>Wielrennen</span>
                        </>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums text-zinc-700">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      {formatDutchDate(event.event_date)}
                    </span>
                  </div>

                  {/* ZONE 2: Witte Titel, Locatie & Lichte Data-tegels */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold leading-snug text-zinc-900">
                        <Link
                          href={`/wedstrijden/${event.slug}`}
                          className="hover:underline decoration-2 underline-offset-2"
                        >
                          {event.title}
                        </Link>
                      </h2>

                      {event.city && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500">
                          <MapPin
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: isRun ? "#ea580c" : "#047857" }}
                          />
                          <span>{event.city}</span>
                        </p>
                      )}
                    </div>

                    {/* Lichte, strakke KPI-blokjes voor Afstand & Hoogtemeters */}
                    <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-stone-50 p-2.5 border border-stone-200/80 font-mono tabular-nums">
                      <div className="flex items-center gap-2 px-1">
                        <Ruler
                          className="h-4 w-4 shrink-0"
                          style={{ color: isRun ? "#ea580c" : "#047857" }}
                        />
                        <div>
                          <div className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                            Afstand
                          </div>
                          <div className="text-sm font-bold text-zinc-900">
                            {String(event.distance_km).replace(".", ",")} km
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                        <Mountain
                          className="h-4 w-4 shrink-0"
                          style={{ color: isRun ? "#ea580c" : "#047857" }}
                        />
                        <div>
                          <div className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                            Hoogte
                          </div>
                          <div className="text-sm font-bold text-zinc-900">
                            {event.elevation_m > 0
                              ? `${event.elevation_m} hm`
                              : "Vlak"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ZONE 3: Lichte Actiebalk onderin */}
                <div className="flex items-center gap-2 border-t border-stone-100 bg-stone-50/70 px-4 py-3 sm:px-5">
                  <Link
                    href={`/wedstrijden/${event.slug}`}
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                      className:
                        "flex-1 gap-1.5 font-semibold text-white shadow-xs hover:opacity-90 transition-opacity",
                    })}
                    style={{
                      backgroundColor: isRun ? "#ea580c" : "#047857",
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Pace-treintjes
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    href={`/calculator?sport=${sportParam}&km=${event.distance_km}&hm=${event.elevation_m}&event=${encodeURIComponent(event.title)}&slug=${event.slug}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "gap-1.5 border-stone-200 bg-white text-zinc-700 hover:bg-stone-100 hover:text-zinc-900",
                    })}
                    title="Bereken pacing voor deze wedstrijd"
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Pacing</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}