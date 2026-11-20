import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "PaceLine Social Rit & Tempogroepen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SocialRideOgImage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ride } = await supabase
    .from("social_rides")
    .select(
      `
      title,
      sport,
      ride_date,
      distance_km,
      start_location,
      clubs ( name ),
      social_ride_groups ( group_name, pace_label, sort_order )
    `
    )
    .eq("id", id)
    .single();

  const isRun = ride?.sport === "run";
  const accentColor = isRun ? "#ea580c" : "#0d9488"; // oranje voor run, teal voor ride
  const title = ride?.title ?? "Social Rit & Tempogroepen";
  const distanceLabel = ride ? `${ride.distance_km} KM` : "GROEPSRIT";
  const locationLabel = ride?.start_location ?? "Startlocatie in app";
  const clubName = (ride as any)?.clubs?.name ?? null;

  const dateLabel = ride?.ride_date
    ? new Date(ride.ride_date).toLocaleString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Bekijk datum & starttijd";

  const groups: { group_name: string; pace_label: string }[] = (
    ((ride as any)?.social_ride_groups as any[]) ?? []
  )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          padding: "56px 64px",
          borderTop: `14px solid ${accentColor}`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Bovenste balk: Merk + Sport/Afstand badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                backgroundColor: accentColor,
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: "999px",
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              {isRun ? "SOCIAL RUN" : "SOCIAL RIT"} · {distanceLabel}
            </div>
            {clubName && (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "#f5f5f5",
                  padding: "8px 18px",
                  borderRadius: "999px",
                  fontSize: "20px",
                  fontWeight: 600,
                }}
              >
                {clubName}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#e5e5e5",
            }}
          >
            PaceLine
          </div>
        </div>

        {/* Midden: Titel + Datum + Startlocatie */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "25px",
              color: "#d4d4d4",
            }}
          >
            <div>📅 {dateLabel}</div>
            <div>📍 {locationLabel}</div>
          </div>
        </div>

        {/* Onderste balk: Tempogroepen */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {groups.length > 0 ? (
              groups.map((g, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "12px",
                    padding: "10px 18px",
                    fontSize: "21px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {g.group_name}: {g.pace_label}
                </div>
              ))
            ) : (
              <div style={{ fontSize: "22px", color: "#a3a3a3" }}>
                Kies jouw tempogroep &amp; sluit aan
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: accentColor,
            }}
          >
            Haak aan →
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}