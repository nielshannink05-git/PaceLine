"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  MessageSquare,
  Send,
  Plus,
  User,
  Footprints,
  Bike,
  ArrowRight,
  Check,
  Trash2,
} from "lucide-react";

export type ClubTrainItem = {
  membershipId: string;
  trainId: string;
  targetTimeFormatted: string;
  paceLabel: string;
  meetingPoint: string;
  noDrop: boolean;
  event: {
    id: string;
    slug: string;
    title: string;
    sport: "run" | "ride";
    event_date: string;
    distance_km: number;
  };
};

export type TrainMessage = {
  id: string;
  train_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export type ClubTraining = {
  id: string;
  creator_id: string;
  creator_name: string;
  sport: "run" | "ride";
  title: string;
  training_date: string;
  distance_km: number;
  target_pace_or_speed: string;
  start_location: string;
  no_drop: boolean;
  event_title?: string | null;
};

type EventOption = {
  id: string;
  title: string;
  sport: "run" | "ride";
};

type Props = {
  userId: string;
  userEmail: string;
  initialProfile: {
    full_name: string;
    city: string | null;
    body_weight_kg: number | null;
  };
  myTrains: ClubTrainItem[];
  initialMessages: TrainMessage[];
  initialTrainings: ClubTraining[];
  eventsList: EventOption[];
};

export function ClubhuisClient({
  userId,
  userEmail,
  initialProfile,
  myTrains,
  initialMessages,
  initialTrainings,
  eventsList,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  // 1. Profiel state
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [city, setCity] = useState(initialProfile.city || "");
  const [weight, setWeight] = useState(String(initialProfile.body_weight_kg ?? 75));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // 2. Chat state
  const [messages, setMessages] = useState<TrainMessage[]>(initialMessages);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingTrainId, setSendingTrainId] = useState<string | null>(null);

  // 3. Training inplannen state
  const [trainings, setTrainings] = useState<ClubTraining[]>(initialTrainings);
  const [showNewTraining, setShowNewTraining] = useState(false);
  const [tSport, setTSport] = useState<"run" | "ride">("run");
  const [tTitle, setTTitle] = useState("");
  const [tDate, setTDate] = useState("");
  const [tDistance, setTDistance] = useState("15");
  const [tPace, setTPace] = useState("4:45 /km");
  const [tLocation, setTLocation] = useState("");
  const [tEventId, setTEventId] = useState("");
  const [tNoDrop, setTNoDrop] = useState(true);
  const [creatingTraining, setCreatingTraining] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingProfile(true);
    setProfileSaved(false);

    const parsedWeight = Number(weight);
    await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        city: city.trim() || null,
        body_weight_kg: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 75,
      })
      .eq("id", userId);

    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
    router.refresh();
  }

  async function handleSendMessage(trainId: string) {
    const text = (drafts[trainId] || "").trim();
    if (!text) return;

    setSendingTrainId(trainId);
    const { data, error } = await supabase
      .from("train_messages")
      .insert({
        train_id: trainId,
        user_id: userId,
        author_name: fullName.trim() || "Sporter",
        content: text,
      })
      .select()
      .single();

    setSendingTrainId(null);

    if (!error && data) {
      setMessages((prev) => [...prev, data as TrainMessage]);
      setDrafts((prev) => ({ ...prev, [trainId]: "" }));
    }
  }

  async function handleCreateTraining(e: React.FormEvent) {
    e.preventDefault();
    if (!tTitle.trim() || !tDate || !tLocation.trim()) return;

    setCreatingTraining(true);
    const parsedDist = Number(tDistance) || 10;
    const selectedEvent = eventsList.find((ev) => ev.id === tEventId);

    const { data, error } = await supabase
      .from("club_trainings")
      .insert({
        creator_id: userId,
        creator_name: fullName.trim() || "Sporter",
        event_id: tEventId || null,
        sport: tSport,
        title: tTitle.trim(),
        training_date: new Date(tDate).toISOString(),
        distance_km: parsedDist,
        target_pace_or_speed: tPace.trim(),
        start_location: tLocation.trim(),
        no_drop: tNoDrop,
      })
      .select()
      .single();

    setCreatingTraining(false);

    if (!error && data) {
      setTrainings((prev) => [
        ...prev,
        { ...(data as ClubTraining), event_title: selectedEvent?.title ?? null },
      ]);
      setTTitle("");
      setTLocation("");
      setShowNewTraining(false);
    }
  }

  async function handleDeleteTraining(id: string) {
    const { error } = await supabase.from("club_trainings").delete().eq("id", id);
    if (!error) {
      setTrainings((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Linkerkolom (4 cols): Profiel & Snelkoppelingen */}
      <div className="lg:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Mijn Sportersprofiel</CardTitle>
            </div>
            <CardDescription className="truncate">{userEmail}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Weergavenaam (zichtbaar in treintjes)
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Regio / Woonplaats
                </label>
                <Input
                  placeholder="Bijv. Nijverdal / Twente"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Gewicht (kg, voor W/kg schatting)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  className="font-mono"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={savingProfile}
                className="w-full gap-1.5"
              >
                {profileSaved ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    Opgeslagen
                  </>
                ) : savingProfile ? (
                  "Opslaan..."
                ) : (
                  "Profiel bijwerken"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Rechterkolom (8 cols): Mijn Pace-treintjes + Startvak Chat + Trainingen */}
      <div className="lg:col-span-8 space-y-8">
        {/* SECTIE 1: Aangemelde Pace-treintjes & Chat */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Mijn Pace-treintjes</h2>
              <p className="text-sm text-muted-foreground">
                Stem direct met je groepje af waar jullie elkaar herkennen in het startvak.
              </p>
            </div>
            <Link
              href="/wedstrijden"
              className="text-xs font-medium text-orange-600 hover:underline inline-flex items-center gap-1"
            >
              Zoek wedstrijd <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {myTrains.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Je bent nog niet aangehaakt bij een pace-treintje.
                </p>
                <Link
                  href="/wedstrijden"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                >
                  Bekijk wedstrijdkalender <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myTrains.map((train) => {
                const isRun = train.event.sport === "run";
                const trainMsgs = messages.filter((m) => m.train_id === train.trainId);

                return (
                  <Card key={train.membershipId} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-muted/30 border-b">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              isRun
                                ? "bg-orange-100 text-orange-800"
                                : "bg-teal-100 text-teal-800"
                            }
                          >
                            {isRun ? (
                              <Footprints className="mr-1 h-3 w-3" />
                            ) : (
                              <Bike className="mr-1 h-3 w-3" />
                            )}
                            {train.targetTimeFormatted} ({train.paceLabel})
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(train.event.event_date).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>

                        <Link
                          href={`/wedstrijden/${train.event.slug}`}
                          className="text-xs font-medium hover:underline"
                        >
                          Naar wedstrijdpagina →
                        </Link>
                      </div>

                      <CardTitle className="text-base pt-1">{train.event.title}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        Verzamelpunt: <strong>{train.meetingPoint}</strong>
                      </p>
                    </CardHeader>

                    {/* Treintje-Chat */}
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Startvak-chat ({trainMsgs.length})
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-2 rounded-lg border bg-muted/20 p-3">
                        {trainMsgs.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            Nog geen berichten. Laat als eerste weten welk shirt je draagt of hoe laat je bij het vak bent!
                          </p>
                        ) : (
                          trainMsgs.map((msg) => (
                            <div key={msg.id} className="text-xs leading-relaxed">
                              <span className="font-semibold text-foreground">
                                {msg.author_name}:{" "}
                              </span>
                              <span className="text-muted-foreground">{msg.content}</span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Stuur een bericht naar je treintje..."
                          className="text-sm"
                          value={drafts[train.trainId] || ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [train.trainId]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSendMessage(train.trainId);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={sendingTrainId === train.trainId}
                          onClick={() => handleSendMessage(train.trainId)}
                          className={
                            isRun
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : "bg-teal-600 hover:bg-teal-700 text-white"
                          }
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTIE 2: Samen Voorbereiden (Trainingen inplannen) */}
        <section className="space-y-4 pt-4 border-t">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Clubhuis Trainingen</h2>
              <p className="text-sm text-muted-foreground">
                Plan een voorbereidingsrit of duurloop en nodig anderen uit om aan te haken.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setShowNewTraining((v) => !v)}
              className="gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              <Plus className="h-4 w-4" />
              {showNewTraining ? "Annuleren" : "Training inplannen"}
            </Button>
          </div>

          {showNewTraining && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nieuwe training inplannen</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTraining} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={tSport === "run" ? "default" : "outline"}
                      size="sm"
                      className={tSport === "run" ? "bg-orange-600 text-white" : ""}
                      onClick={() => {
                        setTSport("run");
                        setTPace("4:45 /km");
                      }}
                    >
                      Hardlopen
                    </Button>
                    <Button
                      type="button"
                      variant={tSport === "ride" ? "default" : "outline"}
                      size="sm"
                      className={tSport === "ride" ? "bg-teal-600 text-white" : ""}
                      onClick={() => {
                        setTSport("ride");
                        setTPace("30,5 km/u");
                      }}
                    >
                      Wielrennen
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Titel van de training</label>
                      <Input
                        required
                        placeholder="Bijv. Duurloop richting Halve Marathon"
                        value={tTitle}
                        onChange={(e) => setTTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Datum & starttijd</label>
                      <Input
                        required
                        type="datetime-local"
                        value={tDate}
                        onChange={(e) => setTDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Afstand (km)</label>
                      <Input
                        required
                        type="number"
                        step="0.5"
                        className="font-mono"
                        value={tDistance}
                        onChange={(e) => setTDistance(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Richtlijn tempo / snelheid</label>
                      <Input
                        required
                        placeholder="4:45 /km of 30 km/u"
                        className="font-mono"
                        value={tPace}
                        onChange={(e) => setTPace(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Startlocatie</label>
                      <Input
                        required
                        placeholder="Bijv. Parkeerplaats Sallandse Heuvelrug"
                        value={tLocation}
                        onChange={(e) => setTLocation(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Koppel aan wedstrijd (optioneel)
                      </label>
                      <select
                        value={tEventId}
                        onChange={(e) => setTEventId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                      >
                        <option value="">Geen specifieke wedstrijd</option>
                        {eventsList.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tNoDrop}
                      onChange={(e) => setTNoDrop(e.target.checked)}
                    />
                    Samen uit, samen thuis (No-drop afspraak)
                  </label>

                  <Button
                    type="submit"
                    disabled={creatingTraining}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {creatingTraining ? "Inplannen..." : "Training publiceren"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lijst met geplande clubtrainingen */}
          <div className="space-y-3">
            {trainings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nog geen clubtrainingen ingepland. Klik hierboven om de eerste rit of duurloop neer te zetten!
              </p>
            ) : (
              trainings.map((item) => {
                const isRun = item.sport === "run";
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              isRun
                                ? "bg-orange-100 text-orange-800"
                                : "bg-teal-100 text-teal-800"
                            }
                          >
                            {item.distance_km} km · {item.target_pace_or_speed}
                          </Badge>
                          {item.no_drop && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted">
                              No-drop
                            </span>
                          )}
                          {item.event_title && (
                            <span className="text-[11px] font-medium text-orange-700">
                              Voorbereiding: {item.event_title}
                            </span>
                          )}
                        </div>

                        <p className="font-semibold text-sm">{item.title}</p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(item.training_date).toLocaleString("nl-NL", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.start_location}
                          </span>
                          <span>Door {item.creator_name}</span>
                        </div>
                      </div>

                      {item.creator_id === userId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTraining(item.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          title="Training verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}