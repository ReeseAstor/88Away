import { Seo } from "@/components/seo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CalendarRange,
  Layers,
  LineChart,
  ListChecks,
  Sparkles,
} from "lucide-react";

const envBase =
  (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
  "https://88away.com";
const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;

const featureHighlights = [
  {
    icon: <Layers className="h-6 w-6 text-romance-burgundy-500" />,
    title: "Series Bible Automation",
    description:
      "Organize characters, tropes, and subplots across every installment with linked story bibles that stay in sync as you write.",
  },
  {
    icon: <CalendarRange className="h-6 w-6 text-romance-rose-gold-500" />,
    title: "Publishing Roadmaps",
    description:
      "Map production schedules, beta reading cycles, and launch campaigns with granular milestone tracking for each book.",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-romance-champagne-500" />,
    title: "AI Continuity Support",
    description:
      "Lean on the Muse, Editor, and Coach personas to safeguard continuity, accelerate drafting, and refine voice for multi-book arcs.",
  },
];

const planningMilestones = [
  {
    title: "Series Blueprint Workshop",
    content:
      "Define overarching arcs, trope progression, heat levels, and ideal release cadence with guided templates tailored for romance publishing.",
  },
  {
    title: "Visual Relationship Mapping",
    content:
      "Capture chemistry, family trees, and recurring side characters with embeddable diagrams that update everywhere they’re referenced.",
  },
  {
    title: "Performance Analytics",
    content:
      "Monitor preorders, KU read-through, and sell-through trajectory to adapt marketing pushes before the next installment drops.",
  },
];

export default function RomanceSeriesPage() {
  return (
    <>
      <Seo
        title="Romance Series Management"
        description="Design binge-worthy romance series with AI-assisted plotting, production roadmaps, and performance analytics built for multi-book universes."
        keywords={[
          "romance series planner",
          "book series management software",
          "romance publishing workflow",
          "series bible for romance authors",
          "AI plotting companion",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Romance Series Management Platform",
            description:
              "Plan, produce, and optimize romance book series with AI-assisted story development, publishing timelines, and revenue analytics.",
            url: `${siteUrl}/romance/series`,
            mainEntityOfPage: `${siteUrl}/romance/series`,
            publisher: {
              "@type": "Organization",
              name: "88Away",
              url: siteUrl,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Romance Platform",
                item: `${siteUrl}/romance/series`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Series Management",
                item: `${siteUrl}/romance/series`,
              },
            ],
          },
        ]}
      />

      <div className="bg-background text-foreground">
        <section className="py-20 bg-romance-blush-50 border-b border-romance-blush-200">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <Badge className="mb-4 bg-romance-burgundy-600">
              Romance Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-semibold text-romance-burgundy-900 mb-6">
              Build a Romance Universe Readers Binge
            </h1>
            <p className="text-lg md:text-xl text-romance-burgundy-700 max-w-3xl mb-8">
              Construct multi-book arcs, maintain series continuity, and launch
              every installment on time with a studio-grade planning system
              built exclusively for romance authors and production teams.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-romance-burgundy-600 hover:bg-romance-burgundy-700"
                onClick={() => (window.location.href = "/api/login")}
              >
                Start Your Series Roadmap
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-romance-burgundy-300 text-romance-burgundy-700 hover:bg-romance-burgundy-100"
              >
                Talk to Publishing Strategist
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-6 md:grid-cols-3">
              {featureHighlights.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-romance-blush-200 shadow-sm"
                >
                  <CardHeader className="space-y-3">
                    <div className="inline-flex items-center justify-center rounded-full bg-romance-blush-100 p-3">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-romance-burgundy-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-romance-burgundy-700">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-romance-rose-gold-25 border-y border-romance-rose-gold-100">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-8 md:grid-cols-[1.5fr,1fr] items-start">
              <div>
                <h2 className="text-3xl font-serif font-semibold text-romance-burgundy-900 mb-4">
                  Production Milestones You Can Trust
                </h2>
                <p className="text-romance-burgundy-700 mb-6">
                  Track every deliverable—from first draft to audiobook—to keep
                  co-writers, editors, narrators, and marketing partners aligned
                  on what’s shipping next.
                </p>
                <div className="space-y-4">
                  {planningMilestones.map((milestone) => (
                    <Card key={milestone.title} className="bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-romance-burgundy-800">
                          {milestone.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-romance-burgundy-700 leading-relaxed">
                          {milestone.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <Card className="bg-white shadow-lg border-romance-blush-200">
                <CardHeader>
                  <CardTitle className="text-romance-burgundy-900 text-xl flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-romance-burgundy-500" />
                    Release Cadence Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Average Days Between Launches
                      </p>
                      <p className="text-2xl font-semibold text-romance-burgundy-800">
                        62
                      </p>
                    </div>
                    <Badge className="bg-romance-burgundy-600">
                      +12% Faster YoY
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {["Preorders", "KU Read-Through", "Series Sell-Through"].map(
                      (label) => (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {label}
                            </span>
                            <span className="text-sm font-medium text-romance-burgundy-700">
                              {label === "Preorders" ? "+18%" : "+9%"}
                            </span>
                          </div>
                          <div className="h-2 bg-romance-blush-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-romance-burgundy-500 rounded-full"
                              style={{
                                width:
                                  label === "Preorders"
                                    ? "74%"
                                    : label === "KU Read-Through"
                                    ? "81%"
                                    : "67%",
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-semibold text-romance-burgundy-900">
                  Collaboration Designed for Romance Imprints
                </h2>
                <p className="text-romance-burgundy-700">
                  Give co-authors, editors, narrators, and ad strategists the
                  exact context they need—without exposing spoiler-sensitive
                  twists or works in progress before you’re ready.
                </p>
                <ul className="space-y-3 text-romance-burgundy-700">
                  {[
                    "Role-based access controls for assistants, narrators, and publicists",
                    "Unified comment threads and editorial history for every chapter",
                    "Automated reminders for cover briefs, audio files, and preorder assets",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ListChecks className="h-5 w-5 mt-0.5 text-romance-burgundy-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="border-romance-blush-200 bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-romance-burgundy-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-romance-burgundy-500" />
                    Sample Series Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">
                      Series
                    </p>
                    <p className="text-lg font-semibold text-romance-burgundy-800">
                      Moonlit Harbor Duet
                    </p>
                    <p className="text-sm text-romance-burgundy-700">
                      Contemporary small-town romance with dual timelines and
                      evolving found family arcs.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { label: "Heat Level", value: "Warm (Level 2)" },
                      { label: "Primary Tropes", value: "Second Chance, Found Family, Redemption Arc" },
                      { label: "Release Cadence", value: "Every 8 weeks" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between border border-romance-blush-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm font-medium text-romance-burgundy-700">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
