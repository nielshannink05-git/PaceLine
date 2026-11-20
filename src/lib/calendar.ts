export type CalendarEventInput = {
  title: string;
  startDateIso: string; // Bijv. "2027-04-18" of een volledige ISO-timestamp
  durationMinutes?: number;
  location?: string;
  description?: string;
  filename?: string;
};

function formatIcsUtcDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function downloadCalendarIcs({
  title,
  startDateIso,
  durationMinutes = 120,
  location = "",
  description = "",
  filename = "paceline-afspraak.ics",
}: CalendarEventInput) {
  // Als startDateIso alleen een datum is ("2027-04-18"), zet standaard op 09:00 lokale tijd
  const normalizedIso = startDateIso.includes("T")
    ? startDateIso
    : `${startDateIso}T09:00:00`;

  const start = new Date(normalizedIso);
  if (Number.isNaN(start.getTime())) return;

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  const uid = `${now.getTime()}-${Math.random().toString(36).slice(2, 9)}@paceline.nl`;

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PaceLine//Sportplatform//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtcDate(now)}`,
    `DTSTART:${formatIcsUtcDate(start)}`,
    `DTEND:${formatIcsUtcDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([icsLines.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}