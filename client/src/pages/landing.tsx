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
  BarChart3,
  BookOpen,
  BookText,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  FileText,
  Flame,
  Globe,
  Heart,
  Image,
  Layers,
  Library,
  LineChart,
  Mail,
  MapPin,
  MessageSquareText,
  Palette,
  PenLine,
  Quote,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Type,
  Users,
  Wand2,
} from "lucide-react";
import logo from "@/assets/88away-logo-pink.png";
import logoWhite from "@/assets/88away-logo-white.png";
import { Seo } from "@/components/seo";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

// Floating animation for decorative elements
const float = {
  animate: {
    y: [0, -15, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

const floatDelayed = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
  },
};

const floatSlow = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 },
  },
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

// Typewriter effect for hero
function useTypewriter(words: string[], typingSpeed = 100, deletingSpeed = 60, pauseTime = 2000) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentWord.slice(0, text.length + 1));
          if (text === currentWord) {
            setTimeout(() => setIsDeleting(true), pauseTime);
          }
        } else {
          setText(currentWord.slice(0, text.length - 1));
          if (text === "") {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

  return text;
}

export default function Landing() {
  const envBase =
    (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
    "https://88away.com";
  const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
  const shareImageUrl = `${siteUrl}${logo}`;

  const booksCounter = useCounter(12500, 2500);
  const authorsCounter = useCounter(4800, 2200);
  const revenueCounter = useCounter(28, 2000);

  useEffect(() => {
    const timer = setTimeout(() => {
      booksCounter.start();
      authorsCounter.start();
      revenueCounter.start();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const typewriterText = useTypewriter(
    ["Your Bestseller", "Your Romance Empire", "Your KDP Success", "Your Author Career"],
    90,
    50,
    2500
  );

  // ---- DATA ----

  const impactStats = [
    {
      value: `${booksCounter.count.toLocaleString()}+`,
      label: "Books Published",
      sublabel: "Through our platform",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      value: `${authorsCounter.count.toLocaleString()}+`,
      label: "Romance Authors",
      sublabel: "Actively publishing",
      icon: <Users className="h-5 w-5" />,
    },
    {
      value: `$${revenueCounter.count}M+`,
      label: "Author Royalties",
      sublabel: "Earned by our community",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  const trustedBy = [
    { name: "Indie Romance Authors", detail: "Self-publishing" },
    { name: "BookTok Creators", detail: "Social publishing" },
    { name: "Pen Name Studios", detail: "Multi-author brands" },
    { name: "Romance Guild Press", detail: "Small press" },
    { name: "Bestseller Academy", detail: "Author coaching" },
  ];

  const platformFeatures = [
    {
      icon: <Wand2 className="h-7 w-7" />,
      title: "AI-Powered Writing Studio",
      description:
        "Three AI personas — Muse, Editor, and Coach — guide you from first draft to polished manuscript. Get plot suggestions, character development, and real-time style coaching.",
      gradient: "from-romance-burgundy-500 to-romance-burgundy-600",
      stats: "3 AI personas",
    },
    {
      icon: <Rocket className="h-7 w-7" />,
      title: "One-Click KDP Publishing",
      description:
        "Format your manuscript, generate metadata, optimize keywords, and publish directly to Amazon KDP — all from one dashboard. No more juggling between tools.",
      gradient: "from-tender-500 to-tender-600",
      stats: "Direct to Amazon",
    },
    {
      icon: <Palette className="h-7 w-7" />,
      title: "Cover Design Studio",
      description:
        "Create stunning romance covers with genre-specific templates, typography tools, and AI-assisted design. A/B test covers before launch to maximize click-through rates.",
      gradient: "from-romance-rose-gold-500 to-romance-rose-gold-600",
      stats: "100+ templates",
    },
    {
      icon: <BarChart3 className="h-7 w-7" />,
      title: "Royalty Analytics Dashboard",
      description:
        "Track sales, royalties, page reads, and ad ROI across all your titles in real time. Forecast revenue and identify your most profitable subgenres and tropes.",
      gradient: "from-romance-champagne-500 to-romance-champagne-600",
      stats: "Real-time data",
    },
  ];

  const romanceTools = [
    {
      name: "Trope Engine",
      role: "Story development",
      description:
        "Browse 200+ romance tropes, discover trending combinations, and detect conflicts before they derail your plot. Built from analyzing thousands of bestselling romances.",
      capabilities: [
        "200+ curated tropes",
        "Trending combinations",
        "Conflict detection",
        "Reader expectation mapping",
      ],
      color: "from-tender-400 to-tender-600",
      bgColor: "bg-tender-50",
      borderColor: "border-tender-200",
      icon: <Heart className="h-8 w-8 text-tender-600" />,
    },
    {
      name: "Character Forge",
      role: "Character creation",
      description:
        "Build unforgettable characters with romantic archetypes, relationship maps, and chemistry tracking. Watch tension arcs develop across chapters and scenes.",
      capabilities: [
        "Romantic archetypes",
        "Relationship mapping",
        "Chemistry tracking",
        "Arc visualization",
      ],
      color: "from-romance-burgundy-400 to-romance-burgundy-600",
      bgColor: "bg-romance-burgundy-50",
      borderColor: "border-romance-burgundy-200",
      icon: <Users className="h-8 w-8 text-romance-burgundy-600" />,
    },
    {
      name: "Series Architect",
      role: "Multi-book planning",
      description:
        "Plan and manage multi-book series with interconnected storylines, recurring characters, and overarching romance arcs. Keep your series bible in one place.",
      capabilities: [
        "Series bible",
        "Cross-book arcs",
        "Character continuity",
        "Timeline tracking",
      ],
      color: "from-romance-rose-gold-400 to-romance-rose-gold-600",
      bgColor: "bg-romance-rose-gold-50",
      borderColor: "border-romance-rose-gold-200",
      icon: <Library className="h-8 w-8 text-romance-rose-gold-600" />,
    },
  ];

  const publishingPipeline = [
    {
      step: "01",
      title: "Write Your Story",
      description:
        "Use our rich text editor with AI assistance, distraction-free mode, and real-time collaboration. Track word counts, set sprint goals, and hit your deadlines.",
      icon: <PenLine className="h-6 w-6" />,
      color: "text-romance-burgundy-600",
      time: "Your pace",
    },
    {
      step: "02",
      title: "Design Your Cover",
      description:
        "Choose from genre-specific templates or create from scratch. Preview how your cover looks in Amazon search results and on different devices.",
      icon: <Image className="h-6 w-6" />,
      color: "text-tender-600",
      time: "Minutes",
    },
    {
      step: "03",
      title: "Optimize for Discovery",
      description:
        "AI-powered keyword research, category selection, and blurb generation. Maximize your book's visibility with data-driven metadata optimization.",
      icon: <Search className="h-6 w-6" />,
      color: "text-romance-rose-gold-600",
      time: "AI-assisted",
    },
    {
      step: "04",
      title: "Publish & Promote",
      description:
        "One-click publish to Amazon KDP. Then use built-in email marketing, newsletter tools, and analytics to build your readership and grow your income.",
      icon: <Rocket className="h-6 w-6" />,
      color: "text-romance-champagne-600",
      time: "One click",
    },
  ];

  const testimonials = [
    {
      quote:
        "88Away transformed my publishing workflow. I went from one book a year to six — and tripled my income. The AI editor catches things my beta readers miss.",
      name: "Sophia Langley",
      role: "Bestselling Contemporary Romance Author",
      metric: "6x output",
      image: "SL",
      rating: 5,
    },
    {
      quote:
        "The trope engine alone is worth the subscription. I discovered a trending trope combo that landed my book on the Top 100 list within the first week of launch.",
      name: "Elena Rivera",
      role: "Historical Romance Author, 42 titles",
      metric: "Top 100 hit",
      image: "ER",
      rating: 5,
    },
    {
      quote:
        "Managing a 12-book series was a nightmare before 88Away. Now I have every character, timeline, and plot thread organized beautifully. My readers notice the difference.",
      name: "Jade Whitmore",
      role: "Paranormal Romance Series Author",
      metric: "12-book series",
      image: "JW",
      rating: 5,
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "/month",
      description: "For authors just starting their KDP journey",
      features: [
        "1 active manuscript",
        "Basic AI writing assistant",
        "5 cover templates",
        "Word count tracking",
        "Community access",
      ],
      cta: "Start Writing Free",
      highlight: false,
    },
    {
      name: "Professional",
      price: "$19",
      period: "/month",
      description: "For serious romance authors building their backlist",
      features: [
        "Unlimited manuscripts",
        "All 3 AI personas (Muse, Editor, Coach)",
        "100+ cover templates & design studio",
        "KDP direct publishing",
        "Keyword & category optimizer",
        "Blurb generator",
        "Royalty analytics dashboard",
        "Email marketing tools",
        "Series management",
      ],
      cta: "Go Professional",
      highlight: true,
    },
    {
      name: "Empire",
      price: "$49",
      period: "/month",
      description: "For prolific authors and publishing businesses",
      features: [
        "Everything in Professional",
        "Real-time collaboration (co-authors)",
        "Pen name management",
        "Advanced revenue analytics",
        "A/B cover testing",
        "Priority AI processing",
        "Marketplace access",
        "API integrations",
        "Dedicated support",
      ],
      cta: "Build Your Empire",
      highlight: false,
    },
  ];

  const comparisonFeatures = [
    { feature: "AI writing assistance", us: true, others: "Basic" },
    { feature: "Romance-specific tools", us: true, others: false },
    { feature: "Direct KDP publishing", us: true, others: "Manual" },
    { feature: "Cover design studio", us: true, others: "Separate tool" },
    { feature: "Keyword optimization", us: true, others: "Limited" },
    { feature: "Series management", us: true, others: false },
    { feature: "Real-time collaboration", us: true, others: false },
    { feature: "Royalty analytics", us: true, others: "Basic" },
  ];

  const kdpFeatures = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Manuscript Formatting",
      description: "Auto-format for Kindle eBook and paperback with front/back matter, TOC, and page breaks.",
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Keyword Research",
      description: "Discover high-traffic, low-competition keywords that help readers find your books.",
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Category Optimization",
      description: "Find the best BISAC categories to maximize your book's visibility on Amazon.",
    },
    {
      icon: <Type className="h-6 w-6" />,
      title: "Blurb Generator",
      description: "AI-crafted book descriptions with hook formulas proven to convert browsers to buyers.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Multi-Market Publishing",
      description: "Publish to all Amazon marketplaces worldwide from a single dashboard.",
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Sales Tracking",
      description: "Monitor daily sales, page reads, and rankings across all your titles in real time.",
    },
  ];

  const heatLevels = [
    { level: "Sweet", color: "bg-romance-champagne-100 text-romance-champagne-800 border-romance-champagne-300", icon: "🌸" },
    { level: "Warm", color: "bg-romance-blush-100 text-romance-blush-800 border-romance-blush-300", icon: "🌹" },
    { level: "Steamy", color: "bg-romance-burgundy-100 text-romance-burgundy-800 border-romance-burgundy-300", icon: "🔥" },
    { level: "Scorching", color: "bg-passion-100 text-passion-800 border-passion-300", icon: "💋" },
  ];

  const subgenres = [
    "Contemporary", "Historical", "Paranormal", "Fantasy",
    "Sci-Fi", "Romantic Suspense", "Dark Romance", "Mafia",
    "Sports", "Military", "Cowboy", "Billionaire",
    "Small Town", "Second Chance", "Age Gap", "Why Choose",
  ];

  return (
    <>
      <Seo
        title="88Away — The Ultimate KDP Publishing Platform for Romance Authors"
        description="Write, design, optimize, and publish your romance novels directly to Amazon KDP. AI-powered writing tools, cover design studio, keyword research, and royalty analytics — built exclusively for romance authors."
        keywords={[
          "kdp publishing",
          "romance writing software",
          "kindle direct publishing",
          "self publishing platform",
          "romance author tools",
          "book cover design",
          "kdp keywords",
          "romance tropes",
          "book publishing software",
          "indie author tools",
          "amazon kdp",
          "write romance novels",
          "book marketing",
          "author platform",
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "88Away LLC",
            url: siteUrl,
            logo: shareImageUrl,
            description: "The ultimate KDP publishing platform for romance authors",
            contactPoint: {
              "@type": "ContactPoint",
              email: "hello@88away.com",
              contactType: "customer support",
            },
            sameAs: [
              "https://twitter.com/88Away",
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "88Away",
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Book Publishing",
            operatingSystem: "Web",
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "0.00",
              highPrice: "49.00",
              priceCurrency: "USD",
              offerCount: "3",
            },
            description:
              "AI-powered KDP publishing platform for romance authors. Write, design covers, optimize keywords, and publish directly to Amazon KDP.",
            url: siteUrl,
            image: shareImageUrl,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "4800",
              bestRating: "5",
            },
          },
        ]}
      />

      <div className="min-h-screen bg-background overflow-hidden">
        {/* ========== STICKY NAV ========== */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-romance-burgundy-100/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <img src={logo} alt="88Away" className="h-9 w-auto" />
                <span className="font-serif text-xl font-semibold text-foreground tracking-tight hidden sm:block">
                  88Away
                </span>
              </div>
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                <a href="#features" className="hover:text-romance-burgundy-600 transition-colors">Features</a>
                <a href="#publishing" className="hover:text-romance-burgundy-600 transition-colors">Publishing</a>
                <a href="#romance-tools" className="hover:text-romance-burgundy-600 transition-colors">Romance Tools</a>
                <a href="#pricing" className="hover:text-romance-burgundy-600 transition-colors">Pricing</a>
                <a href="#testimonials" className="hover:text-romance-burgundy-600 transition-colors">Authors</a>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => (window.location.href = "/api/login")}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-romance-burgundy-600 to-romance-burgundy-700 hover:from-romance-burgundy-700 hover:to-romance-burgundy-800 shadow-lg shadow-romance-burgundy-500/20 text-sm"
                  onClick={() => (window.location.href = "/api/login")}
                  data-testid="button-nav-start"
                >
                  Start Free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* ========== HERO SECTION ========== */}
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-b from-romance-burgundy-50/80 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.2),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(238,153,104,0.12),_transparent_50%)]" />

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

          {/* Floating book/writing icons */}
          <motion.div className="absolute top-32 right-[20%] opacity-10" variants={floatDelayed} animate="animate">
            <BookOpen className="h-24 w-24 text-romance-burgundy-600" strokeWidth={1} />
          </motion.div>
          <motion.div className="absolute bottom-48 left-[12%] opacity-10" variants={float} animate="animate">
            <PenLine className="h-20 w-20 text-tender-600" strokeWidth={1} />
          </motion.div>
          <motion.div className="absolute top-1/2 left-[5%] opacity-8" variants={floatSlow} animate="animate">
            <Heart className="h-16 w-16 text-romance-blush-500" strokeWidth={1} />
          </motion.div>
          <motion.div className="absolute bottom-24 right-[8%] opacity-8" variants={float} animate="animate">
            <Sparkles className="h-14 w-14 text-romance-champagne-500" strokeWidth={1} />
          </motion.div>

          {/* Hero content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
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
                <span>The #1 KDP Publishing Platform for Romance Authors</span>
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

              {/* Main headline with typewriter */}
              <motion.h1
                variants={fadeInUp}
                className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground max-w-5xl leading-[1.1]"
              >
                Write, Publish &amp; Grow{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-romance-burgundy-600 via-tender-500 to-romance-rose-gold-500 bg-clip-text text-transparent">
                    {typewriterText}
                    <span className="animate-pulse">|</span>
                  </span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-romance-champagne-200 to-romance-blush-200 -z-10 transform -rotate-1" />
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl leading-relaxed font-light"
              >
                The all-in-one platform that takes your romance novels from{" "}
                <span className="text-foreground font-medium">first draft</span> to{" "}
                <span className="text-foreground font-medium">Amazon bestseller</span>.
                AI writing tools, cover design, keyword optimization, and{" "}
                <span className="text-foreground font-medium">one-click KDP publishing</span>.
              </motion.p>

              {/* Subgenre & heat level tags */}
              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-2 max-w-2xl">
                {subgenres.slice(0, 8).map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-romance-burgundy-50 text-romance-burgundy-600 border border-romance-burgundy-200/60"
                  >
                    {genre}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-romance-champagne-50 text-romance-champagne-700 border border-romance-champagne-200/60">
                  + 50 more subgenres
                </span>
              </motion.div>

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
                  <PenLine className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Start Writing Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group text-lg px-10 py-7 border-2 border-romance-burgundy-200 hover:border-romance-burgundy-400 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
                  onClick={() => {
                    const el = document.getElementById("features");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-testid="button-see-features"
                >
                  <Sparkles className="mr-2 h-5 w-5 text-romance-burgundy-600" />
                  See All Features
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div variants={fadeIn} className="pt-6 flex flex-col items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-romance-champagne-400 text-romance-champagne-400"
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    4.9/5 from 4,800+ romance authors
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Free forever plan &middot; No credit card required &middot; Publish in minutes
                </p>
              </motion.div>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ========== IMPACT STATS ========== */}
        <section className="relative py-20 bg-gradient-to-b from-background via-romance-burgundy-50/30 to-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
            >
              {impactStats.map((stat) => (
                <motion.div key={stat.label} variants={fadeInUp} className="group relative">
                  <div className="relative overflow-hidden rounded-3xl border border-romance-burgundy-100/80 bg-white/80 backdrop-blur-sm p-8 shadow-lg shadow-romance-burgundy-500/5 transition-all duration-500 hover:shadow-xl hover:shadow-romance-burgundy-500/10 hover:-translate-y-2 hover:border-romance-burgundy-200">
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

        {/* ========== TRUSTED BY ========== */}
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
                Trusted by romance authors and publishers worldwide
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
                    <span className="text-xs text-muted-foreground/50 mt-1">
                      {company.detail}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========== PLATFORM FEATURES ========== */}
        <section id="features" className="py-28 bg-background relative overflow-hidden">
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
                  <Wand2 className="h-4 w-4" />
                  All-in-One Platform
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-romance-burgundy-600 to-tender-500 bg-clip-text text-transparent">
                  Write &amp; Publish
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                From your first chapter to your first royalty check — 88Away is the only tool
                romance authors need to write, publish, and grow on Amazon KDP.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {platformFeatures.map((feature) => (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="group relative h-full overflow-hidden border-border/60 bg-white/80 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-romance-burgundy-500/10 hover:-translate-y-2 hover:border-romance-burgundy-200">
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.gradient}`}
                    />
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                        >
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

        {/* ========== KDP PUBLISHING TOOLS ========== */}
        <section id="publishing" className="py-28 bg-gradient-to-b from-romance-burgundy-50/30 via-background to-background relative overflow-hidden">
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
                  <Rocket className="h-4 w-4" />
                  KDP Publishing Suite
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                Publish to Amazon KDP{" "}
                <span className="bg-gradient-to-r from-tender-500 to-romance-burgundy-500 bg-clip-text text-transparent">
                  Like a Pro
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Every tool you need to optimize, format, and publish your books on Amazon KDP —
                with data-driven insights that give you an unfair advantage.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {kdpFeatures.map((feature) => (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="group h-full border-border/60 bg-white/80 backdrop-blur-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 hover:border-romance-burgundy-200">
                    <CardContent className="p-6">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-romance-burgundy-100 to-tender-100 text-romance-burgundy-600 w-fit mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-romance-burgundy-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== ROMANCE-SPECIFIC TOOLS ========== */}
        <section id="romance-tools" className="py-28 bg-background relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full bg-romance-blush-100/80 px-5 py-2 text-sm font-semibold text-romance-blush-700 mb-6">
                  <Heart className="h-4 w-4" />
                  Built for Romance
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                Tools That Understand{" "}
                <span className="bg-gradient-to-r from-romance-blush-500 to-romance-burgundy-500 bg-clip-text text-transparent">
                  Romance
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Not just any writing tool — 88Away is purpose-built for romance authors
                with genre-specific features you won't find anywhere else.
              </motion.p>
            </motion.div>

            {/* Heat Level & Subgenre showcase */}
            <motion.div
              className="mb-16 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Support for every heat level
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {heatLevels.map((hl) => (
                  <span
                    key={hl.level}
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${hl.color}`}
                  >
                    {hl.icon} {hl.level}
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                All subgenres covered
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
                {subgenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-romance-burgundy-200/60 text-romance-burgundy-600 hover:bg-romance-burgundy-50 transition-colors cursor-default"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Romance tool cards */}
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {romanceTools.map((tool) => (
                <motion.div key={tool.name} variants={fadeInUp}>
                  <Card
                    className={`group relative h-full overflow-hidden ${tool.bgColor} ${tool.borderColor} border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                    />
                    <CardHeader className="relative pb-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`p-4 rounded-2xl bg-white shadow-lg ${tool.borderColor} border`}
                        >
                          {tool.icon}
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-serif">{tool.name}</CardTitle>
                          <CardDescription className="text-base font-medium">
                            {tool.role}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative space-y-6">
                      <p className="text-muted-foreground leading-relaxed">{tool.description}</p>
                      <div className="space-y-3">
                        {tool.capabilities.map((cap) => (
                          <div key={cap} className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{cap}</span>
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

        {/* ========== PUBLISHING PIPELINE / WORKFLOW ========== */}
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
                  <BookText className="h-4 w-4" />
                  Your Publishing Journey
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                From Blank Page to{" "}
                <span className="bg-gradient-to-r from-romance-rose-gold-500 to-romance-champagne-500 bg-clip-text text-transparent">
                  Bestseller
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                A streamlined workflow designed specifically for romance authors
                who want to publish faster, smarter, and more profitably.
              </motion.p>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {publishingPipeline.map((step, index) => (
                <motion.div key={step.title} variants={fadeInUp} className="group">
                  <div className="relative flex flex-col md:flex-row items-start gap-6 rounded-3xl border border-border/60 bg-background/80 backdrop-blur-sm p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-romance-burgundy-200 hover:-translate-y-1">
                    <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-romance-burgundy-100 to-tender-100 flex items-center justify-center shadow-inner">
                      <span className="font-serif text-3xl font-bold bg-gradient-to-br from-romance-burgundy-600 to-tender-600 bg-clip-text text-transparent">
                        {step.step}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className={`p-2 rounded-xl bg-muted ${step.color}`}>{step.icon}</div>
                        <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                        <span className="px-3 py-1 rounded-full bg-romance-champagne-100 text-romance-champagne-700 text-sm font-medium">
                          {step.time}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed max-w-2xl">
                        {step.description}
                      </p>
                    </div>
                    {index < publishingPipeline.length - 1 && (
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

        {/* ========== AI WRITING SHOWCASE ========== */}
        <section className="py-28 bg-gradient-to-b from-background via-tender-50/20 to-background relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              {/* Left - content */}
              <motion.div variants={slideInLeft}>
                <span className="inline-flex items-center gap-2 rounded-full bg-tender-100/80 px-5 py-2 text-sm font-semibold text-tender-700 mb-6">
                  <Wand2 className="h-4 w-4" />
                  AI-Powered Writing
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                  Three AI Personas,{" "}
                  <span className="bg-gradient-to-r from-tender-500 to-romance-burgundy-500 bg-clip-text text-transparent">
                    One Mission
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Our AI understands romance. It knows tropes, pacing, tension, and what
                  makes readers turn pages. Meet your three creative partners:
                </p>

                <div className="space-y-6">
                  {[
                    {
                      name: "The Muse",
                      desc: "Generates plot ideas, suggests trope combinations, and helps you brainstorm your way past writer's block.",
                      icon: <Sparkles className="h-5 w-5 text-romance-champagne-600" />,
                      color: "border-romance-champagne-300 bg-romance-champagne-50",
                    },
                    {
                      name: "The Editor",
                      desc: "Catches plot holes, pacing issues, and prose weaknesses. Provides line-by-line suggestions to tighten your manuscript.",
                      icon: <PenLine className="h-5 w-5 text-romance-burgundy-600" />,
                      color: "border-romance-burgundy-300 bg-romance-burgundy-50",
                    },
                    {
                      name: "The Coach",
                      desc: "Analyzes your writing style, tracks your progress, and gives actionable advice to level up your craft.",
                      icon: <MessageSquareText className="h-5 w-5 text-tender-600" />,
                      color: "border-tender-300 bg-tender-50",
                    },
                  ].map((persona) => (
                    <div
                      key={persona.name}
                      className={`flex items-start gap-4 p-4 rounded-2xl border ${persona.color} transition-all duration-300 hover:shadow-md`}
                    >
                      <div className="p-2 rounded-xl bg-white shadow-sm">{persona.icon}</div>
                      <div>
                        <h4 className="font-semibold text-foreground">{persona.name}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                          {persona.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right - mock editor */}
              <motion.div variants={slideInRight}>
                <div className="relative rounded-3xl border-2 border-romance-burgundy-200/60 bg-white shadow-2xl shadow-romance-burgundy-500/10 overflow-hidden">
                  {/* Mock toolbar */}
                  <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-romance-burgundy-50 to-tender-50 border-b border-romance-burgundy-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-romance-blush-400" />
                      <div className="w-3 h-3 rounded-full bg-romance-champagne-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs font-medium text-romance-burgundy-600">
                      Chapter 7 — The Confession Scene
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Flame className="h-3 w-3 text-romance-burgundy-500" />
                      <span>2,847 words</span>
                    </div>
                  </div>
                  {/* Mock content */}
                  <div className="p-6 space-y-4">
                    <p className="text-foreground leading-relaxed font-serif text-lg">
                      She turned to face him, her heart hammering so loudly she was sure
                      he could hear it. "I can't keep pretending," she whispered.
                    </p>
                    <p className="text-foreground leading-relaxed font-serif text-lg">
                      His hand found hers in the darkness. "Then don't."
                    </p>
                    <p className="text-muted-foreground/60 leading-relaxed font-serif text-lg italic">
                      The silence between them held everything — every stolen glance,
                      every almost-touch, every word they'd been too afraid to say...
                    </p>
                    {/* AI suggestion bubble */}
                    <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-tender-50 to-romance-blush-50 border-l-4 border-romance-burgundy-400">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-romance-burgundy-500" />
                        <span className="text-xs font-semibold text-romance-burgundy-700">
                          AI Muse Suggestion
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        "Consider adding a sensory detail here — the scent of his cologne,
                        the warmth of his breath — to deepen the intimacy before the kiss..."
                      </p>
                    </div>
                    {/* Word count bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="px-2 py-1 rounded bg-romance-burgundy-100 text-romance-burgundy-700 font-medium">
                          Steamy
                        </span>
                        <span>Contemporary Romance</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Daily goal: 87% complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section
          id="testimonials"
          className="py-28 bg-gradient-to-b from-background via-romance-champagne-50/20 to-background relative overflow-hidden"
        >
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
                  <Heart className="h-4 w-4" />
                  Author Love Letters
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6"
              >
                What{" "}
                <span className="bg-gradient-to-r from-romance-champagne-500 to-romance-rose-gold-500 bg-clip-text text-transparent">
                  Romance Authors
                </span>{" "}
                Are Saying
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Join thousands of romance authors who have transformed their publishing
                careers with 88Away.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {testimonials.map((t) => (
                <motion.div key={t.name} variants={fadeInUp}>
                  <Card className="group relative h-full overflow-hidden border-border/60 bg-white/90 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-3">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-romance-burgundy-400 via-tender-400 to-romance-champagne-400" />
                    <CardContent className="p-8">
                      <div className="flex gap-1 mb-6">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 fill-romance-champagne-400 text-romance-champagne-400"
                          />
                        ))}
                      </div>
                      <p className="text-foreground leading-relaxed text-lg mb-8 italic">
                        "{t.quote}"
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-romance-burgundy-400 to-tender-400 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                          {t.image}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{t.name}</p>
                          <p className="text-sm text-muted-foreground">{t.role}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-romance-burgundy-100 text-romance-burgundy-700 text-xs font-medium">
                          {t.metric}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== COMPARISON TABLE ========== */}
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
                  for Romance Authors
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                Generic writing tools don't understand romance. We do.
              </motion.p>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-border/60 bg-background/80 backdrop-blur-sm overflow-hidden shadow-xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-romance-burgundy-50 to-tender-50 border-b border-border/40">
                <div className="font-semibold text-foreground">Feature</div>
                <div className="font-semibold text-center text-romance-burgundy-700">88Away</div>
                <div className="font-semibold text-center text-muted-foreground">Generic Tools</div>
              </div>
              {comparisonFeatures.map((row, index) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 gap-4 p-6 ${
                    index % 2 === 0 ? "bg-white/50" : "bg-muted/20"
                  } border-b border-border/20 last:border-0`}
                >
                  <div className="text-foreground font-medium">{row.feature}</div>
                  <div className="flex justify-center">
                    {row.us === true ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Yes</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{String(row.us)}</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.others === false ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-5 h-0.5 bg-muted-foreground/40 rounded" />
                        <span className="text-sm">No</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{String(row.others)}</span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== PRICING ========== */}
        <section
          id="pricing"
          className="py-28 bg-gradient-to-b from-background via-romance-champagne-50/30 to-background relative overflow-hidden"
        >
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
                Invest in{" "}
                <span className="bg-gradient-to-r from-romance-burgundy-500 to-romance-rose-gold-500 bg-clip-text text-transparent">
                  Your Author Career
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Start free and upgrade when you're ready to go pro.
                Every plan pays for itself with your first book.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {plans.map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeInUp}
                  className={plan.highlight ? "md:-mt-4 md:mb-4" : ""}
                >
                  <Card
                    className={`relative h-full overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                      plan.highlight
                        ? "border-2 border-romance-burgundy-400 shadow-xl shadow-romance-burgundy-500/20 bg-gradient-to-b from-white to-romance-burgundy-50/30"
                        : "border-border/60 bg-white/80 backdrop-blur-sm"
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-px left-0 right-0">
                        <div className="flex justify-center">
                          <span className="bg-gradient-to-r from-romance-burgundy-500 to-tender-500 text-white px-6 py-2 rounded-b-xl text-sm font-semibold shadow-lg">
                            Most Popular
                          </span>
                        </div>
                      </div>
                    )}
                    <CardHeader
                      className={`text-center ${plan.highlight ? "pt-12" : "pt-8"} pb-6`}
                    >
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
                            <Check
                              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                plan.highlight ? "text-romance-burgundy-500" : "text-green-500"
                              }`}
                            />
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

            <motion.div
              className="text-center mt-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-50 border border-green-200">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  30-day money-back guarantee &middot; Cancel anytime &middot; No lock-in
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-romance-burgundy-600 via-tender-600 to-romance-rose-gold-500" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.15),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,0,0,0.2),_transparent_50%)]" />

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
            <Heart className="h-16 w-16 text-white" strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-[20%] opacity-10"
            variants={floatSlow}
            animate="animate"
          >
            <PenLine className="h-24 w-24 text-white" strokeWidth={1} />
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
                Your Readers Are Waiting for Your Next Book
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
              >
                Join 4,800+ romance authors who publish faster, earn more, and
                love the process. Start writing your bestseller today.
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
                  <PenLine className="mr-2 h-5 w-5" />
                  Start Writing Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-7 border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Talk to Our Team
                </Button>
              </motion.div>
              <motion.p
                variants={fadeIn}
                className="mt-8 text-sm text-white/60"
              >
                Free forever plan &middot; No credit card required &middot; Publish in minutes
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
                  The ultimate KDP publishing platform for romance authors.
                  Write, design, optimize, and publish — all in one place.
                  Built with love by 88Away LLC.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-romance-champagne-400 text-romance-champagne-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">4.9/5 from 4,800+ authors</span>
                </div>
              </div>

              {/* Product links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Platform</h4>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a href="#features" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#publishing" className="hover:text-white transition-colors">
                      KDP Publishing
                    </a>
                  </li>
                  <li>
                    <a href="#romance-tools" className="hover:text-white transition-colors">
                      Romance Tools
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="/newsletter" className="hover:text-white transition-colors">
                      KDP Trends Newsletter
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a href="/privacy" className="hover:text-white transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="hover:text-white transition-colors">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="/cookies" className="hover:text-white transition-colors">
                      Cookie Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:hello@88away.com"
                      className="hover:text-white transition-colors"
                    >
                      Contact Us
                    </a>
                  </li>
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
                  &copy; {new Date().getFullYear()} 88Away LLC. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
