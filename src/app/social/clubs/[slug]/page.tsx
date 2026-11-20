import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ClubDetailClient,
  ClubItem,
  ClubMemberItem,
} from "@/components/club-detail-client";
import type { SocialRideItem } from "@/components/social-agenda-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveOpenStreetMapEmbed(locationText: string): Promise<string | null> {
  try {
    const cleanQuery = locationText.replace(/\([^)]*\)/g, "").trim();
    if (!cleanQuery) return null;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=nl,be,de&q=${encodeURIComponent(
        cleanQuery
      )}`,
      {
        headers: { "User-Agent": "PaceLine-Sportplatform/1.0" },
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

export default async function ClubDetailPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: clubData } = await supabase
    .from("clubs")
    .select("id, slug, name, sport, city, home_base, weekly_schedule, bio, creator_id")
    .eq("slug", slug)
    .single();

  if (!clubData) {
    notFound();
  }

  const club = clubData as ClubItem;

  const [{ data: membersData }, { data: ridesData }, mapEmbedUrl] =
    await Promise.all([
      supabase
        .from("club_members")
        .select("id, club_id, user_id, member_name, role")
        .eq("club_id", club.id)
        .order("created_at", { ascending: true }),
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
          social_ride_groups ( id, ride_id, group_name, pace_label, no_drop, sort_order )
        `
        )
        .eq("club_id", club.id)
        .gte("ride_date", new Date().toISOString())
        .order("ride_date", { ascending: true }),
      resolveOpenStreetMapEmbed(club.home_base),
    ]);

  const clubRides: SocialRideItem[] = ((ridesData as any[]) ?? []).map((r) => ({
    id: r.id,
    creator_id: r.creator_id,
    creator_name: r.creator_name,
    event_id: r.event_id,
    sport: r.sport,
    title: r.title,
    ride_date: r.ride_date,
    distance_km: r.distance_km,
    start_location: r.start_location,
    vibe_tags: r.vibe_tags ?? [],
    terrain_summary: r.terrain_summary ?? null,
    gpx_url: r.gpx_url ?? null,
    groups: ((r.social_ride_groups as any[]) ?? []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
  }));

  return (
    <ClubDetailClient
      club={club}
      initialMembers={(membersData as ClubMemberItem[]) ?? []}
      clubRides={clubRides}
      mapEmbedUrl={mapEmbedUrl}
    />
  );
}