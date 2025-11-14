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
  Binary,
  Compass,
  Heart,
  ListPlus,
  Quote,
  Share2,
  Sparkle,
} from "lucide-react";

const envBase =
  (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
  "https://88away.com";
const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;

const tropePlaybooks = [
  {
    icon: <Heart className="h-6 w-6 text-romance-burgundy-500" />,
    title: "Classic Crowd Pleasers",
    description:
      "Friends-to-lovers, enemies-to-lovers, and second chance arcs with auto-generated beat sheets tailored to your ideal heat level.",
  },
  {
    icon: <Compass className="h-6 w-6 text-romance-rose-gold-500" />,
    title: "Subgenre Discovery",
    description:
      "See which tropes trend across contemporary, historical, fantasy, queer, and paranormal romance niches with data-backed guidance.",
  },
  {
    icon: <Share2 className="h-6 w-6 text-romance-champagne-500" />,
    title: "Series Cohesion",
    description:
      "Plan trope escalation across trilogies and spin-offs to keep readers invested while avoiding repetitive story beats.",
  },
];

const aiAssistants = [
  "Generate fresh trope mashups with tone guidelines for your brand.",
  "Craft chemistry-building scenes with sensory prompts and voice cues.",
  "Surface continuity flags when a trope encounters timeline conflicts.",
];

export default function RomanceTropesPage() {
  return (
    <>
      <Seo
        title="Romance Trope Intelligence"
        description="Blend proven romance tropes with fresh twists using AI-generated beat sheets, reader trend analytics, and voice-preserving writing partners."
        keywords={[
          "romance tropes",
          "tropes database",
          "romance writing prompts",
          "AI trope generator",
          "romance market trends",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Romance Trope Intelligence Platform",
            description:
              "Unlock romance trope playbooks, market insights, and AI drafting prompts to keep your stories irresistible.",
            url: `${siteUrl}/romance/tropes`,
            mainEntityOfPage: `${siteUrl}/romance/tropes`,
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
                name: "Trope Intelligence",
                item: `${siteUrl}/romance/tropes`,
              },
            ],
          },
        ]}
      />

      <div className="bg-background text-foreground">
        <section className="py-20 bg-romance-rose-gold-25 border-b border-romance-rose-gold-100">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <Badge className="mb-4 bg-romance-burgundy-600">
              Romance Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-semibold text-romance-burgundy-900 mb-6">
              Build Chemistry with Data-Driven Trope Playbooks
            </h1>
            <p className="text-lg md:text-xl text-romance-burgundy-700 max-w-3xl mb-8">
              Match your brand voice to market trends, plan trope progression
              across series, and brainstorm fresh, on-genre twists alongside AI
              collaborators that understand romance readers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-romance-burgundy-600 hover:bg-romance-burgundy-700"
                onClick={() => (window.location.href = "/api/login")}
              >
                Explore Trope Library
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-romance-burgundy-300 text-romance-burgundy-700 hover:bg-romance-burgundy-100"
              >
                Download Trend Report
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-6 md:grid-cols-3">
              {tropePlaybooks.map((feature) => (
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

        <section className="py-16 bg-romance-blush-50 border-y border-romance-blush-200">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] items-start">
              <div>
                <h2 className="text-3xl font-serif font-semibold text-romance-burgundy-900 mb-4">
                  AI Partners that Understand Romance Nuance
                </h2>
                <p className="text-romance-burgundy-700 mb-6">
                  The Muse, Editor, and Coach personas help you experiment with
                  new trope combinations without sacrificing reader expectations
                  or the emotional payoff you’re known for.
                </p>
                <ul className="space-y-3 text-romance-burgundy-700">
                  {aiAssistants.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Sparkle className="h-5 w-5 mt-0.5 text-romance-burgundy-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="bg-white shadow-lg border-romance-blush-200">
                <CardHeader>
                  <CardTitle className="text-xl text-romance-burgundy-900 flex items-center gap-2">
                    <ListPlus className="h-5 w-5 text-romance-burgundy-500" />
                    Dynamic Trope Brief
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">
                      Project
                    </p>
                    <p className="text-lg font-semibold text-romance-burgundy-800">
                      Slow-Burn Royalty x Bodyguard
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Emotional Promise",
                        value:
                          "Forbidden duty collides with devotion in a tense, slow-building partnership.",
                      },
                      {
                        label: "Reader Signals",
                        value:
                          "High stakes, forced proximity, chivalric code, rescue fantasy, loyalty tests.",
                      },
                      {
                        label: "Twist Ideas",
                        value:
                          "Bodyguard is undercover royal cousin, rivals hire the Muse persona villain for sabotage.",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="border border-romance-blush-200 rounded-lg px-3 py-2"
                      >
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm text-romance-burgundy-700">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <Card className="bg-white shadow-md border-romance-blush-200 order-2 md:order-1">
                <CardHeader>
                  <CardTitle className="text-xl text-romance-burgundy-900 flex items-center gap-2">
                    <Quote className="h-5 w-5 text-romance-burgundy-500" />
                    Voice Consistency Guardrails
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-romance-burgundy-700">
                  <p>
                    Upload sample chapters to help the Editor persona flag tone
                    shifts, anachronistic slang, or trope beats that undermine
                    your POV voice.
                  </p>
                  <p>
                    Generate alternative dialogue and narrative beats that stay
                    faithful to your cadence, humor, and heat preferences while
                    still evolving the trope payoff.
                  </p>
                </CardContent>
              </Card>
              <div className="space-y-6 order-1 md:order-2">
                <h2 className="text-3xl font-serif font-semibold text-romance-burgundy-900">
                  Reader Trend Forecasting for Smart Positioning
                </h2>
                <p className="text-romance-burgundy-700">
                  Blend historical sell-through data, KU velocity, and BookTok
                  chatter to decide which trope pairings get greenlit, which
                  covers to test, and how to stagger releases.
                </p>
                <div className="grid gap-3">
                  {[
                    "Identify rising trope mashups every quarter.",
                    "Spot saturation signals before you overcommit to a trend.",
                    "Pair subgenre metadata with marketing channels that convert.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-romance-burgundy-700"
                    >
                      <Binary className="h-5 w-5 text-romance-burgundy-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
