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
  ClipboardList,
  CloudUpload,
  DollarSign,
  FileStack,
  Layers3,
  Rocket,
} from "lucide-react";

const envBase =
  (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
  "https://88away.com";
const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;

const pipelineStages = [
  {
    icon: <ClipboardList className="h-6 w-6 text-romance-burgundy-500" />,
    title: "Production Command Center",
    description:
      "Route manuscripts through developmental editing, copy edits, beta readers, and line edits with dependency-aware task boards.",
  },
  {
    icon: <CloudUpload className="h-6 w-6 text-romance-rose-gold-500" />,
    title: "Automated Asset Delivery",
    description:
      "Deliver proofs, cover files, marketing copy, and audiobook chapters to the right stakeholders with expiration-aware secure links.",
  },
  {
    icon: <Rocket className="h-6 w-6 text-romance-champagne-500" />,
    title: "Launch Sequencing",
    description:
      "Coordinate newsletter drops, ad creative, influencer kits, and live events with reusable campaign templates tuned for romance readers.",
  },
];

const complianceHighlights = [
  "Track consent, content warnings, and accessibility metadata for every format.",
  "Maintain regional pricing, tax settings, and storefront assets in one source of truth.",
  "Export ONIX, EPUB, and audiobook packages that pass retail ingestion checks the first time.",
];

export default function RomancePublishingPage() {
  return (
    <>
      <Seo
        title="Romance Publishing Workflow"
        description="Run production, marketing, and distribution for romance releases with AI-assisted asset creation, compliance tracking, and campaign automation."
        keywords={[
          "romance publishing workflow",
          "indie romance production",
          "AI book marketing",
          "romance launch checklist",
          "ebook and paperback distribution",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Romance Publishing Pipeline",
            description:
              "Automate romance publishing workflows from final draft to global distribution with 88Away’s AI-powered toolkit.",
            url: `${siteUrl}/romance/publishing`,
            mainEntityOfPage: `${siteUrl}/romance/publishing`,
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
                name: "Publishing Workflow",
                item: `${siteUrl}/romance/publishing`,
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
              Publish Romance Releases with Studio-Level Precision
            </h1>
            <p className="text-lg md:text-xl text-romance-burgundy-700 max-w-3xl mb-8">
              From final edits to preorder campaigns, manage every stakeholder
              and asset in one workflow tailored to indie romance teams, boutique
              presses, and hybrid authors.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-romance-burgundy-600 hover:bg-romance-burgundy-700"
                onClick={() => (window.location.href = "/api/login")}
              >
                Automate My Launch Plan
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-romance-burgundy-300 text-romance-burgundy-700 hover:bg-romance-burgundy-100"
              >
                View Publishing Template
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4 md:px-8 max-w-6xl mx-auto">
            <div className="grid gap-6 md:grid-cols-3">
              {pipelineStages.map((feature) => (
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
            <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] items-start">
              <div>
                <h2 className="text-3xl font-serif font-semibold text-romance-burgundy-900 mb-4">
                  Compliance and Metadata Without Guesswork
                </h2>
                <p className="text-romance-burgundy-700 mb-6">
                  Capture everything retailers, subscription services, and
                  libraries require—including sensitivity warnings and bonus
                  content metadata—without chasing spreadsheets.
                </p>
                <ul className="space-y-3 text-romance-burgundy-700">
                  {complianceHighlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Layers3 className="h-5 w-5 mt-0.5 text-romance-burgundy-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="bg-white shadow-lg border-romance-blush-200">
                <CardHeader>
                  <CardTitle className="text-xl text-romance-burgundy-900 flex items-center gap-2">
                    <FileStack className="h-5 w-5 text-romance-burgundy-500" />
                    Format Deliverable Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-romance-burgundy-700">
                  <div className="border border-romance-blush-200 rounded-lg p-3">
                    <p className="font-semibold">Ebook Package</p>
                    <p>EPUB3 + Kindle Create + Daisy compatible output</p>
                  </div>
                  <div className="border border-romance-blush-200 rounded-lg p-3">
                    <p className="font-semibold">Print Interior & Cover</p>
                    <p>Trim-ready PDF with spine calc, matte & gloss variants</p>
                  </div>
                  <div className="border border-romance-blush-200 rounded-lg p-3">
                    <p className="font-semibold">Audiobook Toolkit</p>
                    <p>Chaptered WAV files, narrator briefs, marketing snippets</p>
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
                    <DollarSign className="h-5 w-5 text-romance-burgundy-500" />
                    Revenue Optimization Kit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-romance-burgundy-700">
                  <p>
                    Simulate pricing ladders, KU page-read forecasts, and
                    sell-through impacts before you lock in release bundles.
                  </p>
                  <p>
                    Sync marketing milestones with ad spend, influencer drops,
                    and CRM sequences to maintain momentum through week eight.
                  </p>
                </CardContent>
              </Card>
              <div className="space-y-6 order-1 md:order-2">
                <h2 className="text-3xl font-serif font-semibold text-romance-burgundy-900">
                  End-to-End Visibility for Every Launch
                </h2>
                <p className="text-romance-burgundy-700">
                  Keep co-writers, editors, designers, and publicists aligned
                  with dashboards that surface overdue tasks, content gaps, and
                  campaign health in real time.
                </p>
                <div className="grid gap-3">
                  {[
                    "Role-specific dashboards for production, marketing, and operations.",
                    "Live status indicators for preorder goals, arc feedback, and influencer outreach.",
                    "Automated retrospectives that capture lessons for your next launch cycle.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-romance-burgundy-700"
                    >
                      <Rocket className="h-5 w-5 mt-0.5 text-romance-burgundy-500" />
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
