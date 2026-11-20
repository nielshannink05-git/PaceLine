"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SportType } from "@/lib/pacing";
import {
  Check,
  Copy,
  MessageCircle,
  Share2,
  X,
  Footprints,
  Bike,
  Trophy,
} from "lucide-react";

type Props = {
  sport: SportType;
  eventTitle?: string;
  eventSlug?: string;
  distanceKm: number;
  durationFormatted: string;
  paceOrSpeedLabel: string;
  extraMetricLabel?: string; // Bijv. "Negative split (2,5%)" of "1450 hm · ~245 W"
};

export function ShareRacePlanButton({
  sport,
  eventTitle,
  eventSlug,
  distanceKm,
  durationFormatted,
  paceOrSpeedLabel,
  extraMetricLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isRun = sport === "run";
  const formattedDistance = String(distanceKm).replace(".", ",");
  const headerTitle = eventTitle ?? `${formattedDistance} km ${isRun ? "Hardlopen" : "Wielrennen"}`;

  // Bouw de teruglink naar de specifieke wedstrijd (of de calculator als er geen wedstrijd is)
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://paceclub.nl";
  const shareUrl = eventSlug
    ? `${origin}/wedstrijden/${eventSlug}`
    : `${origin}/calculator?sport=${sport}&km=${distanceKm}`;

  const inviteText = eventTitle
    ? `Mijn Race-Plan voor ${eventTitle} (${formattedDistance} km):\n` +
      `⏱️ Streeftijd: ${durationFormatted}\n` +
      `⚡ Doeltempo: ${paceOrSpeedLabel}${extraMetricLabel ? `\n📊 ${extraMetricLabel}` : ""}\n\n` +
      `Wie haakt aan bij mijn pace-treintje in het startvak? 👇\n${shareUrl}`
    : `Mijn Race-Plan (${formattedDistance} km ${isRun ? "hardlopen" : "wielrennen"}):\n` +
      `⏱️ Streeftijd: ${durationFormatted}\n` +
      `⚡ Doeltempo: ${paceOrSpeedLabel}${extraMetricLabel ? `\n📊 ${extraMetricLabel}` : ""}\n\n` +
      `Bereken jouw splits op PaceClub 👇\n${shareUrl}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback als clipboard niet beschikbaar is
    }
  }

  function handleWhatsAppShare() {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* De knop rechtsboven in de Pacing Calculator */}
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={`gap-2 text-white shadow-xs ${
          isRun
            ? "bg-orange-600 hover:bg-orange-700"
            : "bg-teal-600 hover:bg-teal-700"
        }`}
      >
        <Share2 className="h-4 w-4" />
        Deel mijn Race-Plan
      </Button>

      {/* Modal overlay met de visuele Race-Plan kaart */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-md border-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Jouw Deelbare Race-Plan</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* De visuele kaart (strak voor screenshot / Instagram Story) */}
              <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-6 text-white shadow-inner">
                <div
                  className={`absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-2xl ${
                    isRun ? "bg-orange-500" : "bg-teal-400"
                  }`}
                />

                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200">
                      {isRun ? (
                        <Footprints className="h-3.5 w-3.5 text-orange-400" />
                      ) : (
                        <Bike className="h-3.5 w-3.5 text-teal-400" />
                      )}
                      {isRun ? "Hardlopen" : "Wielrennen"} · {formattedDistance} km
                    </span>

                    <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">
                      PaceClub
                    </span>
                  </div>

                  <div>
                    {eventTitle && (
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        Wedstrijddoel
                      </p>
                    )}
                    <h3 className="text-xl font-bold leading-snug text-white">
                      {headerTitle}
                    </h3>
                  </div>

                  {/* Kerncijfers op de kaart */}
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 font-mono tabular-nums">
                    <div>
                      <p className="font-sans text-[11px] uppercase tracking-wider text-zinc-400">
                        Streeftijd
                      </p>
                      <p
                        className={`mt-0.5 text-2xl font-bold ${
                          isRun ? "text-orange-400" : "text-teal-400"
                        }`}
                      >
                        {durationFormatted}
                      </p>
                    </div>

                    <div>
                      <p className="font-sans text-[11px] uppercase tracking-wider text-zinc-400">
                        {isRun ? "Doeltempo" : "Kruissnelheid"}
                      </p>
                      <p className="mt-0.5 text-2xl font-bold text-white">
                        {paceOrSpeedLabel}
                      </p>
                    </div>
                  </div>

                  {extraMetricLabel && (
                    <p className="text-xs text-zinc-300">
                      Strategie: <span className="font-medium text-white">{extraMetricLabel}</span>
                    </p>
                  )}

                  <div className="border-t border-white/10 pt-3 text-[11px] text-zinc-400">
                    {eventSlug
                      ? "Start mee in mijn pace-treintje via PaceClub"
                      : "Bereken jouw splits op PaceClub"}
                  </div>
                </div>
              </div>

              {/* Actieknoppen: WhatsApp & Kopieer */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Deel via WhatsApp
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      Gekopieerd!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Kopieer tekst & link
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}