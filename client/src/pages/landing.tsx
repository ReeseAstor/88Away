import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Users, 
  Zap, 
  Shield, 
  Lightbulb, 
  Edit3, 
  FileText,
  Check,
  Mail,
  MapPin
} from "lucide-react";
import logo from "@/assets/88away-logo.png";

export default function Landing() {
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-accent" />,
      title: "Story Bible Management",
      description: "Organize characters, worldbuilding, and timelines in one comprehensive system."
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-chart-1" />,
      title: "AI Writing Assistant",
      description: "Three specialized personas - Muse for creativity, Editor for polish, Coach for planning."
    },
    {
      icon: <Users className="h-8 w-8 text-chart-2" />,
      title: "Team Collaboration",
      description: "Role-based access control with Owner, Editor, Reviewer, and Reader permissions."
    },
    {
      icon: <Shield className="h-8 w-8 text-destructive" />,
      title: "Version Control",
      description: "Track document history and collaborate seamlessly with your team."
    }
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
      cta: "Start Free Trial"
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
      popular: true
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
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-chart-1/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <img src={logo} alt="88Away Logo" className="h-20 w-auto" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              <span className="text-accent">88Away</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The professional writing platform that combines story bible management, 
              AI-powered assistance, and team collaboration to elevate your creative process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-get-started"
              >
                <Zap className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-card-foreground mb-4">
              Everything you need to craft your story
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional writing tools designed for authors who demand the best from their creative process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* AI Personas Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Meet Your AI Writing Companions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three specialized AI personas designed to assist every aspect of your writing journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-chart-1"></div>
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
                  Perfect for breaking through writer's block and sparking creativity.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Sensory-rich scene generation</li>
                  <li>• Character voice development</li>
                  <li>• Emotional depth enhancement</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
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
                  Professional editing assistance at your fingertips.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Grammar and clarity improvements</li>
                  <li>• Voice preservation</li>
                  <li>• Flow optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-chart-2"></div>
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
                  Strategic planning for compelling storytelling.
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

      {/* Pricing Section */}
      <div className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                className={`relative ${plan.popular ? 'border-accent ring-2 ring-accent/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
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
                    onClick={() => window.location.href = "/api/login"}
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

      {/* CTA Section */}
      <div className="py-24 bg-background">
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
            onClick={() => window.location.href = "/api/login"}
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
              <img src={logo} alt="88Away Logo" className="h-12 w-auto brightness-0 invert opacity-90" />
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
                  <a href="mailto:info@88away.com" className="hover:text-primary-foreground/90 transition-colors">
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
  );
}
