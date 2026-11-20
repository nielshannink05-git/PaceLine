import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Kennisbank & Pacing Tips",
  description:
    "Praktische artikelen over wedstrijdstrategie, pacing, voeding en materiaal voor hardlopers en wielrenners.",
};

export default function BlogOverviewPage() {
  const posts = getAllPosts();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10 pb-20">
      {/* Header */}
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Kennisbank & Pacing Tips
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Geen loze praatjes, maar concrete strategieën over tempo-indeling, hoogtemeters, 
          voeding en materiaal voor je volgende wedstrijd.
        </p>
      </div>

      {/* Artikelen Grid */}
      {posts.length === 0 ? (
        <p className="text-muted-foreground">Er zijn nog geen artikelen gepubliceerd.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => {
            const isRun = post.sport === "run";
            const isRide = post.sport === "ride";

            return (
              <Card
                key={post.slug}
                className="flex flex-col justify-between overflow-hidden"
              >
                {/* Omslagfoto (als 'image:' in je .md bestand staat) */}
                {post.image && (
                  <div className="aspect-video w-full overflow-hidden border-b bg-muted">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        isRun
                          ? "bg-orange-100 text-orange-800"
                          : isRide
                          ? "bg-teal-100 text-teal-800"
                          : ""
                      }
                    >
                      {isRun ? "Hardlopen" : isRide ? "Wielrennen" : "Algemeen"}
                    </Badge>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTimeMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.date).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <CardTitle className="text-xl leading-snug">
                    {post.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {post.description}
                  </p>
                </CardContent>

                <CardFooter>
                  <Link
                    href={`/blog/${post.slug}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Lees artikel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}