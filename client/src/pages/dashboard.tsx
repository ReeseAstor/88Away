import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import ProjectModal from "@/components/project-modal";
import AiAssistantModal from "@/components/ai-assistant-modal";
import OnboardingWelcome from "@/components/onboarding-welcome";
import GettingStartedChecklist from "@/components/getting-started-checklist";
import { ActivityFeed } from "@/components/activity-feed";
import { useState } from "react";
import { Link } from "wouter";
import { 
  BookOpen, 
  Users, 
  FileText, 
  Zap, 
  Plus,
  TrendingUp,
  Clock,
  Activity,
  Crown,
  Edit3,
  Lightbulb,
  Bot,
  Download
} from "lucide-react";
import { Project, AiGeneration, type OnboardingProgress } from "@shared/schema";

interface DashboardStats {
  totalWords: number;
  activeProjects: number;
  aiSessions: number;
  collaborators: number;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: aiGenerations = [] } = useQuery<AiGeneration[]>({
    queryKey: ['/api/ai/history'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: onboardingProgress } = useQuery<OnboardingProgress>({
    queryKey: ['/api/user/onboarding'],
    enabled: isAuthenticated,
    retry: false,
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: async (progress: Partial<OnboardingProgress>) => {
      await apiRequest("PATCH", "/api/user/onboarding", progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  useEffect(() => {
    if (isAuthenticated && onboardingProgress && !onboardingProgress.welcomeShown) {
      setShowWelcomeModal(true);
    }
  }, [isAuthenticated, onboardingProgress]);

  useEffect(() => {
    if (isAuthenticated && onboardingProgress && !onboardingProgress.tourCompleted) {
      const hasIncompleteSteps = Object.values(onboardingProgress.steps || {}).some(completed => !completed);
      setShowChecklist(hasIncompleteSteps);
    } else {
      setShowChecklist(false);
    }
  }, [isAuthenticated, onboardingProgress]);

  useEffect(() => {
    if (projects.length > 0 && onboardingProgress && !onboardingProgress.steps.createProject) {
      updateOnboardingMutation.mutate({
        steps: { ...onboardingProgress.steps, createProject: true }
      });
    }
  }, [projects.length, onboardingProgress]);

  useEffect(() => {
    if (aiGenerations.length > 0 && onboardingProgress && !onboardingProgress.steps.useAI) {
      updateOnboardingMutation.mutate({
        steps: { ...onboardingProgress.steps, useAI: true }
      });
    }
  }, [aiGenerations.length, onboardingProgress]);

  useEffect(() => {
    if (onboardingProgress && !onboardingProgress.tourCompleted) {
      const allStepsComplete = Object.values(onboardingProgress.steps || {}).every(completed => completed);
      if (allStepsComplete) {
        updateOnboardingMutation.mutate({
          tourCompleted: true,
          steps: { ...onboardingProgress.steps }
        });
      }
    }
  }, [onboardingProgress]);

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalWords: projects.reduce((total: number, project: Project) => total + (project.currentWordCount || 0), 0),
    activeProjects: projects.length,
    aiSessions: aiGenerations.length,
    collaborators: 8 // This would come from actual collaborator data
  };

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      await apiRequest("POST", "/api/projects", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setShowProjectModal(false);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWelcomeComplete = () => {
    updateOnboardingMutation.mutate({ welcomeShown: true });
    setShowWelcomeModal(false);
  };

  const handleWelcomeSkip = () => {
    updateOnboardingMutation.mutate({ welcomeShown: true });
    setShowWelcomeModal(false);
  };

  const handleRestartTour = () => {
    setShowWelcomeModal(true);
  };

  const handleDismissChecklist = () => {
    setShowChecklist(false);
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath="/"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Last updated:</span>
                <span className="text-sm font-medium" data-testid="text-last-updated">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* AI Status Indicator */}
              <div className="flex items-center space-x-2 bg-chart-1/10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-chart-1 rounded-full animate-pulse"></div>
                <span className="text-sm text-chart-1 font-medium">AI Ready</span>
              </div>
              
              {/* Export Button */}
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-words">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Words</p>
                    <p className="text-2xl font-bold text-card-foreground" data-testid="text-total-words">
                      {stats.totalWords.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-chart-1/10 rounded-full">
                    <FileText className="h-5 w-5 text-chart-1" />
                  </div>
                </div>
                <p className="text-sm text-chart-1 mt-2">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +12% from last week
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-active-projects">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold text-card-foreground" data-testid="text-active-projects">
                      {stats.activeProjects}
                    </p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-full">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <p className="text-sm text-accent mt-2">
                  {Math.max(0, stats.activeProjects - 1)} in progress
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-ai-sessions">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">AI Sessions</p>
                    <p className="text-2xl font-bold text-card-foreground" data-testid="text-ai-sessions">
                      {stats.aiSessions}
                    </p>
                  </div>
                  <div className="p-3 bg-chart-2/10 rounded-full">
                    <Bot className="h-5 w-5 text-chart-2" />
                  </div>
                </div>
                <p className="text-sm text-chart-2 mt-2">This month</p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-collaborators">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Collaborators</p>
                    <p className="text-2xl font-bold text-card-foreground" data-testid="text-collaborators">
                      {stats.collaborators}
                    </p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-full">
                    <Users className="h-5 w-5 text-destructive" />
                  </div>
                </div>
                <p className="text-sm text-destructive mt-2">Across all projects</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Recent Projects & AI Assistant */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Recent Projects */}
              <Card data-testid="card-recent-projects">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowProjectModal(true)}
                      data-testid="button-new-project"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {projectsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-muted/30 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8" data-testid="text-no-projects">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-card-foreground mb-2">No projects yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                      <Button onClick={() => setShowProjectModal(true)} data-testid="button-create-first-project">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project: Project) => {
                        const progress = project.targetWordCount 
                          ? Math.round(((project.currentWordCount || 0) / project.targetWordCount) * 100)
                          : 0;
                        
                        return (
                          <Link key={project.id} href={`/projects/${project.id}`}>
                            <div 
                              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              data-testid={`card-project-${project.id}`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-accent" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-card-foreground" data-testid={`text-project-title-${project.id}`}>
                                    {project.title}
                                  </h3>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span data-testid={`text-word-count-${project.id}`}>
                                      {(project.currentWordCount || 0).toLocaleString()} words
                                    </span>
                                    <span>•</span>
                                    <span data-testid={`text-last-modified-${project.id}`}>
                                      {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown'}
                                    </span>
                                    {project.genre && (
                                      <>
                                        <span>•</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {project.genre}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {project.targetWordCount && (
                                <div className="flex items-center space-x-2">
                                  <Progress value={progress} className="w-16" />
                                  <span className="text-sm text-muted-foreground">{progress}%</span>
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* AI Writing Assistant Panel */}
              <Card data-testid="card-ai-assistant">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-semibold">AI Writing Assistant</CardTitle>
                  <CardDescription>Your creative writing companions are ready to help</CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Muse Persona */}
                    <div className="p-4 border border-border rounded-lg hover:border-accent transition-colors cursor-pointer group">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center group-hover:bg-chart-1/20 transition-colors">
                          <Lightbulb className="h-5 w-5 text-chart-1" />
                        </div>
                        <div>
                          <h4 className="font-medium text-card-foreground">Muse</h4>
                          <p className="text-xs text-muted-foreground">Creative inspiration</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Generate evocative scenes with rich sensory details and emotional depth.
                      </p>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Available</span>
                          <span className="text-chart-1">●</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Editor Persona */}
                    <div className="p-4 border border-border rounded-lg hover:border-accent transition-colors cursor-pointer group">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <Edit3 className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-medium text-card-foreground">Editor</h4>
                          <p className="text-xs text-muted-foreground">Polish & refine</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Improve clarity, grammar, and flow while preserving your unique voice.
                      </p>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Available</span>
                          <span className="text-accent">●</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Coach Persona */}
                    <div className="p-4 border border-border rounded-lg hover:border-accent transition-colors cursor-pointer group">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center group-hover:bg-chart-2/20 transition-colors">
                          <FileText className="h-5 w-5 text-chart-2" />
                        </div>
                        <div>
                          <h4 className="font-medium text-card-foreground">Coach</h4>
                          <p className="text-xs text-muted-foreground">Structure & planning</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create outlines, story beats, and structural guidance for your narrative.
                      </p>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Available</span>
                          <span className="text-chart-2">●</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="font-medium text-card-foreground mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowAiModal(true)}
                        data-testid="button-ai-generate-scene"
                      >
                        <Zap className="mr-2 h-3 w-3" />
                        Generate Scene
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowAiModal(true)}
                        data-testid="button-ai-polish-text"
                      >
                        <Edit3 className="mr-2 h-3 w-3" />
                        Polish Text
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowAiModal(true)}
                        data-testid="button-ai-create-outline"
                      >
                        <FileText className="mr-2 h-3 w-3" />
                        Create Outline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Story Bible & Activity */}
            <div className="space-y-8">
              
              {/* Story Bible Quick Access */}
              <Card data-testid="card-story-bible">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-semibold">Story Bible</CardTitle>
                  <CardDescription>Quick access to your world elements</CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-chart-1/10 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-chart-1" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Characters</p>
                        <p className="text-xs text-muted-foreground">No profiles yet</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Worldbuilding</p>
                        <p className="text-xs text-muted-foreground">No entries yet</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-chart-2/10 rounded-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 text-chart-2" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Timeline</p>
                        <p className="text-xs text-muted-foreground">No events yet</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => setShowProjectModal(true)}
                    data-testid="button-add-entry"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project First
                  </Button>
                </CardContent>
              </Card>
              
              {/* Subscription Status */}
              <Card data-testid="card-subscription">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-card-foreground">Pro Plan</h3>
                    <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                      <Crown className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">AI Sessions</span>
                      <span className="text-card-foreground font-medium">{stats.aiSessions} / 100</span>
                    </div>
                    
                    <Progress value={(stats.aiSessions / 100) * 100} className="w-full" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next billing</span>
                      <span className="text-card-foreground font-medium">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Link href="/subscription">
                    <Button className="w-full mt-4" variant="outline" data-testid="button-manage-subscription">
                      Manage Subscription
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <ActivityFeed className="" />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ProjectModal 
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSubmit={(data) => createProjectMutation.mutate(data)}
        loading={createProjectMutation.isPending}
      />

      <AiAssistantModal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        projects={projects}
      />

      {/* Onboarding Components */}
      <OnboardingWelcome
        open={showWelcomeModal}
        onClose={handleWelcomeSkip}
        onComplete={handleWelcomeComplete}
      />

      {showChecklist && onboardingProgress && (
        <GettingStartedChecklist
          steps={onboardingProgress.steps}
          onRestartTour={handleRestartTour}
          onDismiss={handleDismissChecklist}
        />
      )}
    </div>
  );
}
