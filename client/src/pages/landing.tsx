import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Edit3,
  Feather,
  FileText,
  Globe,
  Layers,
  Lightbulb,
  Mail,
  MapPin,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
  Quote,
} from "lucide-react";
import logo from "@/assets/88away-logo-pink.png";
import logoWhite from "@/assets/88away-logo-white.png";
import { Seo } from "@/components/seo";

export default function Landing() {
  const envBase =
    (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
    "https://88away.com";
  const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
  const shareImageUrl = `${siteUrl}${logo}`;

  const heroHighlights = [
    { value: "2.4M+", label: "Words outlined monthly" },
    { value: "92%", label: "See faster drafts" },
    { value: "50+", label: "Story bible templates" },
  ];

  const experienceBadges = [
    { label: "Muse Creativity Engine", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Branch-safe Collaboration", icon: <Layers className="h-4 w-4" /> },
    { label: "SOC-II Ready Security", icon: <Shield className="h-4 w-4" /> },
  ];

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-accent" />,
      title: "Story Bible Management",
      description:
        "Organize characters, worldbuilding, and timelines in one comprehensive system.",
      stat: "Unified canvas for 6+ narrative views",
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-chart-1" />,
      title: "AI Writing Assistant",
      description:
        "Three specialized personas - Muse for creativity, Editor for polish, Coach for planning.",
      stat: "Context aware up to 30K words",
    },
    {
      icon: <Users className="h-8 w-8 text-chart-2" />,
      title: "Team Collaboration",
      description:
        "Role-based access control with Owner, Editor, Reviewer, and Reader permissions.",
      stat: "Live presence & branching",
    },
    {
      icon: <Shield className="h-8 w-8 text-destructive" />,
      title: "Version Control",
      description:
        "Track document history and collaborate seamlessly with your team.",
      stat: "Diff views across scenes",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      features: [
        "1 Active Project",
        "Basic AI Assistance (10 sessions/month)",
        "Character & World Database",
        "Export to JSON",
        "Email Support"
      ],
      cta: "Start Free Trial",
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      features: [
        "5 Active Projects",
        "Advanced AI Assistance (100 sessions/month)",
        "Team Collaboration (up to 5 members)",
        "Advanced Export (PDF, ePub)",
        "Priority Support",
        "Version History"
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      features: [
        "Unlimited Projects",
        "Unlimited AI Sessions",
        "Team Collaboration (unlimited)",
        "Custom Export Options",
        "Dedicated Support",
        "Advanced Analytics",
        "Custom Integrations"
      ],
      cta: "Contact Sales",
    },
  ];

  const workflowSteps = [
    {
      icon: <Feather className="h-5 w-5 text-romance-burgundy-600" />,
      title: "Capture Concepts",
      description:
        "Start with romantic tropes, brand tone, and story arcs using adaptive templates.",
      duration: "~5 mins",
    },
    {
      icon: <Target className="h-5 w-5 text-chart-2" />,
      title: "Structure & Plan",
      description:
        "Muse, Editor, and Coach co-create beat sheets, POV maps, and production schedules.",
      duration: "~12 mins",
    },
    {
      icon: <Layers className="h-5 w-5 text-chart-1" />,
      title: "Branch & Collaborate",
      description:
        "Invite co-authors with guarded branches, inline comments, and merge-ready diffs.",
      duration: "Live",
    },
    {
      icon: <Clock3 className="h-5 w-5 text-destructive" />,
      title: "Publish Confidently",
      description:
        "Export to ePub, PDF, KDP-ready packages, and sync metadata to marketplaces.",
      duration: "Instant",
    },
  ];

  const testimonials = [
    {
      quote:
        "We've replaced six different tools with 88Away. The branching editor keeps creative chaos organized without losing spontaneity.",
      name: "Ivy Calder",
      role: "USA Today Bestselling Author",
      badge: "8-book series",
    },
    {
      quote:
        "Our writers' room finally has a single source of truth. Version diffing plus AI personas lets junior writers deliver senior-level drafts.",
      name: "Mika Ren",
      role: "Head of Story, Lumen Studios",
      badge: "12 person team",
    },
    {
      quote:
        "From timeline planning to polished copy, 88Away covers the entire workflow. The Muse persona is now a non-negotiable creative partner.",
      name: "Cassidy Vale",
      role: "Editor-in-Chief, Northwind Press",
      badge: "4 imprints",
    },
  ];

  return (
    <>
      <Seo
        title="AI Writing Software for Professional Authors"
        description="Plan, write, and publish your stories with AI-powered assistance, worldbuilding databases, and collaborative workflows built for professional authors."
        keywords={[
          "AI writing software",
          "story bible management",
          "author collaboration platform",
          "novel planning tools",
          "creative writing AI",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "88Away",
            url: siteUrl,
            logo: shareImageUrl,
            contactPoint: {
              "@type": "ContactPoint",
              email: "info@88away.com",
              contactType: "customer support",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: siteUrl,
            name: "88Away",
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "88Away",
            applicationCategory: "ProductivityApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "9.00",
              priceCurrency: "USD",
              priceSpecification: [
                {
                  "@type": "UnitPriceSpecification",
                  price: "9.00",
                  priceCurrency: "USD",
                  description: "Starter monthly plan",
                },
                {
                  "@type": "UnitPriceSpecification",
                  price: "29.00",
                  priceCurrency: "USD",
                  description: "Professional monthly plan",
                },
              ],
            },
            description:
              "88Away is a professional writing platform that combines AI-assisted drafting, story bible management, and real-time collaboration for storytelling teams.",
            url: siteUrl,
            image: shareImageUrl,
          },
        ]}
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-background to-background" />
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.35),_transparent_45%)]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
            <div className="flex flex-col items-center text-center gap-10">
              <div className="flex items-center gap-3 rounded-full border border-primary/40 bg-primary/30 px-4 py-2 text-sm font-medium text-primary-foreground/80">
                <Sparkles className="h-4 w-4 text-accent-foreground" />
                <span>From first spark to finished series</span>
              </div>
              <div className="flex items-center justify-center">
                <img src={logo} alt="88Away Logo" className="h-20 w-auto drop-shadow-md" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground max-w-4xl">
                Craft romance universes with cinematic clarity and intelligent collaboration.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground/90 max-w-2xl leading-relaxed">
                88Away unifies AI companions, story bible management, and secure branching workflows so every author, editor, and producer ships unforgettable stories on schedule.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 shadow-lg shadow-accent/30"
                  onClick={() => (window.location.href = "/api/login")}
                  data-testid="button-get-started"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-2"
                  data-testid="button-learn-more"
                >
                  See Platform Tour
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                {heroHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur px-6 py-5 text-start shadow-sm shadow-border/40 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Experience badges */}
        <div className="bg-gradient-to-r from-background via-primary/20 to-background border-b border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap gap-4 justify-center">
            {experienceBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground/90 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-accent/60"
              >
                {badge.icon}
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Section */}
        <div className="py-12 bg-card border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Trusted by romance publishers, showrunners, and indie collectives
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-muted-foreground/80 text-base font-semibold">
              <span>Northwind Press</span>
              <span>Lumen Studios</span>
              <span>Rose & Ember</span>
              <span>Midnight Writers</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                <Star className="h-3.5 w-3.5" />
                Feature Suite
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-card-foreground mt-4">
                Everything you need to craft your story
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
                Professional writing tools designed for authors who demand the best from their creative process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden border-border/60 bg-gradient-to-b from-card to-background/80 transition-all duration-300 hover:-translate-y-2 hover:border-accent/60 hover:shadow-xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-chart-1 via-accent to-chart-3 opacity-70" />
                  <CardHeader>
                    <div className="flex justify-center mb-4">{feature.icon}</div>
                    <CardTitle className="text-xl text-center">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                      {feature.stat}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* AI Personas Section */}
        <div className="py-24 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
                <Sparkles className="h-3.5 w-3.5" />
                Intelligent Personas
              </p>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Meet Your AI Writing Companions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three specialized AI personas designed to assist every aspect of your writing journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="relative overflow-hidden border border-chart-1/60">
                <div className="absolute top-0 left-0 w-full h-1 bg-chart-1" />
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                      <Lightbulb className="h-6 w-6 text-chart-1" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Muse</CardTitle>
                      <CardDescription>Creative Inspiration</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Generate evocative scenes with rich sensory details and emotional depth.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Sensory-rich scene generation</li>
                    <li>• Character voice development</li>
                    <li>• Emotional depth enhancement</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border border-accent/70">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Edit3 className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Editor</CardTitle>
                      <CardDescription>Polish & Refine</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Improve clarity, grammar, and flow while preserving your unique voice.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Grammar and clarity improvements</li>
                    <li>• Voice preservation</li>
                    <li>• Flow optimization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border border-chart-2/60">
                <div className="absolute top-0 left-0 w-full h-1 bg-chart-2" />
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-chart-2" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Coach</CardTitle>
                      <CardDescription>Structure & Planning</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Create outlines, story beats, and structural guidance for your narrative.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Story structure development</li>
                    <li>• Beat sheet creation</li>
                    <li>• Plot planning assistance</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="py-20 bg-card border-y border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                Workflow
              </p>
              <h2 className="text-3xl font-bold mt-4 text-card-foreground">A cinematic pipeline from spark to shelf</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Guide every stakeholder with a living, visual pipeline tailor-made for romance and serial storytelling.
              </p>
            </div>
            <div className="space-y-6">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex flex-col md:flex-row gap-4 rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm transition hover:border-accent/60 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4 md:w-1/3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/40">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground/70">Step {index + 1}</p>
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                    </div>
                  </div>
                  <div className="flex-1 text-muted-foreground">{step.description}</div>
                  <div className="text-sm font-medium text-foreground/80 rounded-full bg-primary/30 px-4 py-1 self-start">
                    {step.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="py-24 bg-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-card-foreground mb-4">
                Choose Your Writing Journey
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Professional plans designed for every stage of your writing career.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden border-2 ${
                    plan.popular ? "border-accent shadow-xl" : "border-border/60"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium shadow">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-0">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center mt-4">
                      <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-4 w-4 text-chart-1 mr-3 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => (window.location.href = "/api/login")}
                      data-testid={`button-plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="py-24 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                <Quote className="h-4 w-4" />
                Proof in practice
              </p>
              <h2 className="text-3xl font-bold mt-4">Writers' rooms that swear by 88Away</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Teams of every shape rely on AI personas, battle-tested controls, and beautiful exports to ship their universes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.name}
                  className="border-border/60 bg-card/80 p-6 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
                >
                  <p className="text-muted-foreground mb-6 leading-relaxed">“{testimonial.quote}”</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70 mt-3 inline-block">
                      {testimonial.badge}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-gradient-to-b from-background via-primary/20 to-background">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to transform your writing process?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of authors who trust 88Away to bring their stories to life.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => (window.location.href = "/api/login")}
              data-testid="button-cta-start"
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Your Free Trial
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-primary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <img
                  src={logoWhite}
                  alt="88Away Logo"
                  className="h-12 w-auto brightness-0 invert opacity-90"
                />
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-primary-foreground/90 font-medium">88Away LLC</p>
                <div className="flex items-center justify-center space-x-4 text-sm text-primary-foreground/70">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>NYC</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    <a
                      href="mailto:info@88away.com"
                      className="hover:text-primary-foreground/90 transition-colors"
                    >
                      info@88away.com
                    </a>
                  </div>
                </div>
              </div>
              <p className="text-primary-foreground/60 text-xs">
                © 2024 88Away LLC. All rights reserved. Professional writing platform for modern authors.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
