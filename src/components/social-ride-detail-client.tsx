"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { downloadCalendarIcs } from "@/lib/calendar";
import { ShareInviteButton } from "@/components/share-invite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Bike,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Coffee,
  Compass,
  Download,
  ExternalLink,
  Flag,
  Footprints,
  Info,
  MapPin,
  Mountain,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type {
  SocialRideGroup,
  SocialRideItem,
  SocialRideParticipant,
} from "@/components/social-agenda-client";

type Props = {
  ride: SocialRideItem;
  initialParticipants: SocialRideParticipant[];
  mapEmbedUrl: string | null;
};

const AVAILABLE_VIBE_TAGS = [
  "☕ Koffiestop halverwege",
  "☕ Koffiestop na afloop",
  "🛡️ No-drop (samen uit, samen thuis)",
  "⚡ Kop-over-kop training",
  "⛰️ Klimtraining",
  "🌅 Vroege vogel rit",
];

function toDatetimeLocalValue(isoString: string) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function getRuleExplanations(ride: SocialRideItem) {
  const explanations: {
    title: string;
    description: string;
    icon: "shield" | "zap" | "coffee" | "mountain";
  }[] = [];

  const hasNoDrop =
    ride.groups.some((g) => g.no_drop) ||
    ride.vibe_tags.some((t) => t.toLowerCase().includes("no-drop"));

  if (hasNoDrop) {
    explanations.push({
      title: "Samen uit, samen thuis (No-drop)",
      description:
        "Niemand wordt achtergelaten. Bovenop klimmetjes, na kruispunten of bij een lekke band/veter strikken houdt de groep in zodat iedereen weer netjes kan aansluiten.",
      icon: "shield",
    });
  } else {
    explanations.push({
      title: "Eigen tempo / Strak op schema",
      description:
        "We starten gezamenlijk op het aangegeven doeltempo. Kun je het tempo niet meer volgen of wil je harder, dan rijd of loop je op eigen verantwoordelijkheid door.",
      icon: "zap",
    });
  }

  if (ride.vibe_tags.some((t) => t.toLowerCase().includes("kop-over-kop"))) {
    explanations.push({
      title: "Kop-over-kop training",
      description:
        "We wisselen regelmatig van koppositie zodat iedereen uit de wind zit en het werk eerlijk verdeeld wordt. Houd een strak, voorspelbaar tempo aan als je op kop komt.",
      icon: "zap",
    });
  }

  if (ride.vibe_tags.some((t) => t.toLowerCase().includes("koffiestop"))) {
    explanations.push({
      title: "Koffiestop inbegrepen",
      description:
        "Neem een pinpas of telefoon mee: we pauzeren gezamenlijk bij een café langs de route of bij de finish voor koffie en iets lekkers.",
      icon: "coffee",
    });
  }

  if (ride.vibe_tags.some((t) => t.toLowerCase().includes("klimtraining"))) {
    explanations.push({
      title: "Klimtraining (eigen inspanning bergop)",
      description:
        "Op de beklimmingen rijdt of loopt iedereen in zijn eigen hartslag- of vermogenszone omhoog. Bovenaan verzamelen we weer voordat we samen verdergaan.",
      icon: "mountain",
    });
  }

  return explanations;
}

