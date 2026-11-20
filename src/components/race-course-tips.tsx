"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, Plus, ThumbsUp } from "lucide-react";

export type TipCategory =
  | "materiaal"
  | "klimmen_wind"
  | "logistiek"
  | "bevoorrading";

export type CourseTip = {
  id: string;
  event_id: string;
  author_name: string;
  category: TipCategory;
  tip_text: string;
  is_finisher: boolean;
  upvotes: number;
};

const CATEGORY_LABELS: Record<TipCategory, string> = {
  materiaal: "Materiaal & Schoenen/Banden",
  klimmen_wind: "Klimmen & Wind",
  logistiek: "Logistiek & Parkeren",
  bevoorrading: "Koffie & Bevoorrading",
};

type Props = {
  eventId: string;
  sport: "run" | "ride";
  initialTips: CourseTip[];
};

export function RaceCourseTips({ eventId, sport, initialTips }: Props) {
  const isRun = sport === "run";

  const [tips, setTips] = useState<CourseTip[]>(initialTips);
  const [selectedFilter, setSelectedFilter] = useState<TipCategory | "all">("all");
  const [upvotedIds, setUpvotedIds] = useState<string[]>([]);

  // Formulier-state voor nieuwe tip
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState<TipCategory>("materiaal");
  const [tipText, setTipText] = useState("");
  const [isFinisher, setIsFinisher] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTips =
    selectedFilter === "all"
      ? tips
      : tips.filter((t) => t.category === selectedFilter);

  async function handleAddTip(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !tipText.trim()) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("course_tips")
      .insert({
        event_id: eventId,
        author_name: authorName.trim(),
        category,
        tip_text: tipText.trim(),
        is_finisher: isFinisher,
        upvotes: 1,
      })
      .select()
      .single();

    if (!error && data) {
      const updated = [...tips, data as CourseTip].sort(
        (a, b) => b.upvotes - a.upvotes
      );
      setTips(updated);
      setAuthorName("");
      setTipText("");
      setIsFinisher(false);
      setShowForm(false);
    }

    setIsSubmitting(false);
  }

  async function handleUpvote(tip: CourseTip) {
    if (upvotedIds.includes(tip.id)) return;

    const newCount = tip.upvotes + 1;
    setUpvotedIds((prev) => [...prev, tip.id]);
    setTips((prev) =>
      prev
        .map((t) => (t.id === tip.id ? { ...t, upvotes: newCount } : t))
        .sort((a, b) => b.upvotes - a.upvotes)
    );

    await supabase
      .from("course_tips")
      .update({ upvotes: newCount })
      .eq("id", tip.id);
  }

  return (
    <section className="mt-14 border-t pt-12 space-y-6">
      {/* Header + knop */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Parcours- & Materiaal-intel
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Concrete lokale kennis van deelnemers. Stem op de beste tips zodat die bovenaan blijven staan.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowForm((prev) => !prev)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Deel een tip
        </Button>
      </div>

      {/* Categorie-filterknoppen */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedFilter("all")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selectedFilter === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          Alles ({tips.length})
        </button>

        {(Object.keys(CATEGORY_LABELS) as TipCategory[]).map((cat) => {
          const count = tips.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedFilter(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedFilter === cat
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Formulier om een tip toe te voegen */}
      {showForm && (
        <Card className="border-2 border-foreground/15">
          <CardHeader>
            <CardTitle className="text-lg">Nieuwe parcours- of materiaaltip</CardTitle>
            <CardDescription>
              Houd het kort en praktisch (bijv. bandenspanning, bochtenwerk, parkeerplek of windrichting).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTip} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Jouw voornaam</label>
                  <Input
                    required
                    placeholder="Bijv. Niels"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Categorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TipCategory)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {(Object.keys(CATEGORY_LABELS) as TipCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jouw tip</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Bijv. Na km 16 draai je de open polder in; spaar tot die tijd wat energie als de wind uit het zuidwesten komt."
                  value={tipText}
                  onChange={(e) => setTipText(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setIsFinisher((prev) => !prev)}
                  className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                    isFinisher
                      ? "border-foreground bg-foreground/5 font-semibold"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {isFinisher ? "✓ " : ""}Eerdere editie uitgereden
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={
                    isRun
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }
                >
                  {isSubmitting ? "Plaatsen..." : "Tip plaatsen"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lijst met tips */}
      {filteredTips.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nog geen tips in deze categorie. Deel jouw ervaring als eerste!
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTips.map((tip) => {
            const hasUpvoted = upvotedIds.includes(tip.id);

            return (
              <Card key={tip.id}>
                <CardContent className="flex items-start justify-between gap-4 pt-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[tip.category]}
                      </Badge>

                      <span className="text-xs font-medium text-foreground">
                        {tip.author_name}
                      </span>

                      {tip.is_finisher && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                        >
                          <Award className="mr-1 h-3 w-3" />
                          Eerdere editie uitgereden
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/90">
                      {tip.tip_text}
                    </p>
                  </div>

                  {/* Nuttig / Upvote knop */}
                  <Button
                    type="button"
                    variant={hasUpvoted ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpvote(tip)}
                    className={`shrink-0 font-mono tabular-nums ${
                      hasUpvoted
                        ? isRun
                          ? "bg-orange-600 hover:bg-orange-600 text-white"
                          : "bg-teal-600 hover:bg-teal-600 text-white"
                        : ""
                    }`}
                  >
                    <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                    Nuttig · {tip.upvotes}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}