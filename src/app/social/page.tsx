import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import { SocialAgendaClient, SocialMeet } from "@/components/social-agenda-client";

export const metadata = {
  title: "Social Agenda — Fietsclubs & Hardloopgroepen | PaceClub",
  description: "Sluit je aan bij lokale social rides en duurlopen. Duidelijke tempo-groepen en altijd samen uit, samen thuis.",
};

export default async function SocialAgendaPage() {
  // Vertelt Next.js 16 dat deze pagina dynamisch is en altijd verse Supabase-data ophaalt
  await connection();

  const { data: meets, error } = await supabase
    .from("social_meets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fout bij ophalen social_meets:", error);
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Social Agenda
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Geen verplicht lidmaatschap, wel vaste vertrektijden en heldere tempo-afspraken. 
          Haak aan bij een lokale fietsclub of hardloopgroep bij jou in de buurt.
        </p>
      </div>

      <SocialAgendaClient initialMeets={(meets as SocialMeet[]) ?? []} />
    </main>
  );
}