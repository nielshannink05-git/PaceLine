export function getSportTheme(sport: string | null | undefined) {
  const normalized = (sport ?? "").toLowerCase().trim();
  const isRun = normalized === "run" || normalized === "hardlopen";

  return isRun
    ? {
        isRun: true,
        label: "Hardlopen",
        primary: "#ea580c",     // oranje
        tintBg: "#fff7ed",      // zachte header-achtergrond
        tintBorder: "#ffedd5",  // subtiele rand
        badgeText: "#c2410c",
      }
    : {
        isRun: false,
        label: "Wielrennen",
        primary: "#047857",     // bosgroen
        tintBg: "#ecfdf5",      // zachte header-achtergrond
        tintBorder: "#d1fae5",  // subtiele rand
        badgeText: "#065f46",
      };
}