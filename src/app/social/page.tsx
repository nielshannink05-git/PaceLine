import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users } from "lucide-react";
import {
  SocialAgendaClient,
  SocialRideItem,
  SocialRideParticipant,
} from "@/components/social-agenda-client";
import {
  ClubsHubSection,
  ClubOverviewItem,
} from "@/components/clubs-hub-section";

export const metadata = {
  title: "Social Ritten, Clubs & Duurlopen — PaceLine",
  description:
    "Sluit aan bij lokale fietsclubs, run clubs en weekendritten met vaste tempogroepen en koffiestops.",
};

async function SocialContent() {
  await connection();
  const supabase = await createClient();

  const [
    { data: ridesData },
    { data: participantsData },
    { data: eventsData },
    { data: clubsData },
  ] = await Promise.all([
    supabase
      .from("social_rides")
      .select(
        `
        id,
        creator_id,
        creator_name,
        event_id,
        club_id,
        sport,
        title,
        ride_date,
        distance_km,
        start_location,
        vibe_tags,
        terrain_summary,
        gpx_url,
        events ( slug, title ),
        clubs ( slug, name ),
        social_ride_groups ( id, ride_id, group_name, pace_label, no_drop, sort_order )
      `
      )
      .gte("ride_date", new Date().toISOString())
      .order("ride_date", { ascending: true }),
    supabase
      .from("social_ride_participants")
      .select("id, group_id, ride_id, user_id, participant_name, guest_count"),
    supabase
      .from("events")
      .select("id, title, sport")
      .order("event_date", { ascending: true }),
    supabase
      .from("clubs")
      .select(
        "id, slug, name, sport, city, home_base, weekly_schedule, club_members ( id )"
      )
      .order("created_at", { ascending: true }),
  ]);

  const initialRides: SocialRideItem[] = ((ridesData as any[]) ?? []).map(
    (r) => ({
      id: r.id,
      creator_id: r.creator_id,
      creator_name: r.creator_name,
      event_id: r.event_id,
      club_id: r.club_id ?? null,
      sport: r.sport,
      title: r.title,
      ride_date: r.ride_date,
      distance_km: r.distance_km,
      start_location: r.start_location,
      vibe_tags: r.vibe_tags ?? [],
      terrain_summary: r.terrain_summary ?? null,
      gpx_url: r.gpx_url ?? null,
      event: r.events ? { slug: r.events.slug, title: r.events.title } : null,
      club: r.clubs ? { slug: r.clubs.slug, name: r.clubs.name } : null,
      groups: ((r.social_ride_groups as any[]) ?? []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    })
  );

  const clubs = (clubsData as any[]) ?? [];

  return (
    <>
      {/* Compacte, contrastrijke kopsectie */}
      <section className="border-b border-stone-200 bg-white pt-6 pb-6 shadow-2xs sm:pt-10 sm:pb-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge
              variant="secondary"
              className="bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 font-semibold"
            >
              Lokale Hubs &amp; Ritten
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-zinc-600 font-mono tabular-nums">
              <Users className="h-3 w-3 text-zinc-500" />
              {clubs.length} {clubs.length === 1 ? "club" : "clubs"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-zinc-600 font-mono tabular-nums">
              <CalendarDays className="h-3 w-3 text-zinc-500" />
              {initialRides.length}{" "}
              {initialRides.length === 1 ? "rit" : "ritten"}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Social Ritten &amp; Lokale Clubs
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Sluit je aan bij een vaste lokale club in jouw regio of pik een losse
            weekendrit mee. Kies het tempovak dat bij je past en zet de afspraak
            direct in je agenda.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-5xl px-4 pt-6 space-y-8 sm:pt-8 sm:space-y-10">
        {/* LAAG 1: LOKALE HUBS / CLUBS SECTIE */}
        <section>
          <ClubsHubSection
            initialClubs={clubs.map(
              (c): ClubOverviewItem => ({
                id: c.id,
                slug: c.slug,
                name: c.name,
                sport: c.sport,
                city: c.city,
                home_base: c.home_base,
                weekly_schedule: c.weekly_schedule,
                memberCount: Array.isArray(c.club_members)
                  ? c.club_members.length
                  : 0,
              })
            )}
          />
        </section>

        {/* LAAG 2: DE SOCIAL AGENDA (RITTEN & RUNS) */}
        <section className="border-t border-stone-200 pt-8 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: "#ecfdf5",
                  color: "#047857",
                }}
              >
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight text-zinc-900">
                  Geplande ritten &amp; duurlopen
                </h2>
                <p className="text-xs text-zinc-500">
                  Kies je tempovak en stap direct in
                </p>
              </div>
            </div>

            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs ring-1 ring-inset ring-stone-200 font-mono tabular-nums">
              {initialRides.length}
            </span>
          </div>

          <SocialAgendaClient
            initialRides={initialRides}
            initialParticipants={
              (participantsData as SocialRideParticipant[]) ?? []
            }
            eventsList={(eventsData as any[]) ?? []}
            clubsList={clubs.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
            }))}
          />
        </section>
      </main>
    </>
  );
}

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-stone-100 pb-24 text-zinc-900">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-5xl px-4 pt-10">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm font-medium text-zinc-600">
              Social agenda en clubs laden...
            </div>
          </div>
        }
      >
        <SocialContent />
      </Suspense>
    </div>
  );
}