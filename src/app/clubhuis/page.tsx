import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatRunPace } from "@/lib/pacing";
import {
  AgendaChatMessage,
  ClubhuisClient,
  MyClubSummary,
  UnifiedAgendaItem,
} from "@/components/clubhuis-client";

export const metadata = {
  title: "Mijn Clubhuis — PaceLine",
  description:
    "Jouw persoonlijke regiecentrum: aankomende wedstrijden, social ritten van jouw clubs en directe rit-chat.",
};

async function ClubhuisContent() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/clubhuis");
  }

  const nowIso = new Date().toISOString();

  // 1. Haal profiel, wedstrijd-treintjes, social-rit-deelnames én clublidmaatschappen parallel op
  const [
    { data: profile },
    { data: raceMemberships },
    { data: socialMemberships },
    { data: clubMemberships },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, city, body_weight_kg")
      .eq("id", user.id)
      .single(),
    supabase
      .from("pace_train_members")
      .select(
        `
        id,
        train_id,
        guest_count,
        pace_trains (
          id,
          target_duration_seconds,
          meeting_point,
          rule_type,
          events (
            id,
            slug,
            title,
            sport,
            event_date,
            distance_km
          )
        )
      `
      )
      .eq("user_id", user.id),
    supabase
      .from("social_ride_participants")
      .select(
        `
        id,
        ride_id,
        group_id,
        guest_count,
        social_ride_groups ( group_name, pace_label, no_drop ),
        social_rides (
          id,
          title,
          sport,
          ride_date,
          distance_km,
          start_location,
          clubs ( name )
        )
      `
      )
      .eq("user_id", user.id),
    supabase
      .from("club_members")
      .select(
        `
        club_id,
        clubs ( id, slug, name, sport, city, home_base, weekly_schedule )
      `
      )
      .eq("user_id", user.id),
  ]);

  // 2. Verwerk Mijn Clubs
  const myClubs: MyClubSummary[] = [];
  const myClubIds: string[] = [];

  for (const cm of (clubMemberships as any[]) ?? []) {
    if (cm.clubs) {
      myClubs.push(cm.clubs as MyClubSummary);
      myClubIds.push(cm.clubs.id);
    }
  }

  // 3. Bouw de uniforme chronologische tijdlijn op
  const agendaItems: UnifiedAgendaItem[] = [];
  const trainIds: string[] = [];
  const joinedRideIds: string[] = [];

  // A. Aangemelde wedstrijd Pace-treintjes
  for (const m of (raceMemberships as any[]) ?? []) {
    const train = m.pace_trains;
    const ev = train?.events;
    if (!train || !ev) continue;

    trainIds.push(train.id);
    const isRun = ev.sport === "run";
    const targetSec = Number(train.target_duration_seconds) || 3600;
    const paceLabel = isRun
      ? `${formatDuration(targetSec)} (${formatRunPace(targetSec / ev.distance_km)})`
      : `${formatDuration(targetSec)} (${(ev.distance_km / (targetSec / 3600))
          .toFixed(1)
          .replace(".", ",")} km/u)`;

    agendaItems.push({
      id: `train-${m.id}`,
      kind: "race_train",
      channelType: "train",
      channelId: train.id,
      title: ev.title,
      sport: ev.sport,
      dateIso: ev.event_date,
      distanceKm: ev.distance_km,
      location: train.meeting_point,
      paceOrTargetLabel: paceLabel,
      guestCount: m.guest_count ?? 0,
      noDrop: train.rule_type === "no_drop",
      href: `/wedstrijden/${ev.slug}`,
    });
  }

  // B. Aangemelde Social Ritten & Runs
  for (const sm of (socialMemberships as any[]) ?? []) {
    const ride = sm.social_rides;
    const grp = sm.social_ride_groups;
    if (!ride) continue;

    joinedRideIds.push(ride.id);
    agendaItems.push({
      id: `social-${sm.id}`,
      kind: "social_ride_joined",
      channelType: "ride",
      channelId: ride.id,
      title: ride.title,
      subtitle: ride.clubs?.name ?? null,
      sport: ride.sport,
      dateIso: ride.ride_date,
      distanceKm: ride.distance_km,
      location: ride.start_location,
      paceOrTargetLabel: grp?.pace_label ?? "Social tempo",
      groupName: grp?.group_name ?? null,
      guestCount: sm.guest_count ?? 0,
      noDrop: grp?.no_drop ?? true,
      href: `/social/${ride.id}`,
    });
  }

  // C. Aankomende ritten van jouw clubs waar je nog niet in staat
  if (myClubIds.length > 0) {
    const { data: clubRidesData } = await supabase
      .from("social_rides")
      .select(
        "id, title, sport, ride_date, distance_km, start_location, clubs ( name )"
      )
      .in("club_id", myClubIds)
      .gte("ride_date", nowIso)
      .order("ride_date", { ascending: true })
      .limit(8);

    for (const cr of (clubRidesData as any[]) ?? []) {
      if (joinedRideIds.includes(cr.id)) continue; // Staat al bij B
      agendaItems.push({
        id: `club-tip-${cr.id}`,
        kind: "club_ride_suggestion",
        title: cr.title,
        subtitle: cr.clubs?.name ?? "Clubrit",
        sport: cr.sport,
        dateIso: cr.ride_date,
        distanceKm: cr.distance_km,
        location: cr.start_location,
        paceOrTargetLabel: "Meerdere tempogroepen",
        href: `/social/${cr.id}`,
      });
    }
  }

  // Sorteer alles chronologisch (eerstvolgende afspraak bovenaan)
  agendaItems.sort(
    (a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime()
  );

  // 4. Haal chatberichten op voor zowel jouw wedstrijd-treintjes als jouw social ritten
  const [trainMsgsRes, rideMsgsRes] = await Promise.all([
    trainIds.length > 0
      ? supabase
          .from("train_messages")
          .select("id, train_id, user_id, author_name, content, created_at")
          .in("train_id", trainIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    joinedRideIds.length > 0
      ? supabase
          .from("social_ride_messages")
          .select(
            "id, ride_id, user_id, author_name, group_label, content, created_at"
          )
          .in("ride_id", joinedRideIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const initialMessages: AgendaChatMessage[] = [
    ...((trainMsgsRes.data as any[]) ?? []).map((m) => ({
      id: m.id,
      channelId: m.train_id,
      user_id: m.user_id,
      author_name: m.author_name,
      content: m.content,
      created_at: m.created_at,
    })),
    ...((rideMsgsRes.data as any[]) ?? []).map((m) => ({
      id: m.id,
      channelId: m.ride_id,
      user_id: m.user_id,
      author_name: m.author_name,
      group_label: m.group_label,
      content: m.content,
      created_at: m.created_at,
    })),
  ];

  return (
    <ClubhuisClient
      userId={user.id}
      userEmail={user.email ?? ""}
      initialProfile={{
        full_name: profile?.full_name ?? "Sporter",
        city: profile?.city ?? null,
        body_weight_kg: profile?.body_weight_kg ?? 75,
      }}
      myClubs={myClubs}
      agendaItems={agendaItems}
      initialMessages={initialMessages}
    />
  );
}

export default function ClubhuisPage() {
  return (
    <div className="min-h-screen bg-stone-100 pb-20 text-zinc-900">
      <div className="border-b border-stone-200 bg-white pt-10 pb-8">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Mijn Clubhuis
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Jouw persoonlijke regiecentrum: aankomende wedstrijden, clubritten en directe groepschat.
          </p>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 pt-8">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm font-medium text-zinc-600">
              Clubhuis laden...
            </div>
          }
        >
          <ClubhuisContent />
        </Suspense>
      </main>
    </div>
  );
}