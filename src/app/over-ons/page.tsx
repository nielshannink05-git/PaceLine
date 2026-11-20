import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Calculator,
  Compass,
  Flag,
  HeartHandshake,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Over ons — Het verhaal achter PaceLine",
  description:
    "Hoe PaceLine ontstond vanuit een simpel probleem op de fiets en in het startvak: waarom bestaan er duizenden apps om terug te kijken, maar geen plek om samen te starten?",
};

export default function OverOnsPage() {
  return (
    <main className="pb-24">
      {/* 1. HEADER & ONTSTAANSVERHAAL */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background pt-12 pb-16">
        <div className="container mx-auto max-w-3xl px-4 space-y-6">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Het verhaal achter PaceLine
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl leading-[1.15]">
            Gebouwd vanuit de praktijk: van een eenzaam schema naar samen aan de start.
          </h1>

          <div className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed pt-2">
            <p>
              Het idee voor PaceLine ontstond niet achter een tekentafel, maar tijdens de
              voorbereiding op grote duursportdoelen — van halve marathons tot lange
              cyclo’s met duizenden hoogtemeters in de bergen.
            </p>
            <p>
              Wie traint voor een wedstrijd merkt al snel iets geks: er bestaan tientallen
              apps om achteraf elke hartslag, watt en tussentijd te analyseren, maar zodra je
              een week voor de start zoekt naar mensen die <strong>exact jouw tempo</strong>{" "}
              lopen of rijden, sta je er alleen voor. WhatsApp-groepen zijn onoverzichtelijk,
              clubritten rijden in de praktijk vaak veel harder dan beloofd, en in het startvak
              van een grote wedstrijd sta je tussen duizenden onbekenden.
            </p>
            <p className="text-foreground font-medium">
              Daarom bouwen we PaceLine: één plek waar je eerst eerlijk je race-plan doorrekent,
              en dat plan vervolgens koppelt aan échte mensen in hetzelfde startvak.
            </p>
          </div>
        </div>
      </section>

      {/* 2. DRIE BELOFTES VAN PACELINE */}
      <section className="container mx-auto max-w-4xl px-4 py-16 border-b">
        <h2 className="text-2xl font-bold tracking-tight mb-8">
          Waar we in geloven
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">Eerlijke wiskunde</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Geen nattevingerwerk. We matchen lopers en fietsers op realistische
                streeftijden, hoogtemeters en vermogensschattingen — zodat niemand na tien
                kilometer al opgebrand is.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">Duidelijke afspraken</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bij elk pace-treintje staat vooraf zwart-op-wit of het een{" "}
                <em>Samen uit, samen thuis</em>-groep is of strak op wedstrijdschema. Zo weet
                iedereen waar hij aan toe is.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">Geen ruis, wel waarde</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Geen schreeuwerige banners of eindeloze tijdlijnen vol ego’s, maar praktische
                parcours-intel, gedeelde koffie-stops en een rustig clubhuis voor je eigen
                wedstrijden.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. CALL TO ACTION */}
      <section className="container mx-auto max-w-4xl px-4 pt-14">
        <div className="rounded-2xl border bg-muted/30 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-600" />
              Meebouwen of meedoen?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Kies jouw volgende wedstrijd op de kalender, bereken je splits en start het
              eerste pace-treintje op jouw streeftijd.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/wedstrijden"
              className={buttonVariants({
                variant: "default",
                className: "bg-orange-600 hover:bg-orange-700 text-white",
              })}
            >
              Bekijk wedstrijden
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/calculator"
              className={buttonVariants({ variant: "outline" })}
            >
              <Users className="mr-2 h-4 w-4" />
              Pacing Tool
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}