"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { downloadCalendarIcs } from "@/lib/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bike,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Compass,
  Download,
  Flag,
  Footprints,
  LogIn,
  MapPin,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

export type SocialRideGroup = {
  id: string;
  ride_id: string;
  group_name: string;
  pace_label: string;
  no_drop: boolean;
  sort_order: number;
};

export type SocialRideParticipant = {
  id: string;
  group_id: string;
  ride_id: string;
  user_id: string;
  participant_name: string;
  guest_count: number;
};

export type SocialRideItem = {
  id: string;
  creator_id: string | null;
  creator_name: string;
  event_id: string | null;
  club_id?: string | null;
  sport: "run" | "ride";
  title: string;
  ride_date: string;
  distance_km: number;
  start_location: string;
  vibe_tags: string[];
  terrain_summary: string | null;
  gpx_url: string | null;
  event?: {
    slug: string;
    title: string;
  } | null;
  club?: {
    slug: string;
    name: string;
  } | null;
  groups: SocialRideGroup[];
};

type EventOption = {
  id: string;
  title: string;
  sport: "run" | "ride";
};

type ClubOption = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  initialRides: SocialRideItem[];
  initialParticipants: SocialRideParticipant[];
  eventsList: EventOption[];
  clubsList?: ClubOption[];
};

const AVAILABLE_VIBE_TAGS = [
  "☕ Koffiestop halverwege",
  "☕ Koffiestop na afloop",
  "🛡️ No-drop (samen uit, samen thuis)",
  "⚡ Kop-over-kop training",
  "⛰️ Klimtraining",
  "🌅 Vroege vogel rit",
];

