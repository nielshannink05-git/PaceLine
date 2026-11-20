"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Share2 } from "lucide-react";

type Props = {
  title: string;
  inviteText: string;
  path: string; // bijv. "/social/123"
};

export function ShareInviteButton({ title, inviteText, path }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : `https://paceline.nl${path}`;

    const message = `${inviteText}\n👉 ${fullUrl}`;

    // 1. Gebruik het native mobiele deelmenu (WhatsApp, Instagram, iMessage) indien beschikbaar
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: inviteText,
          url: fullUrl,
        });
        return;
      } catch {
        // Gebruiker annuleerde of browser ondersteunt geen text+url share; val terug op clipboard/WhatsApp
      }
    }

    // 2. Desktop fallback: kopieer uitnodiging + link naar klembord én open WhatsApp Web in nieuw tabblad optioneel
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-1.5 bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Uitnodiging gekopieerd!
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 text-emerald-600" />
          Deel in WhatsApp-groep
        </>
      )}
    </Button>
  );
}