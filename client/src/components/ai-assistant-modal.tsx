import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Lightbulb, 
  Edit3, 
  FileText, 
  Zap,
  Crown
} from "lucide-react";

interface AiAssistantModalProps {
  open: boolean;
  onClose: () => void;
  projects: any[];
}

type PersonaType = "muse" | "editor" | "coach";

export default function AiAssistantModal({ open, onClose, projects }: AiAssistantModalProps) {
  const { toast } = useToast();
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [prompt, setPrompt] = useState("");
  const [creativity, setCreativity] = useState([70]);
  const [length, setLength] = useState("medium");
  const [result, setResult] = useState<string | null>(null);

  const personas = [
    {
      id: "muse" as PersonaType,
      name: "Muse",
      subtitle: "Creative Inspiration",
      description: "Generate evocative scenes with rich sensory details and emotional depth",
      icon: <Lightbulb className="h-5 w-5 text-chart-1" />,
      bgColor: "bg-chart-1/10",
      textColor: "text-chart-1",
      borderColor: "border-chart-1"
    },
    {
      id: "editor" as PersonaType,
      name: "Editor",
      subtitle: "Polish & Refine",
      description: "Improve clarity, grammar, and flow while preserving your voice",
      icon: <Edit3 className="h-5 w-5 text-accent" />,
      bgColor: "bg-accent/10",
      textColor: "text-accent",
      borderColor: "border-accent"
    },
    {
      id: "coach" as PersonaType,
      name: "Coach",
      subtitle: "Structure & Planning",
      description: "Create outlines, story beats, and structural guidance",
      icon: <FileText className="h-5 w-5 text-chart-2" />,
      bgColor: "bg-chart-2/10",
      textColor: "text-chart-2",
      borderColor: "border-chart-2"
    }
  ];

  const generateMutation = useMutation({
    mutationFn: async (data: { persona: PersonaType; projectId: string; userPrompt: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate", {
        intent: data.persona === "muse" ? "draft_scene" : data.persona === "editor" ? "edit_paragraph" : "generate_outline",
        persona: data.persona,
        project_id: data.projectId,
        params: {
          max_tokens: length === "short" ? 400 : length === "medium" ? 800 : 1200,
          deterministic: creativity[0] < 30
        },
        userPrompt: data.userPrompt
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(typeof data.content === "string" ? data.content : JSON.stringify(data.content, null, 2));
      toast({
        title: "Content Generated",
        description: "Your AI assistant has created new content!",
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
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedPersona || !prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a persona and enter a prompt.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      persona: selectedPersona,
      projectId: selectedProject || "",
      userPrompt: prompt
    });
  };

  const handleClose = () => {
    setSelectedPersona(null);
    setSelectedProject("");
    setPrompt("");
    setCreativity([70]);
    setLength("medium");
    setResult(null);
    onClose();
  };

  const selectedPersonaData = personas.find(p => p.id === selectedPersona);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden" data-testid="modal-ai-assistant">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <DialogTitle>AI Writing Assistant</DialogTitle>
              <DialogDescription>Choose your writing companion</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Persona Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-card-foreground">Select AI Persona</h4>
              
              <div className="space-y-3">
                {personas.map((persona) => (
                  <Card 
                    key={persona.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPersona === persona.id 
                        ? `${persona.borderColor} ring-2 ring-opacity-20` 
                        : "border-border"
                    }`}
                    onClick={() => setSelectedPersona(persona.id)}
                    data-testid={`persona-${persona.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 ${persona.bgColor} rounded-lg flex items-center justify-center`}>
                          {persona.icon}
                        </div>
                        <span className="font-medium text-card-foreground">
                          {persona.name} - {persona.subtitle}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-11">
                        {persona.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Right: Input Area */}
            <div className="space-y-4">
              <h4 className="font-medium text-card-foreground">Your Request</h4>
              
              <div className="space-y-4">
                {projects.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-card-foreground mb-2">Project Context</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger data-testid="select-ai-project">
                        <SelectValue placeholder="Select a project (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-card-foreground mb-2">
                    What would you like help with?
                  </Label>
                  <Textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="resize-none editor-content"
                    placeholder="Describe what you'd like the AI to help you with. Be specific about the scene, characters, or writing goals..."
                    data-testid="input-ai-prompt"
                  />
                </div>
                
                {/* AI Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-card-foreground mb-2">Creativity</Label>
                    <Slider
                      value={creativity}
                      onValueChange={setCreativity}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-creativity"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-card-foreground mb-2">Length</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger data-testid="select-ai-length">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (200-400 words)</SelectItem>
                        <SelectItem value="medium">Medium (400-800 words)</SelectItem>
                        <SelectItem value="long">Long (800+ words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Result Display */}
                {result && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-card-foreground">Generated Content</Label>
                    <div className="bg-muted/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap text-card-foreground">{result}</pre>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-chart-1" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-chart-1">24</span> / 100 AI sessions remaining
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    disabled={generateMutation.isPending}
                    data-testid="button-ai-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !selectedPersona || !prompt.trim()}
                    data-testid="button-ai-generate"
                  >
                    {generateMutation.isPending ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
