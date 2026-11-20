"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bike, Clock, Footprints, MapPin, Plus, Users } from "lucide-react";

export type ClubOverviewItem = {
  id: string;
  slug: string;
  name: string;
  sport: "run" | "ride" | "both";
  city: string;
  home_base: string;
  weekly_schedule: string;
  memberCount: number;
};

type Props = {
  initialClubs: ClubOverviewItem[];
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ClubsHubSection({ initialClubs }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<"run" | "ride" | "both">("run");
  const [city, setCity] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleOpenForm() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?next=/social");
      return;
    }
    setShowForm((v) => !v);
  }

  async function handleCreateClub(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !homeBase.trim() || !weeklySchedule.trim()) {
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/login?next=/social");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const authorName =
      profile?.full_name || user.email?.split("@")[0] || "Club Host";

    // Unieke slug opbouwen
    const baseSlug = slugify(name);
    const uniqueSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: createdClub, error } = await supabase
      .from("clubs")
      .insert({
        slug: uniqueSlug,
        name: name.trim(),
        sport,
        city: city.trim(),
        home_base: homeBase.trim(),
        weekly_schedule: weeklySchedule.trim(),
        bio: bio.trim() || null,
        creator_id: user.id,
      })
      .select()
      .single();

    if (error || !createdClub) {
      setSaving(false);
      alert("Kon de club niet aanmaken. Probeer een andere clubnaam.");
      return;
    }

    // Voeg maker direct als admin/host toe aan de ledenlijst
    await supabase.from("club_members").insert({
      club_id: createdClub.id,
      user_id: user.id,
      member_name: authorName,
      role: "admin",
    });

    setSaving(false);
    router.push(`/social/clubs/${createdClub.slug}`);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Lokale Hubs &amp; Clubs
          </h2>
          <p className="text-xs text-slate-500">
            Vaste vertrekplekken, wekelijkse trainingsdagen en overzichtelijke tempogroepen.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleOpenForm}
          className="gap-1.5 bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? "Sluiten" : "Nieuwe Club / Hub starten"}
        </Button>
      </div>

      {/* Uitklapbaar formulier: Nieuwe Club oprichten */}
      {showForm && (
        <Card className="border-2 border-slate-300 bg-white shadow-md">
          <CardHeader className="border-b bg-slate-50/80 pb-3">
            <CardTitle className="text-base text-slate-900">
              Start een nieuwe lokale Club of Run/Ride Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Naam van de club *
                  </label>
                  <Input
                    required
                    placeholder="Bijv. Zwolle Sunday Run Club"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Sport *
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as any)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="run">Hardlopen</option>
                    <option value="ride">Wielrennen</option>
                    <option value="both">Hardlopen &amp; Wielrennen</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Stad / Regio *
                  </label>
                  <Input
                    required
                    placeholder="Bijv. Zwolle"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Vaste trainingsdagen &amp; tijd *
                  </label>
                  <Input
                    required
                    placeholder="Bijv. Elke zondag om 09:30 uur"
                    value={weeklySchedule}
                    onChange={(e) => setWeeklySchedule(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Vaste vertrekplek (café, plein of parkeerplaats) *
                  </label>
                  <Input
                    required
                    placeholder="Bijv. Grote Kerkplein, Zwolle"
                    value={homeBase}
                    onChange={(e) => setHomeBase(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Korte omschrijving / sfeer (optioneel)
                  </label>
                  <Input
                    placeholder="Bijv. Laagdrempelige weekendritten in twee tempogroepen met koffiestop achteraf."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {saving ? "Club aanmaken..." : "Club oprichten"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Overzicht van bestaande Clubs */}
      <div className="grid gap-4 md:grid-cols-3">
        {initialClubs.map((c) => {
          const isRun = c.sport === "run";
          const isRide = c.sport === "ride";

          return (
            <Link
              key={c.id}
              href={`/social/clubs/${c.slug}`}
              className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:shadow-md border-t-4 flex flex-col justify-between gap-3 ${
                isRun
                  ? "border-t-orange-500"
                  : isRide
                  ? "border-t-teal-600"
                  : "border-t-slate-800"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {isRun && <Footprints className="h-3.5 w-3.5 text-orange-600" />}
                    {isRide && <Bike className="h-3.5 w-3.5 text-teal-600" />}
                    {c.city}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {c.memberCount}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-orange-600 transition-colors">
                  {c.name}
                </h3>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{c.weekly_schedule}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{c.home_base}</span>
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                Bekijk club &amp; leden →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}