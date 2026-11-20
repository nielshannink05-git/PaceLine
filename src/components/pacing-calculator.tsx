"use client";

import { useState, useMemo } from "react";
import { ShareRacePlanButton } from "@/components/share-race-plan-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SportType,
  PacingStrategy,
  formatDuration,
  formatRunPace,
  calculateRunSplits,
  calculateRideMetrics,
} from "@/lib/pacing";
import { Footprints, Bike, Users, MapPin, ArrowRight } from "lucide-react";

const RUN_PRESETS = [
  { label: "1 km", km: 1, defaultSeconds: 4 * 60 + 30 },
  { label: "3 km", km: 3, defaultSeconds: 14 * 60 },
  { label: "5 km", km: 5, defaultSeconds: 22 * 60, minSeconds: 12 * 60 },
  { label: "10 km", km: 10, defaultSeconds: 46 * 60, minSeconds: 25 * 60 },
  { label: "15 km", km: 15, defaultSeconds: 69 * 60 },
  { label: "10 mijl", km: 16.1, defaultSeconds: 75 * 60 },
  { label: "Halve Marathon", km: 21.1, defaultSeconds: 100 * 60, minSeconds: 55 * 60 },
  { label: "25 km", km: 25, defaultSeconds: 115 * 60 },
  { label: "30 km", km: 30, defaultSeconds: 140 * 60 },
  { label: "Marathon", km: 42.2, defaultSeconds: 215 * 60, minSeconds: 110 * 60 },
];

const RIDE_PRESETS = [
  { label: "20 km", km: 20, defaultSeconds: 50 * 60 },
  { label: "40 km", km: 40, defaultSeconds: 90 * 60 },
  { label: "60 km", km: 60, defaultSeconds: 115 * 60 },
  { label: "80 km", km: 80, defaultSeconds: 160 * 60 },
  { label: "100 km", km: 100, defaultSeconds: 190 * 60 },
  { label: "120 km", km: 120, defaultSeconds: 230 * 60 },
  { label: "150 km", km: 150, defaultSeconds: 290 * 60 },
  { label: "200 km", km: 200, defaultSeconds: 400 * 60 },
  { label: "250 km", km: 250, defaultSeconds: 500 * 60 },
];

