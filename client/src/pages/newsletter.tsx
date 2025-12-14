import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type NewsletterEditionListItem = {
  slug: string;
  issueDate: string;
  title: string;
  summary?: string | null;
  publishedAt?: string | null;
};

export default function NewsletterArchivePage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const unsubscribed = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("unsubscribed") === "1";
    } catch {
      return false;
    }
  }, []);

  const editionsQuery = useQuery<{ slug: string; issueDate: string; title: string; summary?: string | null; publishedAt?: any }[]>(
    {
      queryKey: ["newsletter-editions"],
      queryFn: async () => {
        const res = await fetch("/api/newsletter/editions");
        if (!res.ok) throw new Error("Failed to load newsletter editions");
        return await res.json();
      },
    }
  );

  const editions: NewsletterEditionListItem[] = (editionsQuery.data || []).map((e) => ({
    slug: e.slug,
    issueDate: e.issueDate,
    title: e.title,
    summary: e.summary ?? null,
    publishedAt: e.publishedAt ? String(e.publishedAt) : null,
  }));

  async function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: "Subscription failed",
        description: data?.message || "Please check your email address and try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Subscribed",
      description: "You’ll receive the daily KDP fiction trend newsletter.",
    });
    setEmail("");
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Daily KDP Fiction Trends</h1>
          <p className="text-muted-foreground mt-2">
            A daily trend-analysis newsletter for indie fiction authors. This is an analysis newsletter; verify in your niche before acting.
          </p>
          {unsubscribed ? (
            <p className="mt-3 text-sm text-muted-foreground">You’ve been unsubscribed.</p>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscribe</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={onSubscribe}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                required
              />
              <Button type="submit">Subscribe</Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              You can unsubscribe anytime from a link in the email.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archive</CardTitle>
          </CardHeader>
          <CardContent>
            {editionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : editionsQuery.isError ? (
              <p className="text-sm text-muted-foreground">Failed to load issues.</p>
            ) : editions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues published yet.</p>
            ) : (
              <div className="space-y-4">
                {editions.map((issue) => (
                  <div key={issue.slug} className="border rounded-lg p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/newsletter/${issue.slug}`} className="font-semibold hover:underline">
                        {issue.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">{issue.issueDate}</span>
                    </div>
                    {issue.summary ? (
                      <p className="text-sm text-muted-foreground mt-2">{issue.summary}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