export function SocialRideDetailClient({
  ride: initialRide,
  initialParticipants,
  mapEmbedUrl,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [ride, setRide] = useState<SocialRideItem>(initialRide);
  const isRun = ride.sport === "run";

  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [participants, setParticipants] =
    useState<SocialRideParticipant[]>(initialParticipants);
  const [busy, setBusy] = useState(false);

  // Bewerk-modus state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialRide.title);
  const [editDate, setEditDate] = useState(
    toDatetimeLocalValue(initialRide.ride_date)
  );
  const [editDistance, setEditDistance] = useState(
    String(initialRide.distance_km)
  );
  const [editLocation, setEditLocation] = useState(initialRide.start_location);
  const [editTags, setEditTags] = useState<string[]>(initialRide.vibe_tags);
  const [editTerrain, setEditTerrain] = useState(
    initialRide.terrain_summary ?? ""
  );
  const [editGpxUrl, setEditGpxUrl] = useState(initialRide.gpx_url ?? "");
  const [editGroups, setEditGroups] = useState<
    { id?: string; group_name: string; pace_label: string; no_drop: boolean }[]
  >(
    initialRide.groups.map((g) => ({
      id: g.id,
      group_name: g.group_name,
      pace_label: g.pace_label,
      no_drop: g.no_drop,
    }))
  );
  const [savingEdit, setSavingEdit] = useState(false);

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

  const isOwner = Boolean(user && ride.creator_id === user.id);

  const myEntry = user
    ? participants.find((p) => p.user_id === user.id)
    : undefined;

  const totalHeads = participants.reduce(
    (sum, p) => sum + 1 + (p.guest_count ?? 0),
    0
  );

  function toggleEditTag(tag: string) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;

    const validGroups = editGroups.filter(
      (g) => g.group_name.trim() && g.pace_label.trim()
    );
    if (
      !editTitle.trim() ||
      !editDate ||
      !editLocation.trim() ||
      validGroups.length === 0
    ) {
      return;
    }

    setSavingEdit(true);

    const updatedIsoDate = new Date(editDate).toISOString();
    const updatedDistance = Number(editDistance) || ride.distance_km;

    const { error: updateError } = await supabase
      .from("social_rides")
      .update({
        title: editTitle.trim(),
        ride_date: updatedIsoDate,
        distance_km: updatedDistance,
        start_location: editLocation.trim(),
        vibe_tags: editTags,
        terrain_summary: editTerrain.trim() || null,
        gpx_url: editGpxUrl.trim() || null,
      })
      .eq("id", ride.id);

    if (updateError) {
      setSavingEdit(false);
      alert("Opslaan mislukt. Controleer of je de SQL-rechten hebt uitgevoerd.");
      return;
    }

    // Verwijder groepen die in het formulier zijn weggehaald
    const keptIds = validGroups.map((g) => g.id).filter(Boolean) as string[];
    const removedIds = ride.groups
      .map((g) => g.id)
      .filter((id) => !keptIds.includes(id));

    if (removedIds.length > 0) {
      await supabase
        .from("social_ride_groups")
        .delete()
        .in("id", removedIds);
    }

    // Werk bestaande groepen bij en voeg nieuwe groepen toe
    const updatedGroupsList: SocialRideGroup[] = [];

    for (let i = 0; i < validGroups.length; i++) {
      const grp = validGroups[i];
      if (grp.id) {
        const { data: updatedGrp } = await supabase
          .from("social_ride_groups")
          .update({
            group_name: grp.group_name.trim(),
            pace_label: grp.pace_label.trim(),
            no_drop: grp.no_drop,
            sort_order: i + 1,
          })
          .eq("id", grp.id)
          .select()
          .single();

        if (updatedGrp) {
          updatedGroupsList.push(updatedGrp as SocialRideGroup);
        }
      } else {
        const { data: insertedGrp } = await supabase
          .from("social_ride_groups")
          .insert({
            ride_id: ride.id,
            group_name: grp.group_name.trim(),
            pace_label: grp.pace_label.trim(),
            no_drop: grp.no_drop,
            sort_order: i + 1,
          })
          .select()
          .single();

        if (insertedGrp) {
          updatedGroupsList.push(insertedGrp as SocialRideGroup);
        }
      }
    }

    setRide((prev) => ({
      ...prev,
      title: editTitle.trim(),
      ride_date: updatedIsoDate,
      distance_km: updatedDistance,
      start_location: editLocation.trim(),
      vibe_tags: editTags,
      terrain_summary: editTerrain.trim() || null,
      gpx_url: editGpxUrl.trim() || null,
      groups: updatedGroupsList,
    }));

    setSavingEdit(false);
    setIsEditing(false);
    router.refresh();
  }

  async function handleDeleteRide() {
    if (!isOwner) return;
    if (!confirm("Weet je zeker dat je deze rit wilt verwijderen?")) return;

    const { error } = await supabase
      .from("social_rides")
      .delete()
      .eq("id", ride.id);

    if (!error) {
      router.push("/social");
      router.refresh();
    }
  }

  async function handleJoinGroup(groupId: string) {
    if (!user) {
      router.push(`/login?next=/social/${ride.id}`);
      return;
    }

    setBusy(true);

    if (myEntry) {
      const { error } = await supabase
        .from("social_ride_participants")
        .update({ group_id: groupId })
        .eq("id", myEntry.id);

      if (!error) {
        setParticipants((prev) =>
          prev.map((p) => (p.id === myEntry.id ? { ...p, group_id: groupId } : p))
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

    setBusy(false);
    router.refresh();
  }

  async function handleToggleGuest() {
    if (!user || !myEntry) return;
    const nextGuests = myEntry.guest_count > 0 ? 0 : 1;
    setBusy(true);

    const { error } = await supabase
      .from("social_ride_participants")
      .update({ guest_count: nextGuests })
      .eq("id", myEntry.id);

    if (!error) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === myEntry.id ? { ...p, guest_count: nextGuests } : p
        )
      );
    }

    setBusy(false);
    router.refresh();
  }

  async function handleLeaveRide() {
    if (!user || !myEntry) return;
    setBusy(true);

    const { error } = await supabase
      .from("social_ride_participants")
      .delete()
      .eq("id", myEntry.id);

    if (!error) {
      setParticipants((prev) => prev.filter((p) => p.id !== myEntry.id));
    }

    setBusy(false);
    router.refresh();
  }

  const explanations = getRuleExplanations(ride);
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ride.start_location
  )}`;

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20">
      {/* 1. HERO HEADER */}
      <section
        className={`border-b bg-white pt-8 pb-10 border-t-4 ${
          isRun ? "border-t-orange-500" : "border-t-teal-600"
        }`}
      >
        <div className="container mx-auto max-w-5xl px-4 space-y-5">
          <Link
            href="/social"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar Social Agenda
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-3">
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
                  <Footprints className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Bike className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isRun ? "Social Run" : "Social Rit"} · {ride.distance_km} km
              </Badge>

              {ride.event && (
                <Link
                  href={
                    ride.event.slug
                      ? `/wedstrijden/${ride.event.slug}`
                      : "/wedstrijden"
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-950 hover:bg-amber-200 transition-colors"
                >
                  <Flag className="h-3 w-3 text-amber-700" />
                  Voorbereiding: {ride.event.title}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isOwner && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing((v) => !v)}
                    className="gap-1.5 bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
                  >
                    {isEditing ? (
                      <>
                        <X className="h-3.5 w-3.5" />
                        Sluit bewerken
                      </>
                    ) : (
                      <>
                        <Pencil className="h-3.5 w-3.5" />
                        Rit aanpassen
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteRide}
                    className="px-2.5 text-slate-400 hover:text-destructive"
                    title="Rit verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}

              <ShareInviteButton
                title={ride.title}
                path={`/social/${ride.id}`}
                inviteText={`Wie ${isRun ? "loopt" : "rijdt"} er mee met "${ride.title}" (${ride.distance_km} km vanaf ${ride.start_location})? Kies hier je tempogroep:`}
              />

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
                className="gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <CalendarPlus className="h-4 w-4 text-slate-500" />
                Zet in mijn agenda
              </Button>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
            {ride.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
              <Calendar
                className={`h-4 w-4 ${
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
              <MapPin className="h-4 w-4 text-slate-400" />
              {ride.start_location}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              {totalHeads} aanmelding(en) · Organisatie:{" "}
              <strong>{ride.creator_name}</strong>
            </span>
          </div>

          {ride.vibe_tags && ride.vibe_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {ride.vibe_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. BEWERK-FORMULIER (ALLEEN ZICHTBAAR VOOR EIGENAAR NA KLIKKEN OP "RIT AANPASSEN") */}
      {isEditing && isOwner && (
        <section className="container mx-auto max-w-5xl px-4 pt-8">
          <Card className="border-2 border-slate-300 bg-white shadow-md">
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-lg text-slate-900">
                Rit-gegevens & tempogroepen aanpassen
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Titel *
                    </label>
                    <Input
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Datum & starttijd *
                    </label>
                    <Input
                      required
                      type="datetime-local"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
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
                      value={editDistance}
                      onChange={(e) => setEditDistance(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Startlocatie *
                    </label>
                    <Input
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Sfeer- & spelregel-tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VIBE_TAGS.map((tag) => {
                      const active = editTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleEditTag(tag)}
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

                {/* Tempogroepen bewerken */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">
                      Tempogroepen / Pelotons *
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-white"
                      onClick={() =>
                        setEditGroups((prev) => [
                          ...prev,
                          {
                            group_name: `Groep ${String.fromCharCode(
                              65 + prev.length
                            )}`,
                            pace_label: isRun ? "5:15 /km" : "27–29 km/u",
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
                    {editGroups.map((grp, idx) => (
                      <div
                        key={grp.id ?? idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200"
                      >
                        <Input
                          className="sm:col-span-5 h-8 text-xs"
                          value={grp.group_name}
                          onChange={(e) =>
                            setEditGroups((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, group_name: e.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <Input
                          className="sm:col-span-4 h-8 text-xs font-mono"
                          value={grp.pace_label}
                          onChange={(e) =>
                            setEditGroups((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, pace_label: e.target.value }
                                  : item
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
                                setEditGroups((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { ...item, no_drop: e.target.checked }
                                      : item
                                  )
                                )
                              }
                            />
                            No-drop
                          </label>
                          {editGroups.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-1.5 text-slate-400 hover:text-destructive"
                              onClick={() =>
                                setEditGroups((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
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

                {/* Route & GPX */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Route- & terreinomschrijving
                    </label>
                    <Input
                      value={editTerrain}
                      onChange={(e) => setEditTerrain(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      GPX- of Komoot/Strava-link
                    </label>
                    <Input
                      type="url"
                      value={editGpxUrl}
                      onChange={(e) => setEditGpxUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuleren
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    {savingEdit ? "Opslaan..." : "Wijzigingen opslaan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 3. HOOFDCONTENT: LINKS TEMPOGROEPEN + ROUTE, RECHTS KAART & SPELREGEL-UITLEG */}
      <main className="container mx-auto max-w-5xl px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Linkerkolom (7 cols): Tempogroepen & Route */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/70">
              <CardTitle className="text-lg text-slate-900">
                Kies jouw tempogroep ({ride.groups.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {ride.groups.map((grp) => {
                const grpMembers = participants.filter(
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
                    className={`rounded-xl border p-4 space-y-3 transition-all ${
                      isInThisGroup
                        ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30"
                        : "border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-base text-slate-900">
                          {grp.group_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {grp.no_drop
                            ? "Samen uit, samen thuis (No-drop)"
                            : "Strak op tempo (eigen verantwoordelijkheid)"}
                        </p>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`font-mono text-sm font-semibold ${
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
                          Nog geen aanmeldingen in dit vak — wees de eerste!
                        </span>
                      ) : (
                        grpMembers.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-800 shadow-2xs"
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

                    <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        {grpHeadcount} sporter(s) in deze groep
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
                            disabled={busy}
                            onClick={handleToggleGuest}
                            className="h-8 bg-white text-xs gap-1 border-slate-300"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            {(myEntry?.guest_count ?? 0) > 0
                              ? "Met +1 introducee"
                              : "+1 Introducee"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={handleLeaveRide}
                            className="h-8 px-2 text-xs text-slate-500 hover:text-destructive"
                            title="Afmelden"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleJoinGroup(grp.id)}
                          className={`h-8 text-xs gap-1.5 text-white ${
                            isRun
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "bg-teal-600 hover:bg-teal-700"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {user
                            ? myEntry
                              ? "Wissel naar dit vak"
                              : "Sluit aan bij deze groep"
                            : "Log in & sluit aan"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Route & Terrein omschrijving */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/70">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Compass className="h-5 w-5 text-slate-700" />
                Over de route &amp; het parcours
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                {ride.terrain_summary ||
                  "De organisator heeft nog geen uitgebreide routebeschrijving toegevoegd. We verzamelen op de aangegeven startlocatie en rijden/lopen gezamenlijk de geplande afstand."}
              </p>

              {ride.gpx_url && (
                <a
                  href={ride.gpx_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Bekijk / download GPX-route
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rechterkolom (5 cols): Exacte Startlocatie Kaart + Uitleg spelregels */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-3">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <MapPin
                  className={`h-4 w-4 ${
                    isRun ? "text-orange-600" : "text-teal-600"
                  }`}
                />
                Exacte startlocatie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {mapEmbedUrl ? (
                <div className="aspect-video w-full border-b bg-slate-100">
                  <iframe
                    title={`Kaart van ${ride.start_location}`}
                    src={mapEmbedUrl}
                    className="h-full w-full border-0"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center border-b bg-slate-100 px-6 text-center text-xs text-slate-500">
                  <MapPin className="mb-2 h-6 w-6 text-slate-400" />
                  Kaartvoorbeeld kon niet direct op adres worden geladen. Open de locatie hieronder in Google Maps.
                </div>
              )}

              <div className="p-4 space-y-3">
                <p className="text-xs font-medium text-slate-800">
                  {ride.start_location}
                </p>
                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Google Maps (navigatie)
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-3">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-700" />
                Wat betekenen de afspraken?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {explanations.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="mt-0.5 shrink-0">
                    {item.icon === "shield" && (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    )}
                    {item.icon === "zap" && (
                      <Zap className="h-4 w-4 text-amber-600" />
                    )}
                    {item.icon === "coffee" && (
                      <Coffee className="h-4 w-4 text-orange-600" />
                    )}
                    {item.icon === "mountain" && (
                      <Mountain className="h-4 w-4 text-teal-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}