"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { downloadCalendarIcs } from "@/lib/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Bike,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Footprints,
  MapPin,
  MessageSquare,
  Send,
  Shield,
  Trophy,
  User as UserIcon,
} from "lucide-react";

export type MyClubSummary = {
  id: string;
  slug: string;
  name: string;
  sport: "run" | "ride" | "both";
  city: string;
  home_base: string;
  weekly_schedule: string;
};

export type AgendaChatMessage = {
  id: string;
  channelId: string; // train_id of ride_id
  user_id: string;
  author_name: string;
  group_label?: string | null;
  content: string;
  created_at: string;
};

export type UnifiedAgendaItem = {
  id: string;
  kind: "race_train" | "social_ride_joined" | "club_ride_suggestion";
  channelType?: "train" | "ride";
  channelId?: string;
  title: string;
  subtitle?: string | null;
  sport: "run" | "ride";
  dateIso: string;
  distanceKm: number;
  location: string;
  paceOrTargetLabel: string;
  groupName?: string | null;
  guestCount?: number;
  noDrop?: boolean;
  href: string;
};

// Behoud oude exports voor eventuele imports elders
export type ClubTrainItem = any;
export type TrainMessage = any;
export type ClubTraining = any;

type Props = {
  userId: string;
  userEmail: string;
  initialProfile: {
    full_name: string;
    city: string | null;
    body_weight_kg: number;
  };
  myClubs: MyClubSummary[];
  agendaItems: UnifiedAgendaItem[];
  initialMessages: AgendaChatMessage[];
};

