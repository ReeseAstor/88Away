import OpenAI from "openai";

const FALLBACK_MODELS = [
  "gpt-4.1-mini",
  "gpt-4o-mini",
  "gpt-4",
  "gpt-3.5-turbo",
];

export type KdpFictionTrendsEditionDraft = {
  slug: string;
  issueDate: string; // YYYY-MM-DD
  title: string;
  summary: string;
  htmlContent: string;
  textContent: string;
  metadata: Record<string, any>;
};

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: key });
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function slugForIssueDate(issueDate: string): string {
  return `kdp-fiction-trends-${issueDate}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateDailyKdpFictionTrendsEdition(params?: {
  date?: Date;
  publicArchiveUrl?: string; // e.g. https://example.com/newsletter
}): Promise<KdpFictionTrendsEditionDraft> {
  const date = params?.date ?? new Date();
  const issueDate = toISODate(date);
  const slug = slugForIssueDate(issueDate);
  const publicArchiveUrl = params?.publicArchiveUrl;

  const system = [
    "You are a publishing analyst writing a daily newsletter for indie fiction authors on Amazon KDP.",
    "Be helpful, tactical, and concise.",
    "Do NOT claim you scraped, measured, or saw real-time Amazon data unless it is explicitly provided.",
    "If you mention trends, phrase them as hypotheses, patterns, or signals, and include a short disclaimer.",
    "Avoid fabricating numbers, rankings, or specific bestseller lists.",
    "Output MUST be valid JSON.",
    "The JSON keys must be: title, summary, html, tags.",
    "The `html` must be a complete HTML fragment suitable for an email body (no <html>/<body> tags).",
  ].join("\n");

  const user = [
    `Date: ${issueDate}`,
    publicArchiveUrl ? `Archive URL: ${publicArchiveUrl}` : "",
    "Audience: KDP fiction authors (with emphasis on genre fiction and rapid-release strategies).",
    "Write one daily issue with:",
    "- a short 1-paragraph intro",
    "- 5 'Signals to watch' bullets",
    "- 3 'Actionable moves today' bullets",
    "- 10 keyword ideas (long-tail phrases)",
    "- 5 cover/blurb hook lines",
    "- 1 short section called 'Ads note' with 2 bullets",
    "- a closing CTA to subscribe and read the archive",
    "Include a brief disclaimer near the top: 'This is an analysis newsletter; verify in your niche before acting.'",
    "Return JSON with:",
    "- title: string",
    "- summary: string (max 220 chars)",
    "- html: string",
    "- tags: string[] (5-10 tags)",
  ]
    .filter(Boolean)
    .join("\n");

  const client = getClient();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const resp = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1600,
      });

      const content = resp.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty AI response");
      }

      const parsed = JSON.parse(content) as {
        title: string;
        summary: string;
        html: string;
        tags: string[];
      };

      const htmlContent = String(parsed.html || "").trim();
      const textContent = stripHtml(htmlContent);

      return {
        slug,
        issueDate,
        title: String(parsed.title || `Daily KDP Fiction Trends — ${issueDate}`),
        summary: String(parsed.summary || "Daily KDP fiction trend signals and actions."),
        htmlContent,
        textContent,
        metadata: {
          model,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to generate newsletter edition: ${lastError?.message || String(lastError)}`);
}
