import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

interface GettingStartedChecklistProps {
  steps: {
    createProject: boolean;
    useAI: boolean;
    addCharacter: boolean;
    viewAnalytics: boolean;
    tryExport: boolean;
  };
  onRestartTour: () => void;
  onDismiss: () => void;
}

export default function GettingStartedChecklist({ 
  steps, 
  onRestartTour,
  onDismiss 
}: GettingStartedChecklistProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const checklistSteps: ChecklistStep[] = [
    {
      id: "createProject",
      label: "Create your first project",
      description: "Start your writing journey",
      completed: steps.createProject,
    },
    {
      id: "useAI",
      label: "Try the AI writing assistant",
      description: "Get help from The Muse, Editor, or Coach",
      completed: steps.useAI,
    },
    {
      id: "addCharacter",
      label: "Add a character",
      description: "Build your story bible",
      completed: steps.addCharacter,
    },
    {
      id: "viewAnalytics",
      label: "View analytics",
      description: "Track your writing progress",
      completed: steps.viewAnalytics,
    },
    {
      id: "tryExport",
      label: "Export your work",
      description: "Download in your preferred format",
      completed: steps.tryExport,
    },
  ];

  const completedCount = checklistSteps.filter(step => step.completed).length;
  const totalCount = checklistSteps.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <Card 
      className="fixed bottom-6 right-6 w-96 shadow-2xl border-2 border-primary/20 dark:border-primary/30 bg-card dark:bg-card z-50"
      data-testid="card-getting-started"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-foreground dark:text-foreground" data-testid="text-checklist-title">
              Getting Started
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground" data-testid="text-checklist-description">
              {completedCount} of {totalCount} completed
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
              data-testid="button-toggle-collapse"
            >
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
              onClick={onDismiss}
              data-testid="button-dismiss-checklist"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 pt-2">
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-muted dark:bg-muted"
            data-testid="progress-checklist"
          />
          <p className="text-xs text-muted-foreground dark:text-muted-foreground" data-testid="text-progress-percentage">
            {Math.round(progressPercentage)}% complete
          </p>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4 pt-0" data-testid="content-checklist-items">
          <div className="space-y-3">
            {checklistSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-all",
                  step.completed 
                    ? "bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30" 
                    : "bg-muted/30 dark:bg-muted/20 border border-transparent"
                )}
                data-testid={`item-checklist-${step.id}`}
              >
                <Checkbox
                  checked={step.completed}
                  disabled
                  className="mt-1"
                  data-testid={`checkbox-${step.id}`}
                />
                <div className="flex-1 space-y-1">
                  <p 
                    className={cn(
                      "text-sm font-medium",
                      step.completed 
                        ? "text-foreground dark:text-foreground line-through" 
                        : "text-foreground dark:text-foreground"
                    )}
                    data-testid={`text-step-label-${step.id}`}
                  >
                    {step.label}
                  </p>
                  <p 
                    className="text-xs text-muted-foreground dark:text-muted-foreground"
                    data-testid={`text-step-description-${step.id}`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border dark:border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
              onClick={onRestartTour}
              data-testid="button-restart-tour"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart Tour
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
