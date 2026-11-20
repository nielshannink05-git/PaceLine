export type SportType = "run" | "ride";
export type PacingStrategy = "even" | "negative";

export interface SplitRow {
  label: string;
  segmentKm: number;
  cumulativeKm: number;
  segmentSeconds: number;
  cumulativeSeconds: number;
  paceOrSpeedLabel: string;
}

/**
 * Formatteert seconden naar UU:MM:SS of MM:SS
 */
export function formatDuration(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/**
 * Formatteert seconden per kilometer naar bijv. "4:35 /km"
 */
export function formatRunPace(secPerKm: number): string {
  const rounded = Math.round(secPerKm);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

/**
 * Berekent splittabel voor hardlopen (inclusief exacte negative-split verdeling)
 */
export function calculateRunSplits(
  distanceKm: number,
  targetSeconds: number,
  strategy: PacingStrategy
): SplitRow[] {
  const avgPace = targetSeconds / distanceKm; // sec per km
  const delta = strategy === "negative" ? 0.025 : 0; // 2.5% langzamer eerste helft, 2.5% sneller tweede helft
  const halfDistance = distanceKm / 2;

  // Voor marathons (> 25 km) groeperen we per 5 km voor een overzichtelijke tabel
  const stepSize = distanceKm > 25 ? 5 : 1;
  const rows: SplitRow[] = [];

  let covered = 0;
  let cumulativeSeconds = 0;

  while (covered < distanceKm - 0.001) {
    const nextPoint = Math.min(distanceKm, Number((covered + stepSize).toFixed(2)));
    const segmentKm = Number((nextPoint - covered).toFixed(2));

    // Bereken tijd voor dit segment (rekening houdend met het omslagpunt op 50% afstand)
    let segmentSeconds = 0;
    if (nextPoint <= halfDistance) {
      segmentSeconds = segmentKm * avgPace * (1 + delta);
    } else if (covered >= halfDistance) {
      segmentSeconds = segmentKm * avgPace * (1 - delta);
    } else {
      const firstPart = halfDistance - covered;
      const secondPart = nextPoint - halfDistance;
      segmentSeconds =
        firstPart * avgPace * (1 + delta) + secondPart * avgPace * (1 - delta);
    }

    cumulativeSeconds += segmentSeconds;
    const segmentPace = segmentSeconds / segmentKm;

    rows.push({
      label:
        segmentKm < stepSize
          ? `${nextPoint.toFixed(1).replace(".", ",")} km (Finish)`
          : `km ${Math.round(nextPoint)}`,
      segmentKm,
      cumulativeKm: nextPoint,
      segmentSeconds,
      cumulativeSeconds,
      paceOrSpeedLabel: formatRunPace(segmentPace),
    });

    covered = nextPoint;
  }

  return rows;
}

/**
 * Berekent fietsstatistieken & splittabel per 10 km (incl. hoogtemeter-impact)
 */
export function calculateRideMetrics(
  distanceKm: number,
  targetSeconds: number,
  elevationM: number,
  bodyWeightKg: number | null
) {
  const hours = targetSeconds / 3600;
  const avgSpeedKmh = distanceKm / hours;
  const speedMetersPerSecond = (distanceKm * 1000) / targetSeconds;
  const totalMassKg = bodyWeightKg === null ? null : bodyWeightKg + 10;
  const gravity = 9.81;
  const aerodynamicWatts = 0.5 * 1.225 * 0.32 * speedMetersPerSecond ** 3;
  const rollingWatts =
    totalMassKg === null
      ? null
      : totalMassKg * gravity * 0.004 * speedMetersPerSecond;
  const climbingWatts =
    totalMassKg === null
      ? null
      : totalMassKg * gravity * (elevationM / targetSeconds);
  const estimatedWatts =
    rollingWatts === null || climbingWatts === null
      ? null
      : (aerodynamicWatts + rollingWatts + climbingWatts) / 0.97;
  const estimatedWkg =
    bodyWeightKg === null || estimatedWatts === null
      ? null
      : estimatedWatts / bodyWeightKg;

  const stepSize = distanceKm >= 80 ? 15 : 10;
  const rows: SplitRow[] = [];
  let covered = 0;
  let cumulativeSeconds = 0;

  while (covered < distanceKm - 0.001) {
    const nextPoint = Math.min(distanceKm, Number((covered + stepSize).toFixed(1)));
    const segmentKm = Number((nextPoint - covered).toFixed(1));
    const segmentSeconds = (segmentKm / distanceKm) * targetSeconds;
    cumulativeSeconds += segmentSeconds;

    rows.push({
      label: `${Math.round(nextPoint)} km`,
      segmentKm,
      cumulativeKm: nextPoint,
      segmentSeconds,
      cumulativeSeconds,
      paceOrSpeedLabel: `${avgSpeedKmh.toFixed(1).replace(".", ",")} km/u`,
    });

    covered = nextPoint;
  }

  return {
    avgSpeedKmh,
    estimatedWatts,
    estimatedWkg,
    rows,
  };
}