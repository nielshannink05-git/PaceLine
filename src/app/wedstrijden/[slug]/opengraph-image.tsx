import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "PaceLine Wedstrijd & Pace-treintjes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EventOgImage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: ev } = await supabase
    .from("events")
    .select("title, sport, event_date, distance_km, city, pace_trains ( id )")
    .eq("slug", slug)
    .single();

  const isRun = ev?.sport !== "ride";
  const accentColor = isRun ? "#ea580c" : "#0d9488";
  const title = ev?.title ?? "Wedstrijd & Pace-treintjes";
  const distanceLabel = ev ? `${ev.distance_km} KM` : "WEDSTRIJD";
  const cityLabel = ev?.city ?? "Nederland";
  const trainCount = Array.isArray((ev as any)?.pace_trains)
    ? (ev as any).pace_trains.length
    : 0;

  const dateLabel = ev?.event_date
    ? new Date(ev.event_date).toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Bekijk starttijd";

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
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
            {isRun ? "HARDLOPEN" : "WIELRENNEN"} · {distanceLabel}
          </div>

          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#e5e5e5",
            }}
          >
            PaceLine
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "26px",
              color: "#d4d4d4",
            }}
          >
            <div>📅 {dateLabel}</div>
            <div>📍 {cityLabel}</div>
          </div>
        </div>

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
          <div style={{ fontSize: "24px", color: "#e5e5e5", fontWeight: 600 }}>
            {trainCount > 0
              ? `🚂 ${trainCount} actieve pace-treintje(s) in het startvak`
              : "🚂 Start het eerste pace-treintje & deel parcours-tips"}
          </div>

          <div style={{ fontSize: "22px", fontWeight: 700, color: accentColor }}>
            Vind jouw groep →
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}