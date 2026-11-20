"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Bike,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Footprints,
  MapPin,
  Plus,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { SocialRideItem } from "@/components/social-agenda-client";

export type ClubItem = {
  id: string;
  slug: string;
  name: string;
  sport: "run" | "ride" | "both";
  city: string;
  home_base: string;
  weekly_schedule: string;
  bio: string | null;
  creator_id: string | null;
};

export type ClubMemberItem = {
  id: string;
  club_id: string;
  user_id: string;
  member_name: string;
  role: "admin" | "member";
};

type Props = {
  club: ClubItem;
  initialMembers: ClubMemberItem[];
  clubRides: SocialRideItem[];
  mapEmbedUrl: string | null;
};

export function ClubDetailClient({
  club,
  initialMembers,
  clubRides,
  mapEmbedUrl,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [members, setMembers] = useState<ClubMemberItem[]>(initialMembers);
  const [busy, setBusy] = useState(false);

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

  const myMembership = user
    ? members.find((m) => m.user_id === user.id)
    : undefined;

  async function handleJoinClub() {
    if (!user) {
      router.push(`/login?next=/social/clubs/${club.slug}`);
      return;
    }
    setBusy(true);

    const { data, error } = await supabase
      .from("club_members")
      .insert({
        club_id: club.id,
        user_id: user.id,
        member_name: profileName || "Sporter",
        role: "member",
      })
      .select()
      .single();

    if (!error && data) {
      setMembers((prev) => [...prev, data as ClubMemberItem]);
      router.refresh();
    }
    setBusy(false);
  }

  async function handleLeaveClub() {
    if (!user || !myMembership) return;
    setBusy(true);

    const { error } = await supabase
      .from("club_members")
      .delete()
      .eq("id", myMembership.id);

    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id !== myMembership.id));
      router.refresh();
    }
    setBusy(false);
  }

  const isRun = club.sport === "run";
  const isRide = club.sport === "ride";
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    club.home_base
  )}`;

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20">
      {/* 1. CLUB HERO HEADER */}
      <section
        className={`border-b bg-white pt-8 pb-10 border-t-4 ${
          isRun
            ? "border-t-orange-500"
            : isRide
            ? "border-t-teal-600"
            : "border-t-slate-900"
        }`}
      >
        <div className="container mx-auto max-w-5xl px-4 space-y-5">
          <Link
            href="/social"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar Social Agenda & Clubs
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    isRun
                      ? "bg-orange-100 text-orange-900 border border-orange-200"
                      : isRide
                      ? "bg-teal-100 text-teal-900 border border-teal-200"
                      : "bg-slate-100 text-slate-900 border border-slate-200"
                  }
                >
                  {isRun && <Footprints className="mr-1 h-3.5 w-3.5" />}
                  {isRide && <Bike className="mr-1 h-3.5 w-3.5" />}
                  {isRun
                    ? "Hardloopclub"
                    : isRide
                    ? "Wielrenclub"
                    : "Run & Ride Hub"}
                </Badge>
                <span className="text-xs font-semibold text-slate-500">
                  📍 {club.city}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
                {club.name}
              </h1>
            </div>

            {/* Lid worden / lidmaatschap knop */}
            <div className="flex items-center gap-2">
              {myMembership ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Lid van deze club
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={handleLeaveClub}
                    className="text-xs text-slate-500 hover:text-destructive"
                    title="Lidmaatschap opzeggen"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={handleJoinClub}
                  className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                >
                  <UserPlus className="h-4 w-4" />
                  {user ? "Word lid van deze club" : "Log in & word lid"}
                </Button>
              )}
            </div>
          </div>

          {club.bio && (
            <p className="max-w-3xl text-sm sm:text-base text-slate-600 leading-relaxed">
              {club.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs sm:text-sm text-slate-700">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-orange-600" />
              {club.weekly_schedule}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              {club.home_base}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              {members.length} {members.length === 1 ? "lid" : "leden"}
            </span>
          </div>
        </div>
      </section>

      {/* 2. HOOFDCONTENT: LINKS CLUBRITTEN, RECHTS VERTREKPLEK & LEDENLIJST */}
      <main className="container mx-auto max-w-5xl px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Linkerkolom (7 cols): Geplande ritten van deze club */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Aankomende clubritten & runs ({clubRides.length})
            </h2>
            <Link
              href="/social"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Rit plannen
            </Link>
          </div>

          {clubRides.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white">
              <CardContent className="py-10 text-center space-y-2">
                <p className="text-sm font-medium text-slate-800">
                  Er staan momenteel geen toekomstige ritten ingepland voor {club.name}.
                </p>
                <p className="text-xs text-slate-500">
                  Word lid van de club of plan een nieuwe rit op de Social Agenda en koppel deze aan {club.name}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {clubRides.map((ride) => {
                const rideIsRun = ride.sport === "run";
                return (
                  <Card
                    key={ride.id}
                    className={`border border-slate-200 bg-white shadow-sm border-l-4 ${
                      rideIsRun ? "border-l-orange-500" : "border-l-teal-600"
                    }`}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            rideIsRun
                              ? "bg-orange-100 text-orange-900 font-mono"
                              : "bg-teal-100 text-teal-900 font-mono"
                          }
                        >
                          {ride.distance_km} km
                        </Badge>
                        <Link
                          href={`/social/${ride.id}`}
                          className="text-xs font-semibold text-orange-600 hover:underline"
                        >
                          Bekijk tempogroepen & meld aan →
                        </Link>
                      </div>

                      <Link href={`/social/${ride.id}`} className="block group">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {ride.title}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                          <Calendar className="h-3.5 w-3.5 text-orange-600" />
                          {new Date(ride.ride_date).toLocaleString("nl-NL", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>{ride.groups.length} tempogroep(en)</span>
                      </div>

                      {ride.groups.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ride.groups.map((g) => (
                            <span
                              key={g.id}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-mono text-slate-700"
                            >
                              {g.group_name}: {g.pace_label}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Rechterkolom (5 cols): Vaste Vertrekplek Kaart + Ledenlijst */}
        <div className="lg:col-span-5 space-y-6">
          {/* Kaart vaste vertrekplek */}
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-3">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                Vaste vertrekplek
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {mapEmbedUrl ? (
                <div className="aspect-video w-full border-b bg-slate-100">
                  <iframe
                    title={`Kaart van ${club.home_base}`}
                    src={mapEmbedUrl}
                    className="h-full w-full border-0"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center border-b bg-slate-100 px-6 text-center text-xs text-slate-500">
                  <MapPin className="mb-2 h-6 w-6 text-slate-400" />
                  Kaartvoorbeeld niet beschikbaar voor dit adres.
                </div>
              )}

              <div className="p-4 space-y-3">
                <p className="text-xs font-medium text-slate-800">
                  {club.home_base}
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Google Maps
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Ledenlijst */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-3">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-700" />
                Leden & volgers ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {members.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Nog geen leden geregistreerd. Klik bovenaan op &ldquo;Word lid van deze club&rdquo; om als eerste aan te haken!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {m.member_name}
                      {m.role === "admin" && (
                        <span className="text-[10px] font-bold uppercase text-orange-600">
                          Host
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}