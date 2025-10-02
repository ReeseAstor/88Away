import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Bot, Users, Download, Sparkles, FileText, Map, Clock } from "lucide-react";
import type { CarouselApi } from "@/components/ui/carousel";

interface OnboardingWelcomeProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingWelcome({ open, onClose, onComplete }: OnboardingWelcomeProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const slides = [
    {
      icon: Sparkles,
      title: "Welcome to 88away",
      description: "Your AI-powered creative writing companion",
      content: "88away helps you craft compelling stories with advanced AI assistance, comprehensive story management tools, and seamless collaboration features. Let's take a quick tour of what makes 88away special.",
    },
    {
      icon: Bot,
      title: "AI Writing Personas",
      description: "Three distinct AI companions for every stage",
      content: "Meet your AI team: The Muse for brainstorming inspiration, The Editor for refining your prose, and The Coach for overcoming writer's block. Choose project templates that match your genre to get started quickly.",
      features: [
        { icon: Sparkles, text: "The Muse - Brainstorming & Inspiration" },
        { icon: FileText, text: "The Editor - Polish & Refinement" },
        { icon: BookOpen, text: "The Coach - Guidance & Support" },
      ],
    },
    {
      icon: Map,
      title: "Story Bible & World Building",
      description: "Keep your narrative consistent and organized",
      content: "Create detailed character profiles, build rich worlds, and maintain a comprehensive timeline. Everything you need to ensure continuity and depth in your storytelling.",
      features: [
        { icon: Users, text: "Character profiles with relationships" },
        { icon: Map, text: "Worldbuilding entries for locations & lore" },
        { icon: Clock, text: "Timeline tracking for plot consistency" },
      ],
    },
    {
      icon: Download,
      title: "Collaboration & Export",
      description: "Work together and share your stories",
      content: "Invite collaborators with role-based permissions, track changes with version control, and export your work in multiple formats including Word, PDF, and EPUB.",
      features: [
        { icon: Users, text: "Real-time collaboration" },
        { icon: FileText, text: "Version control & branching" },
        { icon: Download, text: "Export to Word, PDF, EPUB" },
      ],
    },
  ];

  const handleGetStarted = () => {
    onComplete();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10"
        data-testid="dialog-onboarding-welcome"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" data-testid="text-welcome-title">
            Get Started with 88away
          </DialogTitle>
          <DialogDescription data-testid="text-welcome-description">
            Learn how to make the most of your creative writing journey
          </DialogDescription>
        </DialogHeader>

        <Carousel 
          className="w-full"
          setApi={setApi}
          opts={{ loop: false }}
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <Card className="border-2 border-muted bg-card/50 dark:bg-card/30" data-testid={`card-slide-${index}`}>
                  <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <slide.icon className="w-10 h-10 text-primary" data-testid={`icon-slide-${index}`} />
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-foreground dark:text-foreground" data-testid={`text-slide-title-${index}`}>
                        {slide.title}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground" data-testid={`text-slide-description-${index}`}>
                        {slide.description}
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground dark:text-muted-foreground max-w-xl" data-testid={`text-slide-content-${index}`}>
                      {slide.content}
                    </p>

                    {slide.features && (
                      <div className="grid gap-4 w-full max-w-xl" data-testid={`list-slide-features-${index}`}>
                        {slide.features.map((feature, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 dark:bg-muted/20"
                            data-testid={`item-feature-${index}-${idx}`}
                          >
                            <feature.icon className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm text-foreground dark:text-foreground">{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <CarouselPrevious 
              className="relative static translate-y-0"
              data-testid="button-carousel-previous"
            />
            <div className="flex gap-2" data-testid="indicator-carousel-dots">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === (api?.selectedScrollSnap() ?? 0)
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30"
                  }`}
                  data-testid={`dot-carousel-${index}`}
                />
              ))}
            </div>
            <CarouselNext 
              className="relative static translate-y-0"
              data-testid="button-carousel-next"
            />
          </div>
        </Carousel>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
            data-testid="button-skip-tour"
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleGetStarted}
            className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
