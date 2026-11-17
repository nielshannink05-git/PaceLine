import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Calendar, MapPin, Mountain, Footprints, Bike, ArrowRight } from "lucide-react";

interface SportEvent {
  id: string;
  slug: string;
  title: string;
  sport: "run" | "ride";
  event_date: string;
  distance_km: number;
  elevation_m: number;
  city: string | null;
}

function formatDutchDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function WedstrijdenPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, slug, title, sport, event_date, distance_km, elevation_m, city")
    .order("event_date", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50/60">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            Wedstrijden & Toertochten
          </h1>
          <p className="text-base text-muted-foreground">
            Kies je volgende doel, bereken je ideale wedstrijdtempo en vind sporters die voor hetzelfde evenement trainen.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
            Kon wedstrijden niet laden: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(events as SportEvent[] | null)?.map((event) => {
            const isRun = event.sport === "run";

            return (
              <Card key={event.id} className="flex flex-col justify-between">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isRun
                          ? "bg-orange-100 text-orange-800"
                          : "bg-teal-100 text-teal-800"
                      }`}
                    >
                      {isRun ? (
                        <Footprints className="h-3.5 w-3.5" />
                      ) : (
                        <Bike className="h-3.5 w-3.5" />
                      )}
                      {isRun ? "Hardlopen" : "Wielrennen"}
                    </span>

                    <span className="font-mono text-sm font-bold tabular-nums text-zinc-700">
                      {String(event.distance_km).replace(".", ",")} km
                    </span>
                  </div>

                  <CardTitle className="text-xl leading-snug">
                    {event.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span>{formatDutchDate(event.event_date)}</span>
                  </div>

                  {event.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span>{event.city}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Mountain className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="font-mono tabular-nums">
                      {event.elevation_m} hoogtemeters
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t">
                  <Link
                    href="/"
                    className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}
                  >
                    Bereken pacing voor deze race
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}