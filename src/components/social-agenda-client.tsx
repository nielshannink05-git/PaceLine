"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bike, Footprints, MapPin, Clock, Users, Plus, CheckCircle2 } from "lucide-react";

export type SocialMeet = {
  id: string;
  title: string;
  club_name: string;
  sport: "run" | "ride";
  day_of_week: string;
  start_time: string;
  distance_km: number;
  pace_label: string;
  city: string;
  meeting_point: string;
  is_no_drop: boolean;
  description: string | null;
};

export function SocialAgendaClient({ initialMeets }: { initialMeets: SocialMeet[] }) {
  const [meets, setMeets] = useState<SocialMeet[]>(initialMeets);
  const [sportFilter, setSportFilter] = useState<"all" | "run" | "ride">("all");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulier state
  const [title, setTitle] = useState("");
  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState<"run" | "ride">("ride");
  const [dayOfWeek, setDayOfWeek] = useState("Zondag");
  const [startTime, setStartTime] = useState("09:00");
  const [distanceKm, setDistanceKm] = useState("60");
  const [paceLabel, setPaceLabel] = useState("");
  const [city, setCity] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [description, setDescription] = useState("");

  const filteredMeets = meets.filter((meet) =>
    sportFilter === "all" ? true : meet.sport === sportFilter
  );

  async function handleAddMeet(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !clubName || !city || !meetingPoint || !paceLabel) return;

    setIsSubmitting(true);

    const newMeet = {
      title,
      club_name: clubName,
      sport,
      day_of_week: dayOfWeek,
      start_time: startTime,
      distance_km: Number(distanceKm) || 0,
      pace_label: paceLabel,
      city,
      meeting_point: meetingPoint,
      is_no_drop: true,
      description: description || null,
    };

    const { data, error } = await supabase
      .from("social_meets")
      .insert([newMeet])
      .select()
      .single();

    setIsSubmitting(false);

    if (!error && data) {
      setMeets([data as SocialMeet, ...meets]);
      setShowForm(false);
      // Reset velden
      setTitle("");
      setClubName("");
      setPaceLabel("");
      setMeetingPoint("");
      setDescription("");
    } else {
      alert("Er ging iets mis bij het opslaan. Controleer je Supabase-verbinding.");
    }
  }

  return (
    <div>
      {/* Filterbalk + Knop om clubrit toe te voegen */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={sportFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSportFilter("all")}
          >
            Alles ({meets.length})
          </Button>
          <Button
            variant={sportFilter === "ride" ? "default" : "outline"}
            size="sm"
            onClick={() => setSportFilter("ride")}
            className={sportFilter === "ride" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
          >
            <Bike className="mr-1.5 h-4 w-4" />
            Fietsclubs
          </Button>
          <Button
            variant={sportFilter === "run" ? "default" : "outline"}
            size="sm"
            onClick={() => setSportFilter("run")}
            className={sportFilter === "run" ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
          >
            <Footprints className="mr-1.5 h-4 w-4" />
            Hardloopgroepen
          </Button>
        </div>

        <Button onClick={() => setShowForm(!showForm)} variant="secondary" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          {showForm ? "Sluit formulier" : "Meld een clubrit / loopgroep aan"}
        </Button>
      </div>

      {/* Uitklapbaar formulier voor nieuwe social meets */}
      {showForm && (
        <Card className="mb-8 border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Nieuwe terugkerende groepsrit of loopgroep toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMeet} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Sport</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={sport === "ride" ? "default" : "outline"}
                    className={sport === "ride" ? "bg-teal-600 text-white" : ""}
                    onClick={() => setSport("ride")}
                  >
                    Wielrennen
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sport === "run" ? "default" : "outline"}
                    className={sport === "run" ? "bg-orange-600 text-white" : ""}
                    onClick={() => setSport("run")}
                  >
                    Hardlopen
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Naam van de rit / training *</label>
                <Input
                  required
                  placeholder="Bijv. Zondagochtend Koffierit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Club / Organisator *</label>
                <Input
                  required
                  placeholder="Bijv. Wielerclub Twente"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Plaats *</label>
                <Input
                  required
                  placeholder="Bijv. Nijverdal"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Dag *</label>
                  <Input
                    required
                    placeholder="Zondag"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Starttijd *</label>
                  <Input
                    required
                    placeholder="09:00"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Afstand (km) *</label>
                  <Input
                    required
                    type="number"
                    placeholder="65"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Richt-tempo *</label>
                  <Input
                    required
                    placeholder={sport === "ride" ? "29 - 31 km/u" : "5:15 min/km"}
                    value={paceLabel}
                    onChange={(e) => setPaceLabel(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">Exact verzamelpunt *</label>
                <Input
                  required
                  placeholder="Bijv. Parkeerplaats bij de kerk / koffietent"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">Korte toelichting (optioneel)</label>
                <Input
                  placeholder="Bijv. Samen uit samen thuis, helm verplicht, halverwege koffiestop."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Opslaan..." : "Publiceren in Social Agenda"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Overzichtskaarten */}
      {filteredMeets.length === 0 ? (
        <p className="text-muted-foreground">Geen groepsritten gevonden voor dit filter.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredMeets.map((meet) => {
            const isRun = meet.sport === "run";

            return (
              <Card key={meet.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        isRun
                          ? "bg-orange-100 text-orange-700"
                          : "bg-teal-100 text-teal-700"
                      }
                    >
                      {isRun ? (
                        <span className="flex items-center gap-1">
                          <Footprints className="h-3.5 w-3.5" /> Hardloopgroep
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Bike className="h-3.5 w-3.5" /> Fietsclub
                        </span>
                      )}
                    </Badge>

                    {meet.is_no_drop && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Samen uit, samen thuis
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-xl">{meet.title}</CardTitle>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {meet.club_name} · {meet.city}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {meet.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {meet.description}
                    </p>
                  )}

                  {/* Data-blok (Afstand, Tempo, Tijdstip) */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center">
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                        Wanneer
                      </span>
                      <span className="font-mono tabular-nums text-sm font-semibold">
                        {meet.day_of_week} {meet.start_time}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                        Afstand
                      </span>
                      <span className="font-mono tabular-nums text-sm font-semibold">
                        {meet.distance_km} km
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                        Tempo
                      </span>
                      <span
                        className={`font-mono tabular-nums text-sm font-semibold ${
                          isRun ? "text-orange-600" : "text-teal-600"
                        }`}
                      >
                        {meet.pace_label}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                  <span>
                    <strong className="text-foreground">Verzamelpunt:</strong> {meet.meeting_point}
                  </span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}