export function SocialAgendaClient({
  initialRides,
  initialParticipants,
  eventsList,
  clubsList = [],
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string>("");

  const [rides, setRides] = useState<SocialRideItem[]>(initialRides);
  const [participants, setParticipants] =
    useState<SocialRideParticipant[]>(initialParticipants);
  const [sportFilter, setSportFilter] = useState<"all" | "run" | "ride">("all");
  const [busyRideId, setBusyRideId] = useState<string | null>(null);

  // Aanmaakformulier state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sport, setSport] = useState<"run" | "ride">("ride");
  const [title, setTitle] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [distanceKm, setDistanceKm] = useState("85");
  const [startLocation, setStartLocation] = useState("");
  const [eventId, setEventId] = useState("");
  const [clubId, setClubId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "☕ Koffiestop halverwege",
    "🛡️ No-drop (samen uit, samen thuis)",
  ]);
  const [terrainSummary, setTerrainSummary] = useState("");
  const [gpxUrl, setGpxUrl] = useState("");
  const [draftGroups, setDraftGroups] = useState<
    { group_name: string; pace_label: string; no_drop: boolean }[]
  >([
    { group_name: "Groep A (Doorrijders)", pace_label: "32–34 km/u", no_drop: false },
    { group_name: "Groep B (Samen uit, samen thuis)", pace_label: "28–30 km/u", no_drop: true },
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser ?? null);
      if (!currentUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .single();

      setProfileName(
        profile?.full_name || currentUser.email?.split("@")[0] || "Sporter"
      );
    }
    loadUser();
  }, [supabase]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSwitchCreateSport(nextSport: "run" | "ride") {
    setSport(nextSport);
    if (nextSport === "run") {
      setDistanceKm("15");
      setDraftGroups([
        { group_name: "Tempo Groep 1", pace_label: "4:45–5:00 min/km", no_drop: true },
        { group_name: "Tempo Groep 2", pace_label: "5:25–5:40 min/km", no_drop: true },
      ]);
    } else {
      setDistanceKm("85");
      setDraftGroups([
        { group_name: "Peloton A", pace_label: "32–34 km/u", no_drop: false },
        { group_name: "Peloton B", pace_label: "28–30 km/u", no_drop: true },
      ]);
    }
  }

  async function handleCreateRide(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login?next=/social");
      return;
    }

    const validGroups = draftGroups.filter(
      (g) => g.group_name.trim() && g.pace_label.trim()
    );
    if (!title.trim() || !rideDate || !startLocation.trim() || validGroups.length === 0) {
      return;
    }

    setCreating(true);
    const authorName = profileName || "Sporter";

    const { data: createdRide, error: rideError } = await supabase
      .from("social_rides")
      .insert({
        creator_id: user.id,
        creator_name: authorName,
        event_id: eventId || null,
        club_id: clubId || null,
        sport,
        title: title.trim(),
        ride_date: new Date(rideDate).toISOString(),
        distance_km: Number(distanceKm) || 10,
        start_location: startLocation.trim(),
        vibe_tags: selectedTags,
        terrain_summary: terrainSummary.trim() || null,
        gpx_url: gpxUrl.trim() || null,
      })
      .select()
      .single();

    if (rideError || !createdRide) {
      setCreating(false);
      alert("Kon social rit niet aanmaken.");
      return;
    }

    const groupsToInsert = validGroups.map((g, index) => ({
      ride_id: createdRide.id,
      group_name: g.group_name.trim(),
      pace_label: g.pace_label.trim(),
      no_drop: g.no_drop,
      sort_order: index + 1,
    }));

    const { data: createdGroups } = await supabase
      .from("social_ride_groups")
      .insert(groupsToInsert)
      .select();

    const groupsList = (createdGroups as SocialRideGroup[]) ?? [];

    if (groupsList.length > 0) {
      const { data: firstMember } = await supabase
        .from("social_ride_participants")
        .insert({
          ride_id: createdRide.id,
          group_id: groupsList[0].id,
          user_id: user.id,
          participant_name: authorName,
          guest_count: 0,
        })
        .select()
        .single();

      if (firstMember) {
        setParticipants((prev) => [...prev, firstMember as SocialRideParticipant]);
      }
    }

    const linkedEvent = eventsList.find((ev) => ev.id === eventId);
    const linkedClub = clubsList.find((cl) => cl.id === clubId);

    setRides((prev) => [
      {
        ...(createdRide as SocialRideItem),
        event: linkedEvent ? { slug: "", title: linkedEvent.title } : null,
        club: linkedClub ? { slug: linkedClub.slug, name: linkedClub.name } : null,
        groups: groupsList,
      },
      ...prev,
    ]);

    setCreating(false);
    setShowCreateForm(false);
    setTitle("");
    setTerrainSummary("");
    setGpxUrl("");
    router.refresh();
  }

  async function handleJoinGroup(ride: SocialRideItem, groupId: string) {
    if (!user) {
      router.push("/login?next=/social");
      return;
    }

    setBusyRideId(ride.id);
    const existing = participants.find(
      (p) => p.ride_id === ride.id && p.user_id === user.id
    );

    if (existing) {
      const { error } = await supabase
        .from("social_ride_participants")
        .update({ group_id: groupId })
        .eq("id", existing.id);

      if (!error) {
        setParticipants((prev) =>
          prev.map((p) => (p.id === existing.id ? { ...p, group_id: groupId } : p))
        );
      }
    } else {
      const { data, error } = await supabase
        .from("social_ride_participants")
        .insert({
          ride_id: ride.id,
          group_id: groupId,
          user_id: user.id,
          participant_name: profileName || "Sporter",
          guest_count: 0,
        })
        .select()
        .single();

      if (!error && data) {
        setParticipants((prev) => [...prev, data as SocialRideParticipant]);
      }
    }

    setBusyRideId(null);
  }

  async function handleToggleGuest(rideId: string) {
    if (!user) return;
    const existing = participants.find(
      (p) => p.ride_id === rideId && p.user_id === user.id
    );
    if (!existing) return;

    const nextGuests = existing.guest_count > 0 ? 0 : 1;
    setBusyRideId(rideId);

    const { error } = await supabase
      .from("social_ride_participants")
      .update({ guest_count: nextGuests })
      .eq("id", existing.id);

    if (!error) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === existing.id ? { ...p, guest_count: nextGuests } : p
        )
      );
    }

    setBusyRideId(null);
  }

  async function handleLeaveRide(rideId: string) {
    if (!user) return;
    setBusyRideId(rideId);

    const { error } = await supabase
      .from("social_ride_participants")
      .delete()
      .eq("ride_id", rideId)
      .eq("user_id", user.id);

    if (!error) {
      setParticipants((prev) =>
        prev.filter((p) => !(p.ride_id === rideId && p.user_id === user.id))
      );
    }

    setBusyRideId(null);
  }

  async function handleDeleteRide(rideId: string) {
    const { error } = await supabase.from("social_rides").delete().eq("id", rideId);
    if (!error) {
      setRides((prev) => prev.filter((r) => r.id !== rideId));
    }
  }

  const visibleRides = rides.filter((r) =>
    sportFilter === "all" ? true : r.sport === sportFilter
  );

  return (
    <div className="space-y-8">
      {/* 1. FILTERBALK + KNOP NIEUWE RIT */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={sportFilter === "all" ? "default" : "ghost"}
            onClick={() => setSportFilter("all")}
            className={sportFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600"}
          >
            Alles ({rides.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sportFilter === "run" ? "default" : "ghost"}
            onClick={() => setSportFilter("run")}
            className={
              sportFilter === "run"
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
            }
          >
            <Footprints className="mr-1.5 h-3.5 w-3.5" />
            Hardlopen
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sportFilter === "ride" ? "default" : "ghost"}
            onClick={() => setSportFilter("ride")}
            className={
              sportFilter === "ride"
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
            }
          >
            <Bike className="mr-1.5 h-3.5 w-3.5" />
            Wielrennen
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            if (!user) {
              router.push("/login?next=/social");
              return;
            }
            setShowCreateForm((v) => !v);
          }}
          className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
        >
          {user ? (
            <>
              <Plus className="h-4 w-4" />
              {showCreateForm ? "Sluiten" : "Nieuwe rit / run plaatsen"}
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Log in om rit te plaatsen
            </>
          )}
        </Button>
      </div>

      {/* 2. FORMULIER: NIEUWE SOCIAL RIT MET MEERDERE TEMPOGROEPEN */}
      {showCreateForm && (
        <Card className="border-2 border-slate-300 bg-white shadow-md">
          <CardHeader className="border-b bg-slate-50/80">
            <CardTitle className="text-lg text-slate-900">
              Nieuwe Social Rit of Duurloop plaatsen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateRide} className="space-y-5">
              {/* Sportkeuze */}
              <div className="grid grid-cols-2 gap-2 max-w-xs">
                <Button
                  type="button"
                  size="sm"
                  variant={sport === "run" ? "default" : "outline"}
                  className={sport === "run" ? "bg-orange-600 text-white" : ""}
                  onClick={() => handleSwitchCreateSport("run")}
                >
                  <Footprints className="mr-1.5 h-4 w-4" />
                  Hardlopen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={sport === "ride" ? "default" : "outline"}
                  className={sport === "ride" ? "bg-teal-600 text-white" : ""}
                  onClick={() => handleSwitchCreateSport("ride")}
                >
                  <Bike className="mr-1.5 h-4 w-4" />
                  Wielrennen
                </Button>
              </div>

              {/* Basisgegevens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Titel van de rit / run *
                  </label>
                  <Input
                    required
                    placeholder="Bijv. Zondagochtend Koffierit Sallandse Heuvelrug"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Namens een Club / Hub (optioneel)
                  </label>
                  <select
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="">Persoonlijke rit / run</option>
                    {clubsList.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        Club: {cl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Doel-koppeling aan wedstrijd (optioneel)
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="">Geen specifieke wedstrijd</option>
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        Voorbereiding: {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Datum & starttijd *
                  </label>
                  <Input
                    required
                    type="datetime-local"
                    value={rideDate}
                    onChange={(e) => setRideDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Afstand (km) *
                  </label>
                  <Input
                    required
                    type="number"
                    step="0.5"
                    className="font-mono"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Startlocatie *
                  </label>
                  <Input
                    required
                    placeholder="Bijv. Parkeerplaats Nijverdal-Zuid of Station Enschede"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Sfeer & Spelregel-tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Sfeer- & spelregel-tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VIBE_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tempogroepen (Pelotons) */}
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Tempogroepen / Pelotons *
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Bied 1 of meerdere tempovakken aan zodat iedereen op eigen niveau aansluit.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-white"
                    onClick={() =>
                      setDraftGroups((prev) => [
                        ...prev,
                        {
                          group_name: `Groep ${String.fromCharCode(65 + prev.length)}`,
                          pace_label: sport === "run" ? "5:15 /km" : "27–29 km/u",
                          no_drop: true,
                        },
                      ])
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Groep toevoegen
                  </Button>
                </div>

                <div className="space-y-2">
                  {draftGroups.map((grp, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200"
                    >
                      <Input
                        className="sm:col-span-5 h-8 text-xs"
                        placeholder="Naam (bijv. Groep A)"
                        value={grp.group_name}
                        onChange={(e) =>
                          setDraftGroups((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, group_name: e.target.value } : item
                            )
                          )
                        }
                      />
                      <Input
                        className="sm:col-span-4 h-8 text-xs font-mono"
                        placeholder={sport === "run" ? "4:45–5:00 /km" : "30–32 km/u"}
                        value={grp.pace_label}
                        onChange={(e) =>
                          setDraftGroups((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, pace_label: e.target.value } : item
                            )
                          )
                        }
                      />
                      <div className="sm:col-span-3 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={grp.no_drop}
                            onChange={(e) =>
                              setDraftGroups((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, no_drop: e.target.checked } : item
                                )
                              )
                            }
                          />
                          No-drop
                        </label>
                        {draftGroups.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-slate-400 hover:text-destructive"
                            onClick={() =>
                              setDraftGroups((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route-preview & optionele GPX-link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Route- & terreinomschrijving (optioneel)
                  </label>
                  <Input
                    placeholder="Bijv. Glooiend over de Holterberg (± 500 hm), volledig asfalt"
                    value={terrainSummary}
                    onChange={(e) => setTerrainSummary(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    GPX- of Komoot/Strava-routelink (optioneel)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={gpxUrl}
                    onChange={(e) => setGpxUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {creating ? "Publiceren..." : "Rit publiceren"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 3. OVERZICHT VAN ALLE SOCIAL RITTEN & RUNS */}
      {visibleRides.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Geen geplande ritten of runs gevonden voor dit filter.
            </p>
            <p className="text-xs text-slate-500">
              Klik rechtsboven op &ldquo;Nieuwe rit / run plaatsen&rdquo; om als eerste een groep te starten!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {visibleRides.map((ride) => {
            const isRun = ride.sport === "run";
            const rideMembers = participants.filter((p) => p.ride_id === ride.id);
            const myEntry = user
              ? rideMembers.find((p) => p.user_id === user.id)
              : undefined;
            const totalHeads = rideMembers.reduce(
              (sum, p) => sum + 1 + (p.guest_count ?? 0),
              0
            );

            return (
              <Card
                key={ride.id}
                className={`overflow-hidden border border-slate-200 bg-white shadow-sm border-l-4 ${
                  isRun ? "border-l-orange-500" : "border-l-teal-600"
                }`}
              >
                <CardHeader
                  className={`border-b pb-4 space-y-3 ${
                    isRun
                      ? "bg-orange-50/40 border-orange-100"
                      : "bg-teal-50/40 border-teal-100"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          isRun
                            ? "bg-orange-100 text-orange-900 border border-orange-200 font-mono"
                            : "bg-teal-100 text-teal-900 border border-teal-200 font-mono"
                        }
                      >
                        {isRun ? (
                          <Footprints className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <Bike className="mr-1 h-3.5 w-3.5" />
                        )}
                        {ride.distance_km} km
                      </Badge>

                      {ride.club && (
                        <Link
                          href={`/social/clubs/${ride.club.slug}`}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                        >
                          <Shield className="h-3 w-3 text-orange-400" />
                          {ride.club.name}
                        </Link>
                      )}

                      {ride.event && (
                        <Link
                          href={ride.event.slug ? `/wedstrijden/${ride.event.slug}` : "/wedstrijden"}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-950 hover:bg-amber-200 transition-colors"
                        >
                          <Flag className="h-3 w-3 text-amber-700" />
                          Voorbereiding: {ride.event.title}
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadCalendarIcs({
                            title: `PaceLine: ${ride.title}`,
                            startDateIso: ride.ride_date,
                            durationMinutes: 150,
                            location: ride.start_location,
                            description: `${ride.distance_km} km · Georganiseerd door ${ride.creator_name}`,
                            filename: "paceline-social-rit.ics",
                          })
                        }
                        className="h-8 gap-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 text-slate-500" />
                        Zet in agenda
                      </Button>

                      {user && ride.creator_id === user.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRide(ride.id)}
                          className="h-8 px-2 text-slate-400 hover:text-destructive"
                          title="Rit verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/social/${ride.id}`} className="group">
                        <CardTitle className="text-xl text-slate-900 group-hover:text-orange-600 transition-colors">
                          {ride.title}
                        </CardTitle>
                      </Link>
                      <Link
                        href={`/social/${ride.id}`}
                        className="text-xs font-semibold text-slate-700 hover:text-orange-600 transition-colors"
                      >
                        Meer info & kaart →
                      </Link>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                        <Calendar
                          className={`h-3.5 w-3.5 ${
                            isRun ? "text-orange-600" : "text-teal-600"
                          }`}
                        />
                        {new Date(ride.ride_date).toLocaleString("nl-NL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {ride.start_location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {totalHeads} deelnemer(s) · Door {ride.creator_name}
                      </span>
                    </div>
                  </div>

                  {ride.vibe_tags && ride.vibe_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ride.vibe_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-slate-200/80 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-2xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-5 space-y-5 bg-white">
                  {(ride.terrain_summary || ride.gpx_url) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs">
                      <div className="flex items-start gap-2.5">
                        <Compass className="h-4 w-4 shrink-0 text-slate-700 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900">Route & terrein: </span>
                          <span className="text-slate-600">
                            {ride.terrain_summary || "GPX-route beschikbaar voor deze rit."}
                          </span>
                        </div>
                      </div>

                      {ride.gpx_url && (
                        <a
                          href={ride.gpx_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Route / GPX
                        </a>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Kies jouw tempogroep ({ride.groups.length})
                    </p>

                    <div className="grid gap-3.5 md:grid-cols-2">
                      {ride.groups.map((grp) => {
                        const grpMembers = rideMembers.filter(
                          (m) => m.group_id === grp.id
                        );
                        const isInThisGroup = myEntry?.group_id === grp.id;
                        const grpHeadcount = grpMembers.reduce(
                          (sum, m) => sum + 1 + (m.guest_count ?? 0),
                          0
                        );

                        return (
                          <div
                            key={grp.id}
                            className={`rounded-xl border p-4 flex flex-col justify-between gap-3.5 transition-all ${
                              isInThisGroup
                                ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30"
                                : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  {grp.group_name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={`font-mono font-semibold ${
                                    isRun
                                      ? "bg-orange-100 text-orange-900 border border-orange-200"
                                      : "bg-teal-100 text-teal-900 border border-teal-200"
                                  }`}
                                >
                                  {grp.pace_label}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {grpMembers.length === 0 ? (
                                  <span className="text-xs text-slate-500 italic">
                                    Nog geen aanmeldingen in dit vak
                                  </span>
                                ) : (
                                  grpMembers.map((m) => (
                                    <span
                                      key={m.id}
                                      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 shadow-2xs"
                                    >
                                      {m.participant_name}
                                      {m.guest_count > 0 && (
                                        <span className="ml-1 font-bold text-orange-600">
                                          +{m.guest_count}
                                        </span>
                                      )}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-slate-600">
                                {grpHeadcount} sporter(s) ·{" "}
                                {grp.no_drop ? "No-drop" : "Eigen tempo"}
                              </span>

                              {isInThisGroup ? (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                      (myEntry?.guest_count ?? 0) > 0
                                        ? "secondary"
                                        : "outline"
                                    }
                                    disabled={busyRideId === ride.id}
                                    onClick={() => handleToggleGuest(ride.id)}
                                    className="h-7 bg-white text-xs gap-1 border-slate-300"
                                  >
                                    <UserPlus className="h-3 w-3" />
                                    {(myEntry?.guest_count ?? 0) > 0
                                      ? "+1 mee"
                                      : "+1 Introducee"}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={busyRideId === ride.id}
                                    onClick={() => handleLeaveRide(ride.id)}
                                    className="h-7 px-2 text-xs text-slate-500 hover:text-destructive"
                                    title="Afmelden"
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={busyRideId === ride.id}
                                  onClick={() => handleJoinGroup(ride, grp.id)}
                                  className="h-7 bg-white border-slate-300 text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-xs gap-1 transition-colors"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {user
                                    ? myEntry
                                      ? "Wissel naar dit vak"
                                      : "Sluit aan"
                                    : "Log in & sluit aan"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}