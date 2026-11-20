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
    <main className="container mx-auto max-w-4xl px-4 py-10 pb-20">
      {/* Terug-link */}
      <div className="mb-6">
        <Link
          href="/wedstrijden"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar wedstrijdkalender
        </Link>
      </div>

      {/* Wedstrijd Header */}
      <header className="mb-8 rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  isRun
                    ? "bg-orange-100 text-orange-800"
                    : "bg-teal-100 text-teal-800"
                }
              >
                {isRun ? (
                  <span className="flex items-center gap-1">
                    <Footprints className="h-3.5 w-3.5" /> Hardlopen
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5" /> Wielrennen
                  </span>
                )}
              </Badge>

              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground font-mono tabular-nums">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(event.event_date).toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {event.title}
            </h1>

            {event.city && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{event.city}</span>
              </p>
            )}
          </div>

          {/* Actieknoppen rechtsboven */}
          <div className="flex flex-wrap items-center gap-2">
            {event.website_url && (
              <a
                href={event.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Officiële website
              </a>
            )}

            <Link
              href={`/calculator?sport=${event.sport}&km=${event.distance_km}&hm=${event.elevation_m}&event=${encodeURIComponent(event.title)}&slug=${event.slug}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
              })}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Bereken splits in Pacing Tool
            </Link>
          </div>
        </div>

        {/* Kerncijfers van het parcours */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t pt-5 text-sm font-mono tabular-nums">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{event.distance_km} km</span>
          </div>

          {event.elevation_m > 0 && (
            <div className="flex items-center gap-2">
              <Mountain className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{event.elevation_m} hoogtemeters</span>
            </div>
          )}
        </div>
      </header>

      {/* Sectie 1: Interactieve Pace-Treintjes */}
      <RacePaceTrains
        eventId={event.id}
        eventSlug={event.slug}
        sport={event.sport}
        distanceKm={Number(event.distance_km)}
        initialTrains={(trains as PaceTrain[]) ?? []}
      />

      {/* Sectie 2: Parcours- & Materiaal-intel */}
      <RaceCourseTips
        eventId={event.id}
        sport={event.sport}
        initialTips={(tips as CourseTip[]) ?? []}
      />
    </main>
  );
}