export function ClubhuisClient({
  userId,
  userEmail,
  initialProfile,
  myClubs,
  agendaItems,
  initialMessages,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  // Profiel state
  const [fullName, setFullName] = useState(initialProfile.full_name);
  const [city, setCity] = useState(initialProfile.city ?? "");
  const [weightKg, setWeightKg] = useState(
    String(initialProfile.body_weight_kg ?? 75)
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Chat state (voor zowel wedstrijd-treintjes als social ritten)
  const [messages, setMessages] = useState<AgendaChatMessage[]>(initialMessages);
  const [openChatKey, setOpenChatKey] = useState<string | null>(() => {
    const firstWithChat = agendaItems.find((item) => item.channelId);
    return firstWithChat
      ? `${firstWithChat.channelType}:${firstWithChat.channelId}`
      : null;
  });
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>({});
  const [sendingKey, setSendingKey] = useState<string | null>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim() || "Sporter",
      city: city.trim() || null,
      body_weight_kg: Number(weightKg) || 75,
    });

    setSavingProfile(false);
    if (!error) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      router.refresh();
    }
  }

  async function handleSendMessage(item: UnifiedAgendaItem, e: React.FormEvent) {
    e.preventDefault();
    if (!item.channelId || !item.channelType) return;

    const chatKey = `${item.channelType}:${item.channelId}`;
    const text = (draftTexts[chatKey] ?? "").trim();
    if (!text) return;

    setSendingKey(chatKey);
    const author = fullName.trim() || userEmail.split("@")[0] || "Sporter";

    if (item.channelType === "train") {
      const { data, error } = await supabase
        .from("train_messages")
        .insert({
          train_id: item.channelId,
          user_id: userId,
          author_name: author,
          content: text,
        })
        .select("id, train_id, user_id, author_name, content, created_at")
        .single();

      if (!error && data) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            channelId: data.train_id,
            user_id: data.user_id,
            author_name: data.author_name,
            content: data.content,
            created_at: data.created_at,
          },
        ]);
        setDraftTexts((prev) => ({ ...prev, [chatKey]: "" }));
      }
    } else {
      const { data, error } = await supabase
        .from("social_ride_messages")
        .insert({
          ride_id: item.channelId,
          user_id: userId,
          author_name: author,
          group_label: item.groupName ?? null,
          content: text,
        })
        .select(
          "id, ride_id, user_id, author_name, group_label, content, created_at"
        )
        .single();

      if (!error && data) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            channelId: data.ride_id,
            user_id: data.user_id,
            author_name: data.author_name,
            group_label: data.group_label,
            content: data.content,
            created_at: data.created_at,
          },
        ]);
        setDraftTexts((prev) => ({ ...prev, [chatKey]: "" }));
      }
    }

    setSendingKey(null);
  }

  return (
    <div className="space-y-8">
      {/* 1. MIJN CLUBS (Snelkoppelingen) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Mijn Clubs ({myClubs.length})
          </h2>
          <Link
            href="/social"
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            Ontdek alle clubs &amp; ritten →
          </Link>
        </div>

        {myClubs.length === 0 ? (
          <Card className="border-dashed border-stone-300 bg-white">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-semibold text-zinc-900">
                  Je bent nog geen lid van een lokale club
                </p>
                <p className="text-xs text-zinc-500">
                  Sluit je aan bij een vaste hub in jouw regio om wekelijkse
                  ritten automatisch hier te zien.
                </p>
              </div>
              <Link
                href="/social"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Bekijk lokale clubs
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {myClubs.map((club) => {
              const isRun = club.sport === "run";
              const isRide = club.sport === "ride";
              return (
                <Link
                  key={club.id}
                  href={`/social/clubs/${club.slug}`}
                  className="group rounded-xl border border-stone-200 bg-white p-4 shadow-2xs hover:shadow-md transition-all border-l-4 flex flex-col justify-between gap-2.5"
                  style={{
                    borderLeftColor: isRun
                      ? "#ea580c"
                      : isRide
                      ? "#047857"
                      : "#18181b",
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        📍 {club.city}
                      </span>
                      <span className="text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                        Open club →
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-zinc-900 group-hover:text-orange-600 transition-colors">
                      {club.name}
                    </h3>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{club.weekly_schedule}</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. HOOFDGRID: LINKS CHRONOLOGISCHE AGENDA + CHAT, RECHTS PROFIEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Linkerkolom (8 cols): Mijn Aankomende Agenda */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                Mijn Aankomende Agenda ({agendaItems.length})
              </h2>
              <p className="text-xs text-zinc-500">
                Al jouw wedstrijden, social ritten en club-afspraken
                chronologisch op één rij.
              </p>
            </div>
          </div>

          {agendaItems.length === 0 ? (
            <Card className="border-dashed border-stone-300 bg-white">
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-sm font-semibold text-zinc-900">
                  Je agenda is nog leeg voor de komende periode.
                </p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Haak aan bij een pace-treintje op een wedstrijdpagina of stap
                  in een tempogroep bij een Social Rit.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Link
                    href="/wedstrijden"
                    className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                  >
                    Bekijk wedstrijden
                  </Link>
                  <Link
                    href="/social"
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-stone-50"
                  >
                    Bekijk social ritten
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {agendaItems.map((item) => {
                const isRun = item.sport === "run";
                const isSuggestion = item.kind === "club_ride_suggestion";
                const hasChat = Boolean(item.channelId && item.channelType);
                const chatKey = hasChat
                  ? `${item.channelType}:${item.channelId}`
                  : null;
                const itemMessages = chatKey
                  ? messages.filter((m) => m.channelId === item.channelId)
                  : [];
                const isChatOpen = chatKey !== null && openChatKey === chatKey;

                return (
                  <Card
                    key={item.id}
                    className={`overflow-hidden border bg-white shadow-2xs border-l-4 ${
                      isSuggestion
                        ? "border-stone-200 border-dashed"
                        : "border-stone-200"
                    }`}
                    style={{
                      borderLeftColor: isSuggestion
                        ? "#a1a1aa"
                        : isRun
                        ? "#ea580c"
                        : "#047857",
                    }}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Bovenste rij: Type-badge + Agenda download */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.kind === "race_train" && (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-950 border border-amber-200 gap-1"
                            >
                              <Trophy className="h-3 w-3 text-amber-700" />
                              Wedstrijd · Pace-treintje
                            </Badge>
                          )}
                          {item.kind === "social_ride_joined" && (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 text-emerald-900 border border-emerald-200 gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                              Aangemeld · Social {isRun ? "Run" : "Rit"}
                            </Badge>
                          )}
                          {item.kind === "club_ride_suggestion" && (
                            <Badge
                              variant="secondary"
                              className="bg-stone-100 text-zinc-700 border border-stone-200 gap-1"
                            >
                              <Shield className="h-3 w-3 text-zinc-600" />
                              Clubrit ({item.subtitle})
                            </Badge>
                          )}

                          <Badge
                            variant="secondary"
                            className={`font-mono ${
                              isRun ? "bg-orange-100 text-orange-900" : ""
                            }`}
                            style={
                              !isRun
                                ? {
                                    backgroundColor: "#d1fae5",
                                    color: "#065f46",
                                  }
                                : undefined
                            }
                          >
                            {isRun ? (
                              <Footprints className="mr-1 h-3 w-3" />
                            ) : (
                              <Bike className="mr-1 h-3 w-3" />
                            )}
                            {item.distanceKm} km · {item.paceOrTargetLabel}
                          </Badge>

                          {(item.guestCount ?? 0) > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-50 text-orange-800 border border-orange-200 text-[11px]"
                            >
                              +{item.guestCount} introducee
                            </Badge>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            downloadCalendarIcs({
                              title: `PaceLine: ${item.title}`,
                              startDateIso: item.dateIso,
                              durationMinutes: 150,
                              location: item.location,
                              description: `${item.distanceKm} km · ${item.paceOrTargetLabel}`,
                              filename: "paceline-afspraak.ics",
                            })
                          }
                          className="h-7 gap-1 bg-white text-xs text-zinc-700"
                        >
                          <CalendarPlus className="h-3.5 w-3.5 text-zinc-500" />
                          Agenda
                        </Button>
                      </div>

                      {/* Titel & Details */}
                      <div>
                        <Link href={item.href} className="group">
                          <h3 className="text-lg font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        {item.groupName && (
                          <p className="text-xs font-semibold text-zinc-700 mt-0.5">
                            Jouw vak: {item.groupName}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-600">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-900">
                            <Calendar className="h-3.5 w-3.5 text-orange-600" />
                            {new Date(item.dateIso).toLocaleString("nl-NL", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                            {item.location}
                          </span>
                        </div>
                      </div>

                      {/* Actiebalk onderaan kaart: Chat openen of inschrijven */}
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={item.href}
                          className="text-xs font-semibold text-zinc-700 hover:text-orange-600 transition-colors"
                        >
                          {isSuggestion
                            ? "Kies tempogroep & sluit aan →"
                            : "Bekijk details & deelnemers →"}
                        </Link>

                        {hasChat && chatKey && (
                          <Button
                            type="button"
                            size="sm"
                            variant={isChatOpen ? "default" : "outline"}
                            onClick={() =>
                              setOpenChatKey(isChatOpen ? null : chatKey)
                            }
                            className={`h-8 gap-1.5 text-xs ${
                              isChatOpen ? "bg-zinc-900 text-white" : "bg-white"
                            }`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {item.channelType === "train"
                              ? "Startvak-chat"
                              : "Rit-chat"}{" "}
                            ({itemMessages.length})
                          </Button>
                        )}
                      </div>

                      {/* UITKLAPBARE DIRECTE STARTVAK- & RIT-CHAT */}
                      {isChatOpen && chatKey && (
                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-zinc-800">
                              {item.channelType === "train"
                                ? "Startvak-overleg"
                                : "Rit-chat (weer, materiaal & laatste check)"}
                            </p>
                            <span className="text-[11px] text-zinc-500">
                              Zichtbaar voor deelnemers
                            </span>
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                            {itemMessages.length === 0 ? (
                              <p className="text-xs text-zinc-500 italic py-3 text-center">
                                Nog geen berichten. Vraag bijv. hoe het weer is of
                                spreek een verzamelpunt af!
                              </p>
                            ) : (
                              itemMessages.map((msg) => {
                                const isMe = msg.user_id === userId;
                                return (
                                  <div
                                    key={msg.id}
                                    className={`rounded-lg border p-2.5 text-xs ${
                                      isMe
                                        ? "border-orange-200 bg-orange-50/70 ml-6"
                                        : "border-stone-200 bg-white mr-6"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="font-bold text-zinc-900">
                                        {msg.author_name}
                                        {msg.group_label && (
                                          <span className="ml-1.5 font-normal text-[10px] text-zinc-500">
                                            ({msg.group_label})
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[10px] text-zinc-400">
                                        {new Date(
                                          msg.created_at
                                        ).toLocaleTimeString("nl-NL", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-zinc-700 leading-relaxed">
                                      {msg.content}
                                    </p>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <form
                            onSubmit={(e) => handleSendMessage(item, e)}
                            className="flex gap-2"
                          >
                            <Input
                              placeholder={
                                item.channelType === "ride"
                                  ? "Bijv. Regent het in Holten? Gaan de spatborden erop?"
                                  : "Stuur een bericht naar je startvakgroep..."
                              }
                              value={draftTexts[chatKey] ?? ""}
                              onChange={(e) =>
                                setDraftTexts((prev) => ({
                                  ...prev,
                                  [chatKey]: e.target.value,
                                }))
                              }
                              className="h-8 bg-white text-xs"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={sendingKey === chatKey}
                              className="h-8 px-3 bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </form>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Rechterkolom (4 cols): Jouw Sportersprofiel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-stone-200 bg-white shadow-2xs">
            <CardHeader className="border-b border-stone-100 bg-stone-50/70 pb-3">
              <CardTitle className="text-base text-zinc-900 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-zinc-700" />
                Jouw Sportersprofiel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Weergavenaam in groepen &amp; chat
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Regio / Woonplaats
                  </label>
                  <Input
                    placeholder="Bijv. Nijverdal"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Lichaamsgewicht (kg, voor W/kg pacing)
                  </label>
                  <Input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={savingProfile}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs"
                >
                  {savingProfile
                    ? "Opslaan..."
                    : profileSaved
                    ? "✓ Profiel opgeslagen"
                    : "Profiel bijwerken"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}