function parseDurationInput(value: string): number | null {
  const parts = value.trim().split(":").map((part) => Number(part));
  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isInteger(part) || part < 0) ||
    (parts.length === 3 && parts[1] >= 60) ||
    parts[parts.length - 1] >= 60
  ) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function formatDurationInput(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

type Props = {
  initialSport?: SportType;
  initialKm?: number;
  initialHm?: number;
  eventTitle?: string;
  eventSlug?: string;
};

export function PacingCalculator({
  initialSport,
  initialKm,
  initialHm,
  eventTitle,
  eventSlug,
}: Props) {
  const resolvedSport: SportType = initialSport ?? "run";

  // Beginwaarden hardlopen
  const resolvedRunKm =
    resolvedSport === "run" && initialKm && initialKm > 0 ? initialKm : 10;
  const matchedRunPreset = RUN_PRESETS.find(
    (p) => Math.abs(p.km - resolvedRunKm) < 0.05
  );
  const resolvedRunSec = matchedRunPreset
    ? matchedRunPreset.defaultSeconds
    : Math.round(resolvedRunKm * 275); // ~4:35 /km als standaard

  // Beginwaarden wielrennen
  const resolvedRideKm =
    resolvedSport === "ride" && initialKm && initialKm > 0 ? initialKm : 100;
  const matchedRidePreset = RIDE_PRESETS.find(
    (p) => Math.abs(p.km - resolvedRideKm) < 0.05
  );
  const resolvedRideSec = matchedRidePreset
    ? matchedRidePreset.defaultSeconds
    : Math.round((resolvedRideKm / 31) * 3600); // ~31 km/u als standaard

  const [sport, setSport] = useState<SportType>(resolvedSport);

  // Hardloop-state
  const [runDistance, setRunDistance] = useState<number>(resolvedRunKm);
  const [runSeconds, setRunSeconds] = useState<number>(resolvedRunSec);
  const [runDurationDraft, setRunDurationDraft] = useState<string>(
    formatDurationInput(resolvedRunSec)
  );
  const [strategy, setStrategy] = useState<PacingStrategy>("even");

  // Fiets-state
  const [rideDistance, setRideDistance] = useState<number>(resolvedRideKm);
  const [rideSeconds, setRideSeconds] = useState<number>(resolvedRideSec);
  const [rideDurationDraft, setRideDurationDraft] = useState<string>(
    formatDurationInput(resolvedRideSec)
  );
  const [elevation, setElevation] = useState<number>(
    initialHm !== undefined && initialHm >= 0 ? initialHm : 350
  );
  const [bodyWeightDraft, setBodyWeightDraft] = useState("75");

  const parsedBodyWeightKg = Number(bodyWeightDraft);
  const bodyWeightKg =
    bodyWeightDraft.trim() !== "" &&
    Number.isFinite(parsedBodyWeightKg) &&
    parsedBodyWeightKg > 0
      ? parsedBodyWeightKg
      : null;

  const handleSportChange = (value: string) => {
    setSport(value as SportType);
  };

  // Berekeningen hardlopen
  const runStats = useMemo(() => {
    const totalSeconds = runSeconds;
    const secPerKm = totalSeconds / runDistance;
    const speedKmh = runDistance / (totalSeconds / 3600);
    const splits = calculateRunSplits(runDistance, totalSeconds, strategy);
    return { totalSeconds, secPerKm, speedKmh, splits };
  }, [runDistance, runSeconds, strategy]);

  // Berekeningen fietsen
  const rideStats = useMemo(() => {
    const totalSeconds = rideSeconds;
    return {
      totalSeconds,
      ...calculateRideMetrics(
        rideDistance,
        totalSeconds,
        elevation,
        bodyWeightKg
      ),
    };
  }, [rideDistance, rideSeconds, elevation, bodyWeightKg]);

  const isRun = sport === "run";
  const currentDistance = isRun ? runDistance : rideDistance;
  const presets = isRun ? RUN_PRESETS : RIDE_PRESETS;
  const hasCustomDistance = !presets.some((p) => Math.abs(p.km - currentDistance) < 0.05);

  const minTargetSeconds = isRun
    ? RUN_PRESETS.find((preset) => preset.km === runDistance)?.minSeconds ??
      Math.max(1, Math.round(runDistance * 2.5 * 60))
    : 1;
  const accentText = isRun ? "text-orange-600" : "text-teal-600";
  const accentBg = isRun ? "bg-orange-600 hover:bg-orange-700" : "bg-teal-600 hover:bg-teal-700";
  const accentBadge = isRun
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-teal-50 text-teal-700 border-teal-200";

  return (
    <div className="space-y-8">
      {/* Sport Selectie + Rechtsboven Deel-knop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={sport} onValueChange={handleSportChange} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-[320px] grid-cols-2">
              <TabsTrigger value="run" className="gap-2">
                <Footprints className="h-4 w-4 text-orange-600" />
                Hardlopen
              </TabsTrigger>
              <TabsTrigger value="ride" className="gap-2">
                <Bike className="h-4 w-4 text-teal-600" />
                Wielrennen
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {eventTitle && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${accentBadge}`}>
              Wedstrijd: {eventTitle}
            </span>
          )}
        </div>

        <ShareRacePlanButton
          sport={sport}
          eventTitle={eventTitle}
          eventSlug={eventSlug}
          distanceKm={currentDistance}
          durationFormatted={formatDuration(isRun ? runSeconds : rideSeconds)}
          paceOrSpeedLabel={
            isRun
              ? `${formatRunPace(runStats.secPerKm)} /km`
              : `${rideStats.avgSpeedKmh.toFixed(1).replace(".", ",")} km/u`
          }
          extraMetricLabel={
            isRun
              ? strategy === "negative"
                ? "Negative split (2,5%)"
                : "Vlak tempo"
              : `${elevation} hm${
                  rideStats.estimatedWatts !== null
                    ? ` · circa ${Math.round(rideStats.estimatedWatts)} W`
                    : ""
                }`
          }
        />
      </div>

      {/* Hoofdgrid: Controls links, Resultaten rechts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Linkerkolom: Invoer */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Jouw Doelinstelling</CardTitle>
            <CardDescription>
              {isRun
                ? "Selecteer een wedstrijdafstand en schuif naar je beoogde eindtijd."
                : "Stel afstand, tijd en hoogtemeters in voor een realistisch kruistempo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Afstand Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Afstand</label>
                {hasCustomDistance && (
                  <span className={`text-xs font-mono font-semibold tabular-nums ${accentText}`}>
                    Wedstrijdafstand: {currentDistance} km
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map((preset) => {
                  const active = Math.abs(currentDistance - preset.km) < 0.05;
                  return (
                    <Button
                      key={preset.label}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className={active ? accentBg : ""}
                      size="sm"
                      onClick={() => {
                        if (isRun) {
                          setRunDistance(preset.km);
                          setRunSeconds(preset.defaultSeconds);
                          setRunDurationDraft(formatDurationInput(preset.defaultSeconds));
                        } else {
                          setRideDistance(preset.km);
                          setRideSeconds(preset.defaultSeconds);
                          setRideDurationDraft(formatDurationInput(preset.defaultSeconds));
                        }
                      }}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Streeftijd Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-medium">Gewenste eindtijd</label>
                <span className={`text-xl font-bold font-mono tabular-nums ${accentText}`}>
                  {formatDuration(isRun ? runSeconds : rideSeconds)}
                </span>
              </div>
              <Slider
                value={[isRun ? runSeconds : rideSeconds]}
                min={minTargetSeconds}
                max={isRun ? Math.round(runDistance * 7.5 * 60) : Math.round(rideDistance * 3.2 * 60)}
                step={1}
                onValueChange={(val) => {
                  const next = Array.isArray(val) ? val[0] : val;
                  if (isRun) {
                    setRunSeconds(next);
                    setRunDurationDraft(formatDurationInput(next));
                  } else {
                    setRideSeconds(next);
                    setRideDurationDraft(formatDurationInput(next));
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <label htmlFor="target-duration" className="text-sm text-muted-foreground">
                  Tijd invoeren
                </label>
                <Input
                  id="target-duration"
                  type="text"
                  inputMode="text"
                  placeholder="46:30"
                  className="w-28 font-mono"
                  value={isRun ? runDurationDraft : rideDurationDraft}
                  onChange={(event) => {
                    if (isRun) setRunDurationDraft(event.target.value);
                    else setRideDurationDraft(event.target.value);
                  }}
                  onBlur={(event) => {
                    const parsed = parseDurationInput(event.target.value);
                    if (parsed === null) {
                      if (isRun) setRunDurationDraft(formatDurationInput(runSeconds));
                      else setRideDurationDraft(formatDurationInput(rideSeconds));
                      return;
                    }

                    const max = isRun
                      ? Math.round(runDistance * 7.5 * 60)
                      : Math.round(rideDistance * 3.2 * 60);
                    const min = minTargetSeconds;
                    const clamped = Math.max(min, Math.min(max, parsed));

                    if (isRun) {
                      setRunSeconds(clamped);
                      setRunDurationDraft(formatDurationInput(clamped));
                    } else {
                      setRideSeconds(clamped);
                      setRideDurationDraft(formatDurationInput(clamped));
                    }
                  }}
                />
              </div>
            </div>

            {/* Sport-specifieke extra optie */}
            {isRun ? (
              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-medium">Race-strategie</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={strategy === "even" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setStrategy("even")}
                  >
                    Vlak tempo
                  </Button>
                  <Button
                    type="button"
                    variant={strategy === "negative" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setStrategy("negative")}
                  >
                    Negative split (2,5%)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-medium">Hoogtemeters</label>
                    <span className="text-sm font-mono font-semibold tabular-nums">
                      {elevation} hm
                    </span>
                  </div>
                  <Slider
                    value={[elevation]}
                    min={0}
                    max={3000}
                    step={50}
                    onValueChange={(val) => {
                      const next = Array.isArray(val) ? val[0] : val;
                      setElevation(next);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="body-weight" className="text-sm font-medium">
                    Lichaamsgewicht
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="body-weight"
                      type="number"
                      min="1"
                      step="0.1"
                      inputMode="decimal"
                      value={bodyWeightDraft}
                      aria-invalid={bodyWeightKg === null}
                      aria-describedby="body-weight-help"
                      className="w-28 font-mono"
                      onChange={(event) => setBodyWeightDraft(event.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                  <p id="body-weight-help" className="text-xs text-muted-foreground">
                    Geschat vermogen gebruikt een fiets van 10 kg, geen wind en standaard
                    luchtweerstand; het is een richtlijn.
                  </p>
                  {bodyWeightKg === null && (
                    <p className="text-xs text-destructive">
                      Vul een lichaamsgewicht groter dan 0 kg in om W/kg te berekenen.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rechterkolom: KPI's + Splittabel */}
        <div className="lg:col-span-7 space-y-6">
          {/* KPI Balk */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {isRun ? "Gem. Tempo" : "Kruissnelheid"}
                </p>
                <p className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-1 ${accentText}`}>
                  {isRun
                    ? formatRunPace(runStats.secPerKm)
                    : `${rideStats.avgSpeedKmh.toFixed(1).replace(".", ",")} km/u`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {isRun ? "Snelheid" : "Vermogen / kg (schatting)"}
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-1">
                  {isRun
                    ? `${runStats.speedKmh.toFixed(1).replace(".", ",")} km/u`
                    : rideStats.estimatedWkg === null
                      ? "—"
                      : `${rideStats.estimatedWkg.toFixed(1).replace(".", ",")} W/kg`}
                </p>
                {!isRun && rideStats.estimatedWatts !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    circa {Math.round(rideStats.estimatedWatts)} W
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Eindtijd
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-1">
                  {formatDuration(isRun ? runStats.totalSeconds : rideStats.totalSeconds)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Splittabel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isRun ? "Kilometer-schema" : "Tussentijden per blok"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Punt</TableHead>
                      <TableHead>{isRun ? "Tempo" : "Snelheid"}</TableHead>
                      <TableHead className="text-right">Tussentijd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-mono tabular-nums text-sm">
                    {(isRun ? runStats.splits : rideStats.rows).map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-sans font-medium">{row.label}</TableCell>
                        <TableCell>{row.paceOrSpeedLabel}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatDuration(row.cumulativeSeconds)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* De Community-trechter: Directe koppeling met Social Sessions */}
      <Card className="border-2 border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className={`h-5 w-5 ${accentText}`} />
              <CardTitle className="text-lg">
                Train samen op dit tempo ({isRun ? formatRunPace(runStats.secPerKm) : `${rideStats.avgSpeedKmh.toFixed(1).replace(".", ",")} km/u`})
              </CardTitle>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${accentBadge}`}>
              Live match-preview (± 5% tempo)
            </span>
          </div>
          <CardDescription>
            Sporters die zich op ditzelfde tempo voorbereiden op een aankomend evenement:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isRun ? (
              <>
                <div className="p-4 rounded-lg border bg-card flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                        No-Drop • {formatRunPace(runStats.secPerKm)}
                      </span>
                      <span className="text-xs text-muted-foreground">Zondag 09:30</span>
                    </div>
                    <p className="font-semibold text-sm">Duurloop Voorbereiding Halve Marathon</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Start: Parkeerplaats Bosrand • 14 km
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1">
                    Bekijk <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="p-4 rounded-lg border bg-card flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                        Tempotraining • {formatRunPace(runStats.secPerKm - 5)}
                      </span>
                      <span className="text-xs text-muted-foreground">Woensdag 19:00</span>
                    </div>
                    <p className="font-semibold text-sm">Avondrondje 10K Pacing Groep</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Start: Atletiekbaan Centrum • 10 km
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1">
                    Bekijk <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg border bg-card flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        Samen uit, samen thuis • {rideStats.avgSpeedKmh.toFixed(1).replace(".", ",")} km/u
                      </span>
                      <span className="text-xs text-muted-foreground">Zaterdag 09:00</span>
                    </div>
                    <p className="font-semibold text-sm">Social Ride Heuvelrug & Koffiestop</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Wielercafé Centraal • {rideDistance} km
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1">
                    Bekijk <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="p-4 rounded-lg border bg-card flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        Strak Tempo • {(rideStats.avgSpeedKmh + 0.8).toFixed(1).replace(".", ",")} km/u
                      </span>
                      <span className="text-xs text-muted-foreground">Donderdag 18:30</span>
                    </div>
                    <p className="font-semibold text-sm">Avondrit Kop-over-Kop</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Brug Noord • 65 km
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1">
                    Bekijk <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}