import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatRunPace } from "@/lib/pacing";
import {
  ClubhuisClient,
  ClubTrainItem,
  TrainMessage,
  ClubTraining,
} from "@/components/clubhuis-client";

export const metadata = {
  title: "Mijn Clubhuis — PaceClub",
  description: "Beheer je aangemelde pace-treintjes, chat met je startvakgroep en plan trainingen.",
};

export default async function ClubhuisPage() {
  await connection();
  const supabase = await createClient();

  // Verifieer altijd via getUser() op de server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Haal profiel op
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, city, body_weight_kg")
    .eq("id", user.id)
    .single();

// 2. Haal treintjes op waar deze gebruiker aan deelneemt (inclusief event-info)
  const { data: memberships } = await supabase
    .from("pace_train_members")
    .select(
      `
      id,
      train_id,
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
    .eq("user_id", user.id);

  const myTrains: ClubTrainItem[] = [];
  const trainIds: string[] = [];

  for (const m of (memberships as any[]) ?? []) {
    const train = m.pace_trains;
    const ev = train?.events;
    if (!train || !ev) continue;

    trainIds.push(train.id);
    const isRun = ev.sport === "run";
    const paceLabel = isRun
      ? formatRunPace(train.target_seconds / ev.distance_km)
      : `${(ev.distance_km / (train.target_seconds / 3600))
          .toFixed(1)
          .replace(".", ",")} km/u`;

    myTrains.push({
      membershipId: m.id,
      trainId: train.id,
      targetTimeFormatted: formatDuration(train.target_seconds),
      paceLabel,
      meetingPoint: train.meeting_point,
      noDrop: train.no_drop,
      event: ev,
    });
  }

  // 3. Haal chatberichten op voor al jouw treintjes
  let initialMessages: TrainMessage[] = [];
  if (trainIds.length > 0) {
    const { data: msgs } = await supabase
      .from("train_messages")
      .select("id, train_id, user_id, author_name, content, created_at")
      .in("train_id", trainIds)
      .order("created_at", { ascending: true });

    initialMessages = (msgs as TrainMessage[]) ?? [];
  }

  // 4. Haal geplande clubtrainingen & aankomende wedstrijden op
  const [{ data: trainingsData }, { data: eventsData }] = await Promise.all([
    supabase
      .from("club_trainings")
      .select(
        "id, creator_id, creator_name, sport, title, training_date, distance_km, target_pace_or_speed, start_location, no_drop, events(title)"
      )
      .gte("training_date", new Date().toISOString())
      .order("training_date", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, sport")
      .order("event_date", { ascending: true }),
  ]);

  const initialTrainings: ClubTraining[] = ((trainingsData as any[]) ?? []).map((t) => ({
    ...t,
    event_title: t.events?.title ?? null,
  }));

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Mijn Clubhuis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jouw thuisbasis voor wedstrijdvoorbereiding, startvak-afstemming en gezamenlijke trainingen.
        </p>
      </div>

      <ClubhuisClient
        userId={user.id}
        userEmail={user.email ?? ""}
        initialProfile={{
          full_name: profile?.full_name ?? "Sporter",
          city: profile?.city ?? null,
          body_weight_kg: profile?.body_weight_kg ?? 75,
        }}
        myTrains={myTrains}
        initialMessages={initialMessages}
        initialTrainings={initialTrainings}
        eventsList={(eventsData as any[]) ?? []}
      />
    </main>
  );
}