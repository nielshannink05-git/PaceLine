import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SocialRideDetailClient } from "@/components/social-ride-detail-client";
import type {
  SocialRideItem,
  SocialRideParticipant,
} from "@/components/social-agenda-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Haalt gratis een OpenStreetMap embed-URL op basis van de startlocatie
async function resolveOpenStreetMapEmbed(
  locationText: string
): Promise<string | null> {
  try {
    // Verwijder extra instructies tussen haakjes voor een betere adres-match
    const cleanQuery = locationText.replace(/\([^)]*\)/g, "").trim();
    if (!cleanQuery) return null;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=nl,be,de&q=${encodeURIComponent(
        cleanQuery
      )}`,
      {
        headers: {
          "User-Agent": "PaceLine-Sportplatform/1.0",
        },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return null;
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const lat = parseFloat(results[0].lat);
    const lon = parseFloat(results[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

    const delta = 0.008;
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox
    )}&layer=mapnik&marker=${lat},${lon}`;
  } catch {
    return null;
  }
}

async function SocialRideDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: rideData }, { data: participantsData }] = await Promise.all([
    supabase
      .from("social_rides")
      .select(
        `
        id,
        creator_id,
        creator_name,
        event_id,
        sport,
        title,
        ride_date,
        distance_km,
        start_location,
        vibe_tags,
        terrain_summary,
        gpx_url,
        events ( slug, title ),
        social_ride_groups ( id, ride_id, group_name, pace_label, no_drop, sort_order )
      `
      )
      .eq("id", id)
      .single(),
    supabase
      .from("social_ride_participants")
      .select("id, group_id, ride_id, user_id, participant_name, guest_count")
      .eq("ride_id", id),
  ]);

  if (!rideData) {
    notFound();
  }

  const raw = rideData as any;
  const ride: SocialRideItem = {
    id: raw.id,
    creator_id: raw.creator_id,
    creator_name: raw.creator_name,
    event_id: raw.event_id,
    sport: raw.sport,
    title: raw.title,
    ride_date: raw.ride_date,
    distance_km: raw.distance_km,
    start_location: raw.start_location,
    vibe_tags: raw.vibe_tags ?? [],
    terrain_summary: raw.terrain_summary ?? null,
    gpx_url: raw.gpx_url ?? null,
    event: raw.events
      ? { slug: raw.events.slug, title: raw.events.title }
      : null,
    groups: ((raw.social_ride_groups as any[]) ?? []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
  };

  const mapEmbedUrl = await resolveOpenStreetMapEmbed(ride.start_location);

  return (
    <SocialRideDetailClient
      ride={ride}
      initialParticipants={(participantsData as SocialRideParticipant[]) ?? []}
      mapEmbedUrl={mapEmbedUrl}
    />
  );
}

export default function SocialRideDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-stone-100 text-zinc-900">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-5xl px-4 py-12">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm font-medium text-zinc-600">
              Ritdetails laden...
            </div>
          </div>
        }
      >
        <SocialRideDetailContent params={params} />
      </Suspense>
    </div>
  );
}