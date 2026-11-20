"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { downloadCalendarIcs } from "@/lib/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Flag,
  LogIn,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

export type PaceTrain = {
  id: string;
  event_id: string;
  creator_name: string;
  target_duration_seconds: number;
  meeting_point: string;
  rule_type: "no_drop" | "own_pace";
  participants: string[];
};

type Props = {
  eventId: string;
  eventSlug?: string;
  eventTitle?: string;
  eventDate?: string;
  sport: "run" | "ride";
  distanceKm: number;
  initialTrains: PaceTrain[];
};

function formatSecondsToClock(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.round(totalSeconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatPaceFromDuration(
  totalSeconds: number,
  distanceKm: number,
  sport: "run" | "ride"
): string {
  if (distanceKm <= 0 || totalSeconds <= 0) return "-";

  if (sport === "run") {
    const paceSecondsPerKm = totalSeconds / distanceKm;
    const mins = Math.floor(paceSecondsPerKm / 60);
    const secs = Math.round(paceSecondsPerKm % 60);
    return `${mins}:${String(secs).padStart(2, "0")} min/km`;
  } else {
    const hours = totalSeconds / 3600;
    const speedKmh = distanceKm / hours;
    return `${speedKmh.toFixed(1)} km/u`;
  }
}

export function RacePaceTrains({
  eventId,
  eventSlug,
  eventTitle,
  eventDate,
  sport,
  distanceKm,
  initialTrains,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [trains, setTrains] = useState<PaceTrain[]>(initialTrains);
  const isRun = sport === "run";

  // Auth, Clubhuis & Introducee state
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [joinedTrainIds, setJoinedTrainIds] = useState<string[]>([]);
  const [guestCountByTrain, setGuestCountByTrain] = useState<Record<string, number>>({});
  const [totalGuestsByTrain, setTotalGuestsByTrain] = useState<Record<string, number>>({});
  const [busyTrainId, setBusyTrainId] = useState<string | null>(null);

  // Filter ± 5%
  const [filterHours, setFilterHours] = useState<string>(isRun ? "1" : "3");
  const [filterMinutes, setFilterMinutes] = useState<string>(isRun ? "30" : "00");
  const [useFilter, setUseFilter] = useState<boolean>(false);

  // Formulier "Nieuw treintje starten"
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [creatorName, setCreatorName] = useState<string>("");
  const [createHours, setCreateHours] = useState<string>(isRun ? "1" : "3");
  const [createMinutes, setCreateMinutes] = useState<string>(isRun ? "30" : "00");
  const [meetingPoint, setMeetingPoint] = useState<string>("");
  const [ruleType, setRuleType] = useState<"no_drop" | "own_pace">("no_drop");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const returnPath = eventSlug ? `/wedstrijden/${eventSlug}` : pathname;

  useEffect(() => {
    async function loadUserAndGuests() {
      const trainIds = initialTrains.map((t) => t.id);

      // Haal publieke introducee-aantallen op voor alle treintjes van deze race
      if (trainIds.length > 0) {
        const { data: allMembers } = await supabase
          .from("pace_train_members")
          .select("train_id, guest_count")
          .in("train_id", trainIds);

        if (allMembers) {
          const totals: Record<string, number> = {};
          for (const row of allMembers) {
            totals[row.train_id] = (totals[row.train_id] ?? 0) + (row.guest_count ?? 0);
          }
          setTotalGuestsByTrain(totals);
        }
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser ?? null);
      if (!currentUser) return;

      const [{ data: profile }, { data: memberships }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", currentUser.id)
          .single(),
        supabase
          .from("pace_train_members")
          .select("train_id, guest_count")
          .eq("user_id", currentUser.id),
      ]);

      const resolvedName =
        profile?.full_name || currentUser.email?.split("@")[0] || "Sporter";
      setProfileName(resolvedName);
      setCreatorName((prev) => prev || resolvedName);

      if (memberships) {
        setJoinedTrainIds(memberships.map((m) => m.train_id));
        const myGuests: Record<string, number> = {};
        for (const m of memberships) {
          myGuests[m.train_id] = m.guest_count ?? 0;
        }
        setGuestCountByTrain(myGuests);
      }
    }

    loadUserAndGuests();
  }, [supabase, initialTrains]);

  const desiredSeconds =
    parseInt(filterHours || "0", 10) * 3600 +
    parseInt(filterMinutes || "0", 10) * 60;

  const isMatch = (trainSeconds: number) => {
    if (!useFilter || desiredSeconds <= 0) return false;
    const diff = Math.abs(trainSeconds - desiredSeconds);
    return diff <= desiredSeconds * 0.05;
  };

  const sortedTrains = [...trains].sort((a, b) => {
    const aMatch = isMatch(a.target_duration_seconds) ? 1 : 0;
    const bMatch = isMatch(b.target_duration_seconds) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return a.target_duration_seconds - b.target_duration_seconds;
  });

  const hasAnyMatch =
    useFilter && sortedTrains.some((t) => isMatch(t.target_duration_seconds));

  function openCreateWithFilterTime() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }
    setCreateHours(filterHours);
    setCreateMinutes(filterMinutes);
    setShowCreateForm(true);
  }

  async function handleCreateTrain(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    const totalSeconds =
      parseInt(createHours || "0", 10) * 3600 +
      parseInt(createMinutes || "0", 10) * 60;

    const cleanName = (creatorName || profileName).trim();
    if (!cleanName || !meetingPoint.trim() || totalSeconds <= 0) return;

    setIsCreating(true);

    const newTrain = {
      event_id: eventId,
      creator_name: cleanName,
      target_duration_seconds: totalSeconds,
      meeting_point: meetingPoint.trim(),
      rule_type: ruleType,
      participants: [cleanName],
    };

    const { data, error } = await supabase
      .from("pace_trains")
      .insert([newTrain])
      .select()
      .single();

    if (!error && data) {
      await supabase.from("pace_train_members").insert({
        train_id: data.id,
        user_id: user.id,
        member_name: cleanName,
        guest_count: 0,
      });

      setTrains([...trains, data as PaceTrain]);
      setJoinedTrainIds((prev) => [...prev, data.id]);
      setShowCreateForm(false);
      setMeetingPoint("");
      router.refresh();
    } else {
      alert("Kon treintje niet opslaan. Controleer je Supabase-verbinding.");
    }

    setIsCreating(false);
  }

  async function handleJoinTrain(train: PaceTrain) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    const cleanName = (profileName || user.email?.split("@")[0] || "Sporter").trim();
    setBusyTrainId(train.id);

    const { error: memberError } = await supabase
      .from("pace_train_members")
      .insert({
        train_id: train.id,
        user_id: user.id,
        member_name: cleanName,
        guest_count: 0,
      });

    if (memberError) {
      setBusyTrainId(null);
      alert("Kon je niet aanmelden bij dit treintje.");
      return;
    }

    const updatedParticipants = train.participants.includes(cleanName)
      ? train.participants
      : [...train.participants, cleanName];

    await supabase
      .from("pace_trains")
      .update({ participants: updatedParticipants })
      .eq("id", train.id);

    setTrains(
      trains.map((t) =>
        t.id === train.id ? { ...t, participants: updatedParticipants } : t
      )
    );
    setJoinedTrainIds((prev) => [...prev, train.id]);
    setGuestCountByTrain((prev) => ({ ...prev, [train.id]: 0 }));
    setBusyTrainId(null);
    router.refresh();
  }

  async function handleToggleGuest(train: PaceTrain) {
    if (!user) return;
    const currentGuests = guestCountByTrain[train.id] ?? 0;
    const nextGuests = currentGuests > 0 ? 0 : 1;

    setBusyTrainId(train.id);

    const { error } = await supabase
      .from("pace_train_members")
      .update({ guest_count: nextGuests })
      .eq("train_id", train.id)
      .eq("user_id", user.id);

    if (!error) {
      const diff = nextGuests - currentGuests;
      setGuestCountByTrain((prev) => ({ ...prev, [train.id]: nextGuests }));
      setTotalGuestsByTrain((prev) => ({
        ...prev,
        [train.id]: Math.max(0, (prev[train.id] ?? 0) + diff),
      }));
      router.refresh();
    }

    setBusyTrainId(null);
  }

  async function handleLeaveTrain(train: PaceTrain) {
    if (!user) return;
    setBusyTrainId(train.id);

    const { error } = await supabase
      .from("pace_train_members")
      .delete()
      .eq("train_id", train.id)
      .eq("user_id", user.id);

    if (!error) {
      const cleanName = (profileName || "").trim();
      const updatedParticipants = train.participants.filter((p) => p !== cleanName);
      const removedGuests = guestCountByTrain[train.id] ?? 0;

      await supabase
        .from("pace_trains")
        .update({ participants: updatedParticipants })
        .eq("id", train.id);

      setTrains(
        trains.map((t) =>
          t.id === train.id ? { ...t, participants: updatedParticipants } : t
        )
      );
      setJoinedTrainIds((prev) => prev.filter((id) => id !== train.id));
      setTotalGuestsByTrain((prev) => ({
        ...prev,
        [train.id]: Math.max(0, (prev[train.id] ?? 0) - removedGuests),
      }));
      router.refresh();
    }

    setBusyTrainId(null);
  }

  function handleAddToCalendar(train: PaceTrain) {
    const timeStr = formatSecondsToClock(train.target_duration_seconds);
    const paceStr = formatPaceFromDuration(
      train.target_duration_seconds,
      distanceKm,
      sport
    );

    downloadCalendarIcs({
      title: `PaceLine Treintje (${timeStr}) — ${eventTitle ?? "Wedstrijd"}`,
      startDateIso: eventDate ?? new Date().toISOString().slice(0, 10),
      durationMinutes: Math.max(60, Math.round(train.target_duration_seconds / 60) + 30),
      location: train.meeting_point,
      description:
        `Streeftijd: ${timeStr} (${paceStr})\n` +
        `Verzamelpunt: ${train.meeting_point}\n` +
        `Afspraak: ${train.rule_type === "no_drop" ? "Samen uit, samen thuis" : "Strak op schema"}`,
      filename: `paceline-${eventSlug ?? "treintje"}.ics`,
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. ZOEK JOUW MATCH (± 5% STREEFTIJD FILTER) */}
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold">Wat is jouw streeftijd?</h2>
              <p className="text-xs text-muted-foreground">
                We highlighten treintjes die binnen <strong>± 5%</strong> van jouw doeltempo starten.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={24}
                  aria-label="Uren"
                  className="w-16 font-mono tabular-nums text-center"
                  value={filterHours}
                  onChange={(e) => {
                    setFilterHours(e.target.value);
                    setUseFilter(true);
                  }}
                />
                <span className="text-xs text-muted-foreground font-medium">u</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  aria-label="Minuten"
                  className="w-16 font-mono tabular-nums text-center"
                  value={filterMinutes}
                  onChange={(e) => {
                    setFilterMinutes(e.target.value);
                    setUseFilter(true);
                  }}
                />
                <span className="text-xs text-muted-foreground font-medium">min</span>
              </div>

              <Button
                type="button"
                size="sm"
                variant={useFilter ? "default" : "outline"}
                onClick={() => setUseFilter(!useFilter)}
                className={
                  useFilter
                    ? isRun
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                    : ""
                }
              >
                {useFilter ? "Match actief" : "Check match"}
              </Button>
            </div>
          </div>

          {useFilter && desiredSeconds > 0 && !hasAnyMatch && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg border border-dashed bg-muted/40 p-4 sm:flex-row sm:items-center">
              <div className="text-sm">
                <p className="font-medium">
                  Nog geen treintje rond{" "}
                  <span className="font-mono tabular-nums font-semibold">
                    {formatSecondsToClock(desiredSeconds)}
                  </span>{" "}
                  ({formatPaceFromDuration(desiredSeconds, distanceKm, sport)})
                </p>
                <p className="text-xs text-muted-foreground">
                  Wees de eerste en verzamel lopers of fietsers in jouw startvak.
                </p>
              </div>
              <Button size="sm" onClick={openCreateWithFilterTime}>
                <Plus className="mr-1.5 h-4 w-4" />
                Start treintje voor {formatSecondsToClock(desiredSeconds)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. HEADER + KNOP OM ZELF TREINTJE TE STARTEN */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5" />
          Actieve Pace-Treintjes ({trains.length})
        </h3>

        <Button
          size="sm"
          variant={showCreateForm ? "ghost" : "default"}
          onClick={() => {
            if (!user) {
              router.push(`/login?next=${encodeURIComponent(returnPath)}`);
              return;
            }
            setShowCreateForm(!showCreateForm);
          }}
        >
          {user ? (
            <>
              <Plus className="mr-1.5 h-4 w-4" />
              {showCreateForm ? "Annuleren" : "Start nieuw treintje"}
            </>
          ) : (
            <>
              <LogIn className="mr-1.5 h-4 w-4" />
              Log in om treintje te starten
            </>
          )}
        </Button>
      </div>

      {/* 3. FORMULIER: NIEUW TREINTJE STARTEN */}
      {showCreateForm && (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Start een nieuw pace-treintje</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTrain} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Jouw voornaam *</label>
                <Input
                  required
                  placeholder="Bijv. Niels"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Streeftijd (uur : min) *</label>
                <div className="flex items-center gap-2">
                  <Input
                    required
                    type="number"
                    min={0}
                    max={24}
                    className="w-20 font-mono tabular-nums"
                    value={createHours}
                    onChange={(e) => setCreateHours(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">uur</span>
                  <Input
                    required
                    type="number"
                    min={0}
                    max={59}
                    className="w-20 font-mono tabular-nums"
                    value={createMinutes}
                    onChange={(e) => setCreateMinutes(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  Concreet verzamelpunt & tijd *
                </label>
                <Input
                  required
                  placeholder="Bijv. 15 min voor start links vooraan in Startvak B (bij de vlag)"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium">Spelregels onderweg</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRuleType("no_drop")}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition-colors ${
                      ruleType === "no_drop"
                        ? "border-emerald-600 bg-emerald-50/60"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-foreground">
                        Samen uit, samen thuis (No-drop)
                      </span>
                      <span className="text-muted-foreground">
                        We houden rekening met elkaar en wachten bij drankposten of klimmetjes.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRuleType("own_pace")}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition-colors ${
                      ruleType === "own_pace"
                        ? "border-foreground bg-muted/60"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <Flag className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                    <div>
                      <span className="block font-semibold text-foreground">
                        Strak op schema
                      </span>
                      <span className="text-muted-foreground">
                        We starten samen op doeltempo; wie lost of versnelt gaat op eigen tempo door.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Opslaan..." : "Treintje publiceren & bewaren"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 4. LIJST MET PACE-TREINTJES */}
      {sortedTrains.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">
              Er zijn nog geen pace-treintjes aangemaakt voor deze wedstrijd.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Klik hierboven op &ldquo;Start nieuw treintje&rdquo; om jouw streeftijd te plaatsen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedTrains.map((train) => {
            const matched = isMatch(train.target_duration_seconds);
            const isJoined = joinedTrainIds.includes(train.id);
            const myGuests = guestCountByTrain[train.id] ?? 0;
            const extraGuests = totalGuestsByTrain[train.id] ?? 0;
            const totalHeadcount = train.participants.length + extraGuests;
            const paceText = formatPaceFromDuration(
              train.target_duration_seconds,
              distanceKm,
              sport
            );

            return (
              <Card
                key={train.id}
                className={`flex flex-col justify-between transition-all ${
                  matched ? "ring-2 ring-emerald-600 shadow-sm" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-2xl font-bold">
                        {formatSecondsToClock(train.target_duration_seconds)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`font-mono tabular-nums ${
                          isRun
                            ? "bg-orange-100 text-orange-800"
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {paceText}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {matched && (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Beste match
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddToCalendar(train)}
                        title="Zet in mijn agenda (.ics)"
                        className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Agenda</span>
                      </Button>
                    </div>
                  </div>

                  {/* Spelregel badge */}
                  <div>
                    {train.rule_type === "no_drop" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Samen uit, samen thuis
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Strak op schema
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  {/* Verzamelpunt */}
                  <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs">
                    <MapPin className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Verzamelpunt: </span>
                      <span className="text-muted-foreground">{train.meeting_point}</span>
                    </div>
                  </div>

                  {/* Deelnemers incl. introducees */}
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Meelopers / meerijders ({totalHeadcount}
                      {extraGuests > 0 ? ` · incl. ${extraGuests} introducee` : ""}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {train.participants.map((person, idx) => (
                        <span
                          key={`${train.id}-${idx}`}
                          className="inline-flex items-center rounded-md border bg-background px-2 py-0.5 text-xs font-medium"
                        >
                          {person}
                          {idx === 0 && (
                            <span className="ml-1 text-[10px] text-muted-foreground">(starter)</span>
                          )}
                          {person === profileName && myGuests > 0 && (
                            <span className="ml-1.5 rounded bg-orange-100 px-1 text-[10px] font-bold text-orange-800">
                              +{myGuests}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-3">
                  {isJoined ? (
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        In Clubhuis
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant={myGuests > 0 ? "secondary" : "outline"}
                          size="sm"
                          disabled={busyTrainId === train.id}
                          onClick={() => handleToggleGuest(train)}
                          className="h-8 text-xs gap-1"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {myGuests > 0 ? "Met +1 introducee" : "+1 Introducee"}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busyTrainId === train.id}
                          onClick={() => handleLeaveTrain(train)}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                          title="Afmelden bij treintje"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyTrainId === train.id}
                      className="w-full"
                      onClick={() => handleJoinTrain(train)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {user
                        ? busyTrainId === train.id
                          ? "Aanmelden..."
                          : "Haak aan & zet in Clubhuis"
                        : "Log in & haak aan"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}