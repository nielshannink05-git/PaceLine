import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_ARTICLES } from "@/lib/guides";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, Users } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = GUIDE_ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Gids niet gevonden — PaceLine" };

  return {
    title: `${article.title} — PaceLine`,
    description: article.excerpt,
  };
}

async function GuideDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = GUIDE_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      {/* Rustige artikel-header */}
      <header className="border-b border-stone-200 bg-stone-50 pt-10 pb-12">
        <div className="container mx-auto max-w-3xl px-4 space-y-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar overzicht
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="secondary"
              className="bg-orange-50 text-orange-700 border border-orange-200 font-semibold"
            >
              {article.category}
            </Badge>
            <span className="text-zinc-500">
              {article.sportLabel} · {article.readTime}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
            {article.excerpt}
          </p>
        </div>
      </header>

      {/* Artikeltekst */}
      <article className="container mx-auto max-w-3xl px-4 pt-12 space-y-10">
        {article.sections.map((sec) => (
          <section key={sec.heading} className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              {sec.heading}
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
              {sec.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        {/* Subtiele vervolgstap onderaan artikel */}
        <div className="rounded-2xl border border-stone-200 bg-stone-100/80 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-900">
              Klaar om jouw volgende rit of race te plannen?
            </p>
            <p className="text-xs text-zinc-600">
              Bekijk de openstaande tempogroepen of reken direct jouw splittijden
              uit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/social"
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Social Ritten
            </Link>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-stone-50 transition-colors"
            >
              <Calculator className="h-3.5 w-3.5" />
              Pacing Tool
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}

export default function GuideDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-white pb-24 text-zinc-900">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-3xl px-4 py-12">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm font-medium text-zinc-600">
              Gids laden...
            </div>
          </div>
        }
      >
        <GuideDetailContent params={params} />
      </Suspense>
    </div>
  );
}