import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import { RacePaceTrains, PaceTrain } from "@/components/race-pace-trains";
import { RaceCourseTips, CourseTip } from "@/components/race-course-tips";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  Bike,
  Calculator,
  Calendar,
  ExternalLink,
  Footprints,
  MapPin,
  Mountain,
  Ruler,
} from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("title, city, distance_km, sport")
    .eq("slug", slug)
    .single();

  if (!event) return {};

  return {
    title: `${event.title} (${event.distance_km} km) — Pace-Treintjes & Parcours Tips`,
    description: `Vind een pace-treintje en lees lokale parcours- en materiaaltips voor ${event.title} in ${event.city}.`,
  };
}

export default async function EventDetailPage({ params }: Props) {
  await connection();
  const { slug } = await params;

  // 1. Haal de wedstrijd op basis van de slug op (inclusief website_url)
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Haal gekoppelde pace-treintjes en parcours-tips parallel op
  const [{ data: trains }, { data: tips }] = await Promise.all([
    supabase
      .from("pace_trains")
      .select("*")
      .eq("event_id", event.id)
      .order("target_duration_seconds", { ascending: true }),
    supabase
      .from("course_tips")
      .select("*")
      .eq("event_id", event.id)
      .order("upvotes", { ascending: false }),
  ]);

  const isRun = event.sport === "run";

  return (
    <main className="min-h-screen bg-slate-50 pb-24 pt-5 sm:pt-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Terug-link */}
        <div className="mb-4">
          <Link
            href="/wedstrijden"
            className={`${buttonVariants({ variant: "ghost", size: "sm" })} -ml-2 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900`}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Wedstrijdkalender
          </Link>
        </div>

        {/* Wedstrijd Header met gekleurde sport-accentbalk */}
        <header
          className={`mb-8 overflow-hidden rounded-2xl border border-slate-200/90 border-t-4 bg-white p-5 shadow-sm sm:p-8 ${
            isRun ? "border-t-orange-600" : "border-t-teal-600"
          }`}
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              {/* Sport-badge + Datum */}
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <Badge
                  variant="secondary"
                  className={
                    isRun
                      ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20"
                      : "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20"
                  }
                >
                  {isRun ? (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Footprints className="h-3.5 w-3.5" /> Hardlopen
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Bike className="h-3.5 w-3.5" /> Wielrennen
                    </span>
                  )}
                </Badge>

                <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 font-mono tabular-nums">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {new Date(event.event_date).toLocaleDateString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Titel */}
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {event.title}
              </h1>

              {/* Locatie */}
              {event.city && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <MapPin
                    className={`h-4 w-4 shrink-0 ${
                      isRun ? "text-orange-600" : "text-teal-600"
                    }`}
                  />
                  <span>
                    {event.city}
                    {event.location ? ` · ${event.location}` : ""}
                  </span>
                </p>
              )}
            </div>

            {/* Actieknoppen */}
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              {event.website_url && (
                <a
                  href={event.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Officiële site
                </a>
              )}

              <Link
                href={`/calculator?sport=${event.sport}&km=${event.distance_km}&hm=${event.elevation_m}&event=${encodeURIComponent(event.title)}&slug=${event.slug}`}
                className={`${buttonVariants({
                  variant: "default",
                  size: "sm",
                })} ${
                  isRun
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                <Calculator className="mr-1.5 h-3.5 w-3.5" />
                Bereken splits
              </Link>
            </div>
          </div>

          {/* Visuele KPI-blokken voor Afstand & Hoogtemeters */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:max-w-md">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Ruler className="h-3.5 w-3.5 text-slate-400" />
                Afstand
              </div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
                {event.distance_km} <span className="text-sm font-medium text-slate-500">km</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Mountain className="h-3.5 w-3.5 text-slate-400" />
                Hoogtemeters
              </div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
                {event.elevation_m > 0 ? (
                  <>
                    {event.elevation_m}{" "}
                    <span className="text-sm font-medium text-slate-500">hm</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-slate-600">Vlak parcours</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Secties met duidelijke visuele ademruimte */}
        <div className="space-y-8">
          {/* Sectie 1: Interactieve Pace-Treintjes */}
          <section>
            <RacePaceTrains
              eventId={event.id}
              eventSlug={event.slug}
              sport={event.sport}
              distanceKm={Number(event.distance_km)}
              initialTrains={(trains as PaceTrain[]) ?? []}
            />
          </section>

          {/* Sectie 2: Parcours- & Materiaal-intel */}
          <section>
            <RaceCourseTips
              eventId={event.id}
              sport={event.sport}
              initialTips={(tips as CourseTip[]) ?? []}
            />
          </section>
        </div>
      </div>
    </main>
  );
}