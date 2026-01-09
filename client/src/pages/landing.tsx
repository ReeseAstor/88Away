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
  ChevronRight,
  Crown,
  Edit3,
  Feather,
  FileText,
  Globe,
  Heart,
  Layers,
  Lightbulb,
  Mail,
  MapPin,
  Palette,
  PenTool,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
  BookMarked,
  Award,
  BarChart3,
  Quote,
  Play,
  CheckCircle2,
} from "lucide-react";
import logo from "@/assets/88away-logo-pink.png";
import logoWhite from "@/assets/88away-logo-white.png";
import { Seo } from "@/components/seo";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

// Floating animation for decorative elements
const float = {
  animate: {
    y: [0, -15, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  }
};

const floatDelayed = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
  }
};

const floatSlow = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }
  }
};

// Counter animation hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, hasStarted]);

  return { count, start: () => setHasStarted(true) };
}

export default function Landing() {
  const envBase =
    (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
    "https://88away.com";
  const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
  const shareImageUrl = `${siteUrl}${logo}`;

  const wordsCounter = useCounter(2400000, 2500);
  const authorsCounter = useCounter(15000, 2000);
  const booksCounter = useCounter(8500, 2200);

  useEffect(() => {
    const timer = setTimeout(() => {
      wordsCounter.start();
      authorsCounter.start();
      booksCounter.start();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const impactStats = [
    {
      value: wordsCounter.count.toLocaleString() + "+",
      label: "Words Written Monthly",
      sublabel: "Across all projects",
      icon: <PenTool className="h-5 w-5" />
    },
    {
      value: authorsCounter.count.toLocaleString() + "+",
      label: "Professional Authors",
      sublabel: "Trust our platform",
      icon: <Users className="h-5 w-5" />
    },
    {
      value: booksCounter.count.toLocaleString() + "+",
      label: "Books Published",
      sublabel: "Using 88Away",
      icon: <BookMarked className="h-5 w-5" />
    },
  ];

  const trustedBy = [
    { name: "Northwind Press", books: "200+ titles" },
    { name: "Lumen Studios", books: "Entertainment" },
    { name: "Rose & Ember", books: "Romance Imprint" },
    { name: "Midnight Writers", books: "Indie Collective" },
    { name: "Sterling House", books: "Literary Fiction" },
  ];

  const platformFeatures = [
    {
      icon: <BookOpen className="h-7 w-7" />,
      title: "Story Bible System",
      description: "Organize characters, worlds, timelines, and plot arcs in a unified creative database. Never lose track of your story's DNA.",
      gradient: "from-romance-burgundy-500 to-romance-burgundy-600",
      stats: "6 narrative views",
    },
    {
      icon: <Sparkles className="h-7 w-7" />,
      title: "AI Writing Companions",
      description: "Three specialized AI personas - Muse for creativity, Editor for polish, Coach for planning - each trained for storytelling excellence.",
      gradient: "from-tender-500 to-tender-600",
      stats: "30K word context",
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: "Team Collaboration",
      description: "Real-time co-writing with granular permissions. Branch narratives, merge contributions, and maintain version control across your team.",
      gradient: "from-romance-rose-gold-500 to-romance-rose-gold-600",
      stats: "Live presence",
    },
    {
      icon: <TrendingUp className="h-7 w-7" />,
      title: "Publishing Pipeline",
      description: "Export to ePub, PDF, KDP-ready packages. Sync metadata to marketplaces. Track royalties and reader analytics in one dashboard.",
      gradient: "from-romance-champagne-500 to-romance-champagne-600",
      stats: "One-click publish",
    },
  ];

  const aiPersonas = [
    {
      name: "Muse",
      role: "Creative Inspiration",
      description: "Generate evocative scenes with rich sensory details. Develop unique character voices. Enhance emotional depth and narrative tension.",
      capabilities: ["Sensory-rich scene generation", "Character voice development", "Emotional arc enhancement", "Trope-aware suggestions"],
      color: "from-tender-400 to-tender-600",
      bgColor: "bg-tender-50",
      borderColor: "border-tender-200",
      icon: <Lightbulb className="h-8 w-8 text-tender-600" />,
    },
    {
      name: "Editor",
      role: "Polish & Refine",
      description: "Improve clarity, grammar, and flow while preserving your unique voice. Get professional-grade manuscript polish instantly.",
      capabilities: ["Grammar & style refinement", "Voice preservation", "Pacing optimization", "Consistency checking"],
      color: "from-romance-burgundy-400 to-romance-burgundy-600",
      bgColor: "bg-romance-burgundy-50",
      borderColor: "border-romance-burgundy-200",
      icon: <Edit3 className="h-8 w-8 text-romance-burgundy-600" />,
    },
    {
      name: "Coach",
      role: "Structure & Strategy",
      description: "Create outlines, story beats, and structural guidance. Plan series arcs, manage subplots, and hit your publishing deadlines.",
      capabilities: ["Beat sheet creation", "Series arc planning", "Deadline management", "Plot hole detection"],
      color: "from-romance-rose-gold-400 to-romance-rose-gold-600",
      bgColor: "bg-romance-rose-gold-50",
      borderColor: "border-romance-rose-gold-200",
      icon: <Target className="h-8 w-8 text-romance-rose-gold-600" />,
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Capture Your Vision",
      description: "Start with tropes, themes, and story seeds. Our adaptive templates help you crystallize your creative vision in minutes.",
      icon: <Feather className="h-6 w-6" />,
      color: "text-romance-burgundy-600",
      time: "5 min setup"
    },
    {
      step: "02",
      title: "Structure & Plan",
      description: "AI companions help create beat sheets, POV maps, and production schedules. See your entire series architecture at a glance.",
      icon: <Layers className="h-6 w-6" />,
      color: "text-tender-600",
      time: "15 min planning"
    },
    {
      step: "03",
      title: "Write & Collaborate",
      description: "Invite co-authors with role-based access. Use branching workflows, inline comments, and merge-ready diffs for seamless teamwork.",
      icon: <Users className="h-6 w-6" />,
      color: "text-romance-rose-gold-600",
      time: "Real-time"
    },
    {
      step: "04",
      title: "Publish & Grow",
      description: "Export to any format. Push to KDP, Draft2Digital, and more. Track performance with built-in royalty analytics.",
      icon: <Globe className="h-6 w-6" />,
      color: "text-romance-champagne-600",
      time: "One-click"
    },
  ];

  const testimonials = [
    {
      quote: "We've replaced six different tools with 88Away. The branching editor keeps creative chaos organized without losing spontaneity. My productivity has tripled.",
      name: "Ivy Calder",
      role: "USA Today Bestselling Author",
      metric: "8-book series",
      image: "IC",
      rating: 5,
    },
    {
      quote: "Our writers' room finally has a single source of truth. Version diffing plus AI personas lets junior writers deliver senior-level drafts. Game changer.",
      name: "Mika Ren",
      role: "Head of Story, Lumen Studios",
      metric: "12 person team",
      image: "MR",
      rating: 5,
    },
    {
      quote: "From timeline planning to polished copy, 88Away covers the entire workflow. The Muse persona is now a non-negotiable creative partner for our imprint.",
      name: "Cassidy Vale",
      role: "Editor-in-Chief, Northwind Press",
      metric: "4 imprints managed",
      image: "CV",
      rating: 5,
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Perfect for indie authors beginning their journey",
      features: [
        "1 Active Project",
        "Basic AI Assistance (10 sessions/month)",
        "Character & World Database",
        "Export to JSON & Markdown",
        "Email Support",
      ],
      cta: "Start Free Trial",
      highlight: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "For serious authors and small teams",
      features: [
        "5 Active Projects",
        "Advanced AI Assistance (100 sessions/month)",
        "Team Collaboration (up to 5 members)",
        "Advanced Export (PDF, ePub, DOCX)",
        "Priority Support",
        "Version History & Branching",
        "Series Management Tools",
      ],
      cta: "Get Started",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For publishing houses and production studios",
      features: [
        "Unlimited Projects",
        "Unlimited AI Sessions",
        "Unlimited Team Members",
        "Custom Export Templates",
        "Dedicated Account Manager",
        "Advanced Analytics & Reporting",
        "API Access & Integrations",
        "SSO & Advanced Security",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const comparisonFeatures = [
    { feature: "AI Writing Assistance", us: true, others: "Limited" },
    { feature: "Story Bible Database", us: true, others: false },
    { feature: "Real-time Collaboration", us: true, others: "Basic" },
    { feature: "Version Control & Branching", us: true, others: false },
    { feature: "Series Management", us: true, others: false },
    { feature: "One-click Publishing", us: true, others: "Manual" },
    { feature: "Royalty Analytics", us: true, others: false },
  ];

  return (
    <>
      <Seo
        title="88Away - The Premier Platform for Professional Authors"
        description="Plan, write, and publish your stories with AI-powered assistance, comprehensive worldbuilding databases, and collaborative workflows designed for professional authors and publishing teams."
        keywords={[
          "AI writing software",
          "story bible management",
          "author collaboration platform",
          "novel planning tools",
          "creative writing AI",
          "publishing platform",
          "book writing software",
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

      <div className="min-h-screen bg-background overflow-hidden">

        {/* ========== HERO SECTION ========== */}
        <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
          {/* Animated background layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-romance-burgundy-50/80 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.25),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(238,153,104,0.15),_transparent_50%)]" />

          {/* Floating decorative elements */}
          <motion.div
            className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-romance-burgundy-200/30 to-tender-200/30 rounded-full blur-3xl"
            variants={float}
            animate="animate"
          />
          <motion.div
            className="absolute bottom-32 right-[15%] w-96 h-96 bg-gradient-to-br from-romance-rose-gold-200/25 to-romance-champagne-200/25 rounded-full blur-3xl"
            variants={floatDelayed}
            animate="animate"
          />
          <motion.div
            className="absolute top-1/3 right-[5%] w-48 h-48 bg-gradient-to-br from-tender-200/20 to-romance-blush-200/20 rounded-full blur-2xl"
            variants={floatSlow}
            animate="animate"
          />

          {/* Decorative book/pen elements */}
          <motion.div
            className="absolute top-32 right-[20%] opacity-10"
            variants={floatDelayed}
            animate="animate"
          >
            <BookOpen className="h-24 w-24 text-romance-burgundy-600" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute bottom-48 left-[12%] opacity-10"
            variants={float}
            animate="animate"
          >
            <Feather className="h-20 w-20 text-tender-600" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute top-1/2 left-[5%] opacity-10"
            variants={floatSlow}
            animate="animate"
          >
            <Heart className="h-16 w-16 text-romance-blush-500" strokeWidth={1} />
          </motion.div>

          {/* Main hero content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <motion.div
              className="flex flex-col items-center text-center gap-8"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {/* Top badge */}
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 rounded-full border border-romance-burgundy-200/60 bg-white/60 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-romance-burgundy-700 shadow-lg shadow-romance-burgundy-500/10"
              >
                <Crown className="h-4 w-4 text-romance-champagne-500" />
                <span>The Premier Platform for Professional Authors</span>
                <Sparkles className="h-4 w-4 text-romance-burgundy-400" />
              </motion.div>

              {/* Logo */}
              <motion.div variants={scaleIn} className="flex items-center justify-center">
                <img
                  src={logo}
                  alt="88Away Logo"
                  className="h-20 sm:h-24 w-auto drop-shadow-xl"
                />
              </motion.div>

              {/* Main headline */}
              <motion.h1
                variants={fadeInUp}
                className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground max-w-5xl leading-[1.1]"
              >
                Where Stories{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-romance-burgundy-600 via-tender-500 to-romance-rose-gold-500 bg-clip-text text-transparent">
                    Come to Life
                  </span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-romance-champagne-200 to-romance-blush-200 -z-10 transform -rotate-1" />
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl leading-relaxed font-light"
              >
                The all-in-one writing platform that unifies <span className="text-foreground font-medium">AI companions</span>,
                <span className="text-foreground font-medium"> story bible management</span>, and
                <span className="text-foreground font-medium"> collaborative workflows</span> for authors who ship bestsellers.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Button
                  size="lg"
                  className="group relative text-lg px-10 py-7 bg-gradient-to-r from-romance-burgundy-600 to-romance-burgundy-700 hover:from-romance-burgundy-700 hover:to-romance-burgundy-800 shadow-xl shadow-romance-burgundy-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-romance-burgundy-500/30 hover:-translate-y-1"
                  onClick={() => (window.location.href = "/api/login")}
                  data-testid="button-get-started"
                >
                  <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Start Writing Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group text-lg px-10 py-7 border-2 border-romance-burgundy-200 hover:border-romance-burgundy-400 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
                  data-testid="button-watch-demo"
                >
                  <Play className="mr-2 h-5 w-5 text-romance-burgundy-600" />
                  Watch Demo
                  <span className="ml-2 text-sm text-muted-foreground">(2 min)</span>
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                variants={fadeIn}
                className="pt-8 flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-romance-champagne-400 text-romance-champagne-400" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    4.9/5 from 2,400+ authors
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  No credit card required · 14-day free trial · Cancel anytime
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ========== IMPACT STATS SECTION ========== */}
        <section className="relative py-20 bg-gradient-to-b from-background via-romance-burgundy-50/30 to-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
            >
              {impactStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="group relative"
                >
                  <div className="relative overflow-hidden rounded-3xl border border-romance-burgundy-100/80 bg-white/80 backdrop-blur-sm p-8 shadow-lg shadow-romance-burgundy-500/5 transition-all duration-500 hover:shadow-xl hover:shadow-romance-burgundy-500/10 hover:-translate-y-2 hover:border-romance-burgundy-200">
                    {/* Gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-romance-burgundy-400 via-tender-400 to-romance-rose-gold-400 opacity-60" />

                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-romance-burgundy-600 to-tender-600 bg-clip-text text-transparent">
                          {stat.value}
                        </p>
                        <p className="text-lg font-semibold text-foreground mt-2">{stat.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.sublabel}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-romance-burgundy-100 to-tender-100 text-romance-burgundy-600">
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== TRUSTED BY SECTION ========== */}
        <section className="py-16 border-y border-border/40 bg-card/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground mb-10">
                Trusted by leading publishers and storytelling teams
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                {trustedBy.map((company) => (
                  <div
                    key={company.name}
                    className="group flex flex-col items-center transition-all duration-300 hover:scale-105"
                  >
                    <span className="text-xl font-semibold text-muted-foreground/70 group-hover:text-foreground transition-colors">
                      {company.name}
                    </span>
                    <span className="text-xs text-muted-foreground/50 mt-1">{company.books}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========== PLATFORM FEATURES SECTION ========== */}
        <section className="py-28 bg-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-romance-burgundy-50/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-tender-50/50 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full bg-romance-burgundy-100/80 px-5 py-2 text-sm font-semibold text-romance-burgundy-700 mb-6">
                  <Palette className="h-4 w-4" />
                  Complete Writing Suite
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-romance-burgundy-600 to-tender-500 bg-clip-text text-transparent">
                  Ship Your Story
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Professional-grade tools designed for authors who demand excellence.
                From first spark to finished manuscript.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {platformFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                >
                  <Card className="group relative h-full overflow-hidden border-border/60 bg-white/80 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-romance-burgundy-500/10 hover:-translate-y-2 hover:border-romance-burgundy-200">
                    {/* Gradient top bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.gradient}`} />

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}>
                          {feature.icon}
                        </div>
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">
                          {feature.stats}
                        </span>
                      </div>
                      <CardTitle className="text-2xl mt-6 group-hover:text-romance-burgundy-700 transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== AI PERSONAS SECTION ========== */}
        <section className="py-28 bg-gradient-to-b from-romance-burgundy-50/40 via-background to-background relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-tender-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-romance-rose-gold-200/30 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full bg-tender-100/80 px-5 py-2 text-sm font-semibold text-tender-700 mb-6">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered Creativity
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                Meet Your{" "}
                <span className="bg-gradient-to-r from-tender-500 to-romance-burgundy-500 bg-clip-text text-transparent">
                  AI Writing Companions
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Three specialized AI personas, each trained for a distinct aspect of the creative process.
                They understand your story's context and adapt to your voice.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {aiPersonas.map((persona, index) => (
                <motion.div
                  key={persona.name}
                  variants={fadeInUp}
                >
                  <Card className={`group relative h-full overflow-hidden ${persona.bgColor} ${persona.borderColor} border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3`}>
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                    <CardHeader className="relative pb-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-4 rounded-2xl bg-white shadow-lg ${persona.borderColor} border`}>
                          {persona.icon}
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-serif">{persona.name}</CardTitle>
                          <CardDescription className="text-base font-medium">{persona.role}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative space-y-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {persona.description}
                      </p>
                      <div className="space-y-3">
                        {persona.capabilities.map((capability) => (
                          <div key={capability} className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{capability}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== WORKFLOW SECTION ========== */}
        <section className="py-28 bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(219,39,119,0.03)_50%,transparent_100%)]" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full bg-romance-rose-gold-100/80 px-5 py-2 text-sm font-semibold text-romance-rose-gold-700 mb-6">
                  <Globe className="h-4 w-4" />
                  Streamlined Workflow
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                From Spark to{" "}
                <span className="bg-gradient-to-r from-romance-rose-gold-500 to-romance-champagne-500 bg-clip-text text-transparent">
                  Bestseller
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                A cinematic pipeline designed for romance authors and serial storytellers.
                Every step optimized for creative flow.
              </motion.p>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={fadeInUp}
                  className="group"
                >
                  <div className="relative flex flex-col md:flex-row items-start gap-6 rounded-3xl border border-border/60 bg-background/80 backdrop-blur-sm p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-romance-burgundy-200 hover:-translate-y-1">
                    {/* Step number */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-romance-burgundy-100 to-tender-100 flex items-center justify-center shadow-inner">
                      <span className="font-serif text-3xl font-bold bg-gradient-to-br from-romance-burgundy-600 to-tender-600 bg-clip-text text-transparent">
                        {step.step}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className={`p-2 rounded-xl bg-muted ${step.color}`}>
                          {step.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                        <span className="px-3 py-1 rounded-full bg-romance-champagne-100 text-romance-champagne-700 text-sm font-medium">
                          {step.time}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed max-w-2xl">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow for next step */}
                    {index < workflowSteps.length - 1 && (
                      <div className="hidden md:flex absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                        <ChevronRight className="h-6 w-6 text-romance-burgundy-300 rotate-90" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== TESTIMONIALS SECTION ========== */}
        <section className="py-28 bg-gradient-to-b from-background via-tender-50/30 to-background relative overflow-hidden">
          {/* Decorative elements */}
          <motion.div
            className="absolute top-20 left-[5%] opacity-5"
            variants={floatSlow}
            animate="animate"
          >
            <Quote className="h-48 w-48 text-romance-burgundy-600" />
          </motion.div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full bg-romance-champagne-100/80 px-5 py-2 text-sm font-semibold text-romance-champagne-700 mb-6">
                  <Award className="h-4 w-4" />
                  Loved by Authors
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                What Our{" "}
                <span className="bg-gradient-to-r from-romance-champagne-500 to-romance-rose-gold-500 bg-clip-text text-transparent">
                  Authors Say
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Join thousands of professional authors who have transformed their writing process with 88Away.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  variants={fadeInUp}
                >
                  <Card className="group relative h-full overflow-hidden border-border/60 bg-white/90 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-3">
                    {/* Top gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-romance-burgundy-400 via-tender-400 to-romance-champagne-400" />

                    <CardContent className="p-8">
                      {/* Stars */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-romance-champagne-400 text-romance-champagne-400" />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-foreground leading-relaxed text-lg mb-8 italic">
                        "{testimonial.quote}"
                      </p>

                      {/* Author info */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-romance-burgundy-400 to-tender-400 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                          {testimonial.image}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-romance-burgundy-100 text-romance-burgundy-700 text-xs font-medium">
                          {testimonial.metric}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== COMPARISON SECTION ========== */}
        <section className="py-28 bg-card relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full bg-romance-blush-100/80 px-5 py-2 text-sm font-semibold text-romance-blush-700 mb-6">
                  <BarChart3 className="h-4 w-4" />
                  Why 88Away
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                Built Different{" "}
                <span className="bg-gradient-to-r from-romance-blush-500 to-romance-burgundy-500 bg-clip-text text-transparent">
                  for Authors
                </span>
              </motion.h2>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-border/60 bg-background/80 backdrop-blur-sm overflow-hidden shadow-xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-romance-burgundy-50 to-tender-50 border-b border-border/40">
                <div className="font-semibold text-foreground">Feature</div>
                <div className="font-semibold text-center text-romance-burgundy-700">88Away</div>
                <div className="font-semibold text-center text-muted-foreground">Others</div>
              </div>

              {/* Rows */}
              {comparisonFeatures.map((row, index) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 gap-4 p-6 ${index % 2 === 0 ? 'bg-white/50' : 'bg-muted/20'} border-b border-border/20 last:border-0`}
                >
                  <div className="text-foreground font-medium">{row.feature}</div>
                  <div className="flex justify-center">
                    {row.us === true ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Yes</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{row.us}</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.others === false ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-5 h-0.5 bg-muted-foreground/40 rounded" />
                        <span className="text-sm">No</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{row.others}</span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== PRICING SECTION ========== */}
        <section className="py-28 bg-gradient-to-b from-background via-romance-champagne-50/30 to-background relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full bg-romance-burgundy-100/80 px-5 py-2 text-sm font-semibold text-romance-burgundy-700 mb-6">
                  <Crown className="h-4 w-4" />
                  Simple Pricing
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                Choose Your{" "}
                <span className="bg-gradient-to-r from-romance-burgundy-500 to-romance-rose-gold-500 bg-clip-text text-transparent">
                  Writing Journey
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Transparent pricing with no hidden fees. Start free, upgrade when you're ready.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={fadeInUp}
                  className={plan.highlight ? "md:-mt-4 md:mb-4" : ""}
                >
                  <Card className={`relative h-full overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                    plan.highlight
                      ? "border-2 border-romance-burgundy-400 shadow-xl shadow-romance-burgundy-500/20 bg-gradient-to-b from-white to-romance-burgundy-50/30"
                      : "border-border/60 bg-white/80 backdrop-blur-sm"
                  }`}>
                    {/* Popular badge */}
                    {plan.highlight && (
                      <div className="absolute -top-px left-0 right-0">
                        <div className="flex justify-center">
                          <span className="bg-gradient-to-r from-romance-burgundy-500 to-tender-500 text-white px-6 py-2 rounded-b-xl text-sm font-semibold shadow-lg">
                            Most Popular
                          </span>
                        </div>
                      </div>
                    )}

                    <CardHeader className={`text-center ${plan.highlight ? "pt-12" : "pt-8"} pb-6`}>
                      <CardTitle className="text-2xl font-serif mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-base">{plan.description}</CardDescription>
                      <div className="flex items-baseline justify-center mt-6">
                        <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground ml-2 text-lg">{plan.period}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 pb-8">
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-romance-burgundy-500" : "text-green-500"}`} />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full py-6 text-base font-semibold transition-all duration-300 ${
                          plan.highlight
                            ? "bg-gradient-to-r from-romance-burgundy-600 to-romance-burgundy-700 hover:from-romance-burgundy-700 hover:to-romance-burgundy-800 shadow-lg shadow-romance-burgundy-500/25"
                            : ""
                        }`}
                        variant={plan.highlight ? "default" : "outline"}
                        onClick={() => (window.location.href = "/api/login")}
                        data-testid={`button-plan-${plan.name.toLowerCase()}`}
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Money-back guarantee */}
            <motion.div
              className="text-center mt-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-50 border border-green-200">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">30-day money-back guarantee · No questions asked</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========== FINAL CTA SECTION ========== */}
        <section className="relative py-32 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-romance-burgundy-600 via-tender-600 to-romance-rose-gold-500" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.15),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,0,0,0.2),_transparent_50%)]" />

          {/* Floating elements */}
          <motion.div
            className="absolute top-10 left-[10%] opacity-20"
            variants={float}
            animate="animate"
          >
            <BookOpen className="h-20 w-20 text-white" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute bottom-10 right-[10%] opacity-20"
            variants={floatDelayed}
            animate="animate"
          >
            <Feather className="h-16 w-16 text-white" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-[20%] opacity-10"
            variants={floatSlow}
            animate="animate"
          >
            <Heart className="h-24 w-24 text-white" strokeWidth={1} />
          </motion.div>

          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
              >
                Your Story Deserves the Best Tools
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
              >
                Join thousands of authors who have transformed their writing process.
                Start your free trial today and experience the difference.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button
                  size="lg"
                  className="group text-lg px-12 py-7 bg-white text-romance-burgundy-700 hover:bg-white/90 shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => (window.location.href = "/api/login")}
                  data-testid="button-cta-start"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-7 border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Talk to Sales
                </Button>
              </motion.div>
              <motion.p
                variants={fadeIn}
                className="mt-8 text-sm text-white/60"
              >
                No credit card required · 14-day free trial · Cancel anytime
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <img
                  src={logoWhite}
                  alt="88Away Logo"
                  className="h-12 w-auto brightness-0 invert opacity-90 mb-6"
                />
                <p className="text-gray-400 max-w-md leading-relaxed mb-6">
                  The premier writing platform for professional authors. AI-powered tools,
                  collaborative workflows, and seamless publishing - all in one place.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-romance-champagne-400 text-romance-champagne-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">4.9/5 from 2,400+ reviews</span>
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="/romance/series" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="/romance/publishing" className="hover:text-white transition-colors">Publishing</a></li>
                  <li><a href="/romance/tropes" className="hover:text-white transition-colors">Trope Library</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="/cookies" className="hover:text-white transition-colors">Cookies</a></li>
                  <li><a href="mailto:info@88away.com" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-gray-500 text-sm">88Away LLC</p>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <MapPin className="h-3 w-3" />
                    <span>New York, NY</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm">
                  © {new Date().getFullYear()} 88Away LLC. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
