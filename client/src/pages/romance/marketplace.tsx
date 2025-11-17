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
  Activity,
  BarChart3,
  Globe2,
  Handshake,
  Megaphone,
  Users2,
} from "lucide-react";

const envBase =
  (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
  "https://88away.com";
const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;

const marketplaceHighlights = [
  {
    icon: <BarChart3 className="h-6 w-6 text-romance-burgundy-500" />,
    title: "Revenue Intelligence",
    description:
      "Blend store sales, KU reads, direct sales, and Patreon pledges to view true read-through and ROI for every series and campaign.",
  },
  {
    icon: <Handshake className="h-6 w-6 text-romance-rose-gold-500" />,
    title: "Partnership Management",
    description:
      "Track affiliate payouts, box-set collaborations, and co-author contracts with automated revenue splits and performance dashboards.",
  },
  {
    icon: <Globe2 className="h-6 w-6 text-romance-champagne-500" />,
    title: "Territory Expansion",
    description:
      "Identify international storefronts and translation partners aligned with your tropes, price points, and release cadence.",
  },
];

const growthSignals = [
  "Reader cohort retention segmented by trope, POV, and heat level.",
  "Ad platform attribution unified with BookBub, TikTok, Meta, and AMS data.",
  "Merchandise and subscription analytics layered onto core book revenue.",
];

export default function RomanceMarketplacePage() {
  return (
    <>
      <Seo
        title="Romance Marketplace Insights"
        description="Scale romance publishing revenue with unified analytics, partner management, and reader cohort intelligence built for multi-channel authors."
        keywords={[
          "romance marketing analytics",
          "book revenue dashboard",
          "co-author revenue splits",
          "romance audience insights",
          "direct sales for authors",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Romance Marketplace Analytics",
            description:
              "Track romance publishing revenue, partnerships, and reader cohorts to scale your author business with data-backed decisions.",
            url: `${siteUrl}/romance/marketplace`,
            mainEntityOfPage: `${siteUrl}/romance/marketplace`,
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
                name: "Marketplace & Analytics",
                item: `${siteUrl}/romance/marketplace`,
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
              Turn Romance Readership into a Predictable Business
            </h1>
            <p className="text-lg md:text-xl text-romance-burgundy-700 max-w-3xl mb-8">
              Monitor revenue, partnerships, and reader engagement across every
              channel—from KU and audio to direct subscription models—and know
              exactly which levers to pull next.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-romance-burgundy-600 hover:bg-romance-burgundy-700"
                onClick={() => (window.location.href = "/api/login")}
              >
                Connect My Sales Channels
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-romance-burgundy-300 text-romance-burgundy-700 hover:bg-romance-burgundy-100"
              >
                Schedule Growth Audit
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-6 md:grid-cols-3">
              {marketplaceHighlights.map((feature) => (
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
                  Reader Signals that Power Smarter Releases
                </h2>
                <p className="text-romance-burgundy-700 mb-6">
                  Combine qualitative feedback, trope preferences, and spend
                  velocity to forecast lifetime value and retain superfans across
                  every platform.
                </p>
                <ul className="space-y-3 text-romance-burgundy-700">
                  {growthSignals.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Users2 className="h-5 w-5 mt-0.5 text-romance-burgundy-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="bg-white shadow-lg border-romance-blush-200">
                <CardHeader>
                  <CardTitle className="text-xl text-romance-burgundy-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-romance-burgundy-500" />
                    Series Health Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-romance-burgundy-700">
                  <div className="border border-romance-blush-200 rounded-lg p-3">
                    <p className="font-semibold">KU Rank Momentum</p>
                    <p>+28% week-over-week, peak rank #512 overall Kindle Store</p>
                  </div>
                  <div className="border border-romance-blush-200 rounded-lg p-3">
                    <p className="font-semibold">Direct Store Conversion</p>
                    <p>3.4% average with upsell sequences for audiobook bundles</p>
                  </div>
                  <div className="border border-romance-blush-200 rounded-lg p-3">
                    <p className="font-semibold">Launch Squad Performance</p>
                    <p>62% of ambassadors delivered promo assets within 48 hours</p>
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
                    <Megaphone className="h-5 w-5 text-romance-burgundy-500" />
                    Campaign Attribution Clarity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-romance-burgundy-700">
                  <p>
                    Align ad spend with sell-through by tying creative variants to
                    KU borrows, direct store purchases, and audiobook upgrades.
                  </p>
                  <p>
                    Track influencer-generated content and newsletter swaps with
                    UTMs, first-click timestamps, and payout automation.
                  </p>
                </CardContent>
              </Card>
              <div className="space-y-6 order-1 md:order-2">
                <h2 className="text-3xl font-serif font-semibold text-romance-burgundy-900">
                  Strategic Partnerships That Scale with You
                </h2>
                <p className="text-romance-burgundy-700">
                  Onboard co-authors, voice actors, narrators, and affiliate
                  partners into the same workspace so everyone sees the same KPIs
                  and payout schedules.
                </p>
                <div className="grid gap-3">
                  {[
                    "Automated royalty statements and 1099-ready exports.",
                    "Granular permission controls for agents, assistants, and marketing teams.",
                    "Shared dashboards for book boxes, subscription tiers, and brand collaborations.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-romance-burgundy-700"
                    >
                      <Handshake className="h-5 w-5 mt-0.5 text-romance-burgundy-500" />
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
