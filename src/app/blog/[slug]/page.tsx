import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Calculator, Calendar, Clock } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | PaceClub`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const isRun = post.sport === "run";
  const isRide = post.sport === "ride";

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/blog"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar alle artikelen
        </Link>
      </div>

      <header className="mb-8 border-b pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
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

          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono tabular-nums">
            <Clock className="h-3.5 w-3.5" />
            {post.readTimeMinutes} min leestijd
          </span>

          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono tabular-nums">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {post.description}
        </p>
      </header>

      {post.image && (
        <div className="mb-8 overflow-hidden rounded-xl border bg-muted">
          <img
            src={post.image}
            alt={post.title}
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      <article className="space-y-5 text-[17px] leading-[1.75] text-foreground">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="mt-8 mb-3 text-2xl font-bold tracking-tight">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-6 mb-2 text-xl font-semibold tracking-tight">
                {children}
              </h3>
            ),
            p: ({ children }) => <p>{children}</p>,
            ul: ({ children }) => (
              <ul className="my-4 ml-6 list-disc space-y-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>
            ),
            li: ({ children }) => <li>{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            img: ({ src, alt }) => (
              <figure className="my-8 overflow-hidden rounded-xl border bg-muted/30">
                <img src={src} alt={alt ?? ""} className="w-full object-cover" />
                {alt && (
                  <figcaption className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                    {alt}
                  </figcaption>
                )}
              </figure>
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </article>

      <div className="mt-12 rounded-xl border bg-muted/40 p-6 sm:flex sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h3 className="font-semibold text-lg">Zelf je wedstrijdschema berekenen?</h3>
          <p className="text-sm text-muted-foreground">
            Bereken direct je splittijden, tempo of benodigd wattage in de Pacing Tool.
          </p>
        </div>
        <Link
          href="/calculator"
          className={buttonVariants({
            className: isRun
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : isRide
              ? "bg-teal-600 hover:bg-teal-700 text-white"
              : "",
          })}
        >
          <Calculator className="mr-2 h-4 w-4" />
          Open Pacing Tool
        </Link>
      </div>
    </main>
  );
}