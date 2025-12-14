import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NewsletterEdition = {
  slug: string;
  issueDate: string;
  title: string;
  summary?: string | null;
  htmlContent: string;
  publishedAt?: string | null;
};

export default function NewsletterIssuePage() {
  const [match, params] = useRoute("/newsletter/:slug");
  const slug = match ? (params as any).slug : null;

  const editionQuery = useQuery<NewsletterEdition>({
    queryKey: ["newsletter-edition", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/editions/${slug}`);
      if (!res.ok) throw new Error("Issue not found");
      return await res.json();
    },
  });

  if (!slug) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm text-muted-foreground">Issue not found.</p>
        <Link href="/newsletter" className="text-sm underline">
          Back to archive
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/newsletter" className="text-sm text-muted-foreground hover:underline">
          ← Back to archive
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editionQuery.isLoading ? "Loading…" : editionQuery.data?.title || "Newsletter Issue"}
          </CardTitle>
          {editionQuery.data?.issueDate ? (
            <p className="text-sm text-muted-foreground mt-1">{editionQuery.data.issueDate}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          {editionQuery.isError ? (
            <p className="text-sm text-muted-foreground">Could not load this issue.</p>
          ) : editionQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div
              className="prose prose-neutral max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: editionQuery.data?.htmlContent || "" }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
