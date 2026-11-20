"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const params = new URLSearchParams(window.location.search);
    const rawNext = params.get("next");
    // Alleen veilige relatieve paden toestaan (voorkomt open-redirect misbruik)
    const nextPath =
      rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
        ? rawNext
        : "/clubhuis";

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <Card className="border-2">
        <CardHeader className="space-y-2">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Geen wachtwoord nodig
          </div>
          <CardTitle className="text-2xl">Welkom in het PaceClub Clubhuis</CardTitle>
          <CardDescription>
            Log in met een eenmalige link in je mailbox om je aangemelde pace-treintjes te beheren,
            trainingen te plannen en mee te praten in het startvak.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Check je inbox!
              </div>
              <p>
                We hebben een inloglink gestuurd naar <strong>{email}</strong>. Klik op de link
                in die mail om direct verder te gaan.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="full-name" className="text-sm font-medium">
                  Voornaam (voor in het startvak)
                </label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Bijv. Niels"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  E-mailadres
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="jij@voorbeeld.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-destructive">{errorMsg}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Mail className="h-4 w-4" />
                {loading ? "Link versturen..." : "Stuur mijn inloglink"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}