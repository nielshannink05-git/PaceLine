import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  sport: "run" | "ride" | "algemeen";
  image?: string;
  readTimeMinutes: number;
  content: string;
};

// Hulpfunctie om leestijd te schatten (gemiddeld 200 woorden per minuut)
function calculateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md"));

  const posts: BlogPost[] = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const fullPath = path.join(BLOG_DIR, filename);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    const { data, content } = matter(fileContents);

    return {
      slug,
      title: String(data.title ?? "Zonder titel"),
      description: String(data.description ?? ""),
      date: String(data.date ?? "2026-01-01"),
      sport: (data.sport as "run" | "ride" | "algemeen") ?? "algemeen",
      image: data.image ? String(data.image) : undefined,
      readTimeMinutes: calculateReadTime(content),
      content,
    };
  });

  // Nieuwste artikelen bovenaan
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(BLOG_DIR, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: String(data.title ?? "Zonder titel"),
    description: String(data.description ?? ""),
    date: String(data.date ?? "2026-01-01"),
    sport: (data.sport as "run" | "ride" | "algemeen") ?? "algemeen",
    image: data.image ? String(data.image) : undefined,
    readTimeMinutes: calculateReadTime(content),
    content,
  };
}