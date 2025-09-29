import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Brain, 
  BookCheck, 
  Users, 
  Wind,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import type { Character } from "@shared/schema";
import { 
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

interface AdvancedAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  characters: Character[];
}

export default function AdvancedAnalysisModal({ 
  open, 
  onClose, 
  projectId, 
  projectTitle,
  characters = []
}: AdvancedAnalysisModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("style");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");

  // Style Analysis Query
  const styleAnalysis = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${projectId}/analysis/style`, {});
    },
    onError: (error: any) => {
      if (error?.requiresUpgrade) {
        toast({
          title: "Premium Feature",
          description: "This feature requires a Professional or Enterprise subscription.",
          variant: "destructive",
        });
      } else if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze writing style. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Plot Consistency Analysis
  const plotAnalysis = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${projectId}/analysis/plot`, {});
    },
    onError: (error: any) => {
      if (error?.requiresUpgrade) {
        toast({
          title: "Premium Feature",
          description: "This feature requires a Professional or Enterprise subscription.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze plot consistency.",
          variant: "destructive",
        });
      }
    }
  });

  // Character Development Analysis
  const characterAnalysis = useMutation({
    mutationFn: async (characterId: string) => {
      return await apiRequest("POST", `/api/projects/${projectId}/analysis/character/${characterId}`, {});
    },
    onError: (error: any) => {
      if (error?.requiresUpgrade) {
        toast({
          title: "Premium Feature",
          description: "This feature requires a Professional or Enterprise subscription.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze character development.",
          variant: "destructive",
        });
      }
    }
  });

  // Narrative Flow Analysis
  const narrativeAnalysis = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/projects/${projectId}/analysis/narrative`, {
        targetPacing: "moderate"
      });
    },
    onError: (error: any) => {
      if (error?.requiresUpgrade) {
        toast({
          title: "Premium Feature",
          description: "This feature requires a Professional or Enterprise subscription.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze narrative flow.",
          variant: "destructive",
        });
      }
    }
  });

  // Check for cached results
  const { data: cachedStyle } = useQuery({
    queryKey: [`/api/projects/${projectId}/analysis/cache/style`],
    enabled: false // Only load when requested
  });

  const handleRunAnalysis = (type: string) => {
    switch(type) {
      case 'style':
        styleAnalysis.mutate();
        break;
      case 'plot':
        plotAnalysis.mutate();
        break;
      case 'character':
        if (selectedCharacter) {
          characterAnalysis.mutate(selectedCharacter);
        } else {
          toast({
            title: "Select Character",
            description: "Please select a character to analyze.",
            variant: "destructive",
          });
        }
        break;
      case 'narrative':
        narrativeAnalysis.mutate();
        break;
    }
  };

  const handleExportReport = (analysisData: any, type: string) => {
    const report = {
      project: projectTitle,
      analysisType: type,
      timestamp: new Date().toISOString(),
      data: analysisData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle}_${type}_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Analysis report has been downloaded.",
    });
  };

  const renderStyleAnalysis = () => {
    const data = styleAnalysis.data?.data;
    if (!data && !styleAnalysis.isPending) {
      return (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Style Analysis</h3>
          <p className="text-muted-foreground mb-4">Analyze your writing style across all documents</p>
          <Button onClick={() => handleRunAnalysis('style')} data-testid="button-run-style-analysis">
            <Sparkles className="mr-2 h-4 w-4" />
            Run Style Analysis
          </Button>
        </div>
      );
    }

    if (styleAnalysis.isPending) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    const chartData = data ? [
      { metric: 'Tone Consistency', value: data.tone?.consistency || 0, fullMark: 100 },
      { metric: 'Voice Consistency', value: data.voice?.consistency || 0, fullMark: 100 },
      { metric: 'Sentence Variety', value: data.sentenceVariety?.variation_score || 0, fullMark: 100 },
      { metric: 'Vocabulary Richness', value: data.vocabulary?.richness_score || 0, fullMark: 100 },
      { metric: 'Genre Alignment', value: data.style?.genre_alignment || 0, fullMark: 100 },
      { metric: 'Pacing Effectiveness', value: data.pacing?.effectiveness || 0, fullMark: 100 }
    ] : [];

    return (
      <div className="space-y-6">
        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Primary Tone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.tone?.primary || 'N/A'}</div>
              <Progress value={data?.tone?.consistency || 0} className="mt-2" />
              <span className="text-xs text-muted-foreground">{data?.tone?.consistency || 0}% consistent</span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reading Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Grade {data?.readingLevel?.grade || 'N/A'}</div>
              <Badge variant="outline" className="mt-2">{data?.readingLevel?.complexity || 'N/A'}</Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Vocabulary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.vocabulary?.richness_score || 0}%</div>
              <span className="text-xs text-muted-foreground">{data?.vocabulary?.sophistication || 'N/A'}</span>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Style Metrics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data?.style?.strengths?.map((strength: string, i: number) => (
                  <li key={i} className="text-sm">{strength}</li>
                )) || <li className="text-sm text-muted-foreground">No data available</li>}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data?.style?.weaknesses?.map((weakness: string, i: number) => (
                  <li key={i} className="text-sm">{weakness}</li>
                )) || <li className="text-sm text-muted-foreground">No data available</li>}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {styleAnalysis.data?.recommendations && styleAnalysis.data.recommendations.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommendations:</strong>
              <ul className="mt-2 space-y-1">
                {styleAnalysis.data.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Export Button */}
        {data && (
          <div className="flex justify-end">
            <Button onClick={() => handleExportReport(styleAnalysis.data, 'style')} variant="outline" data-testid="button-export-style">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderPlotAnalysis = () => {
    const data = plotAnalysis.data?.data;
    if (!data && !plotAnalysis.isPending) {
      return (
        <div className="text-center py-12">
          <BookCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Plot Consistency Analysis</h3>
          <p className="text-muted-foreground mb-4">Check for plot holes and timeline inconsistencies</p>
          <Button onClick={() => handleRunAnalysis('plot')} data-testid="button-run-plot-analysis">
            <Sparkles className="mr-2 h-4 w-4" />
            Run Plot Analysis
          </Button>
        </div>
      );
    }

    if (plotAnalysis.isPending) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    const severityColors = {
      minor: "#fbbf24",
      major: "#fb923c", 
      critical: "#ef4444"
    };

    const importanceColors = {
      low: "#94a3b8",
      medium: "#fbbf24",
      high: "#ef4444"
    };

    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Consistency Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold">{data?.overallConsistency || 0}%</div>
              <Progress value={data?.overallConsistency || 0} className="flex-1" />
              {data?.overallConsistency >= 80 && <Badge variant="default" className="bg-green-500">Excellent</Badge>}
              {data?.overallConsistency >= 60 && data?.overallConsistency < 80 && <Badge variant="default" className="bg-yellow-500">Good</Badge>}
              {data?.overallConsistency < 60 && <Badge variant="default" className="bg-red-500">Needs Work</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Plot Holes */}
        {data?.plotHoles && data.plotHoles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                Plot Holes Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.plotHoles.map((hole: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge style={{ backgroundColor: severityColors[hole.severity as keyof typeof severityColors] }}>
                        {hole.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{hole.location}</span>
                    </div>
                    <p className="text-sm mb-2">{hole.description}</p>
                    <p className="text-sm text-muted-foreground italic">Suggestion: {hole.suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unresolved Threads */}
        {data?.unresolvedThreads && data.unresolvedThreads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Story Threads Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.unresolvedThreads.map((thread: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{thread.thread}</div>
                      <div className="text-xs text-muted-foreground">Introduced: {thread.introduced}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{thread.status}</Badge>
                      <Badge style={{ backgroundColor: importanceColors[thread.importance as keyof typeof importanceColors] }}>
                        {thread.importance}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Issues */}
        {data?.timelineIssues && data.timelineIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Timeline Inconsistencies Found:</strong>
              <ul className="mt-2 space-y-1">
                {data.timelineIssues.map((issue: any, i: number) => (
                  <li key={i}>
                    {issue.description} (Chapters: {issue.chapters.join(', ')})
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Strong Points */}
        {data?.strongPoints && data.strongPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Strong Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data.strongPoints.map((point: string, i: number) => (
                  <li key={i} className="text-sm flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Export Button */}
        {data && (
          <div className="flex justify-end">
            <Button onClick={() => handleExportReport(plotAnalysis.data, 'plot')} variant="outline" data-testid="button-export-plot">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderCharacterAnalysis = () => {
    const data = characterAnalysis.data?.data;
    
    if (!selectedCharacter) {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select a character to analyze their development throughout the story.
            </AlertDescription>
          </Alert>
          <div>
            <Label className="text-sm font-medium mb-2">Select Character</Label>
            <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
              <SelectTrigger data-testid="select-character-analysis">
                <SelectValue placeholder="Choose a character" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((character) => (
                  <SelectItem key={character.id} value={character.id}>
                    {character.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCharacter && (
            <Button onClick={() => handleRunAnalysis('character')} data-testid="button-run-character-analysis">
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Character Development
            </Button>
          )}
        </div>
      );
    }

    if (!data && !characterAnalysis.isPending && selectedCharacter) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Character Development Analysis</h3>
          <p className="text-muted-foreground mb-4">Track character arcs and growth</p>
          <Button onClick={() => handleRunAnalysis('character')} data-testid="button-run-character-analysis-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Character
          </Button>
        </div>
      );
    }

    if (characterAnalysis.isPending) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    const developmentData = data?.arc ? [
      { stage: 'Start', progress: 0 },
      { stage: 'Current', progress: data.arc.completeness },
      { stage: 'Projected', progress: 100 }
    ] : [];

    return (
      <div className="space-y-6">
        {/* Character Arc Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Character Arc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Arc Type</span>
                  <p className="font-medium">{data?.arc?.type || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Completeness</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={data?.arc?.completeness || 0} className="flex-1" />
                    <span className="text-sm font-medium">{data?.arc?.completeness || 0}%</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={developmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="progress" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Start Point:</span>
                  <p className="text-sm">{data?.arc?.startPoint || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Current Point:</span>
                  <p className="text-sm">{data?.arc?.currentPoint || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Projected Ending:</span>
                  <p className="text-sm">{data?.arc?.projected || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth & Consistency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Character Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Growth</span>
                  <Badge>{data?.growth?.overall_growth || 0}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Believability</span>
                  <Badge>{data?.growth?.believability || 0}%</Badge>
                </div>
                {data?.growth?.areas && data.growth.areas.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-sm font-medium">Growth Areas:</span>
                    {data.growth.areas.map((area: any, i: number) => (
                      <div key={i} className="text-sm text-muted-foreground">
                        • {area.aspect}: {area.change} (Ch. {area.chapter})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Progress value={data?.consistency?.score || 0} className="flex-1" />
                  <span className="font-medium">{data?.consistency?.score || 0}%</span>
                </div>
                {data?.consistency?.inconsistencies && data.consistency.inconsistencies.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-orange-500">Issues Found:</span>
                    {data.consistency.inconsistencies.map((issue: any, i: number) => (
                      <div key={i} className="text-sm">
                        <AlertCircle className="inline h-3 w-3 mr-1 text-orange-500" />
                        {issue.issue} ({issue.location})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Moments */}
        {data?.keyMoments && data.keyMoments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Character Moments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.keyMoments.map((moment: any, i: number) => (
                  <div key={i} className="border-l-2 border-primary pl-4">
                    <div className="font-medium text-sm">{moment.chapter}</div>
                    <p className="text-sm text-muted-foreground">{moment.moment}</p>
                    <p className="text-xs text-muted-foreground italic">Significance: {moment.significance}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Relationships */}
        {data?.relationships && data.relationships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Relationship Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.relationships.map((rel: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{rel.character}</div>
                      <div className="text-xs text-muted-foreground">{rel.evolution}</div>
                      <div className="text-xs">Current: {rel.current_status}</div>
                    </div>
                    <div className="text-right">
                      <Progress value={rel.development_quality} className="w-20" />
                      <span className="text-xs">{rel.development_quality}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Button */}
        {data && (
          <div className="flex justify-end">
            <Button onClick={() => handleExportReport(characterAnalysis.data, 'character')} variant="outline" data-testid="button-export-character">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderNarrativeAnalysis = () => {
    const data = narrativeAnalysis.data?.data;
    
    if (!data && !narrativeAnalysis.isPending) {
      return (
        <div className="text-center py-12">
          <Wind className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Narrative Flow Analysis</h3>
          <p className="text-muted-foreground mb-4">Analyze pacing, rhythm, and story momentum</p>
          <Button onClick={() => handleRunAnalysis('narrative')} data-testid="button-run-narrative-analysis">
            <Sparkles className="mr-2 h-4 w-4" />
            Run Narrative Analysis
          </Button>
        </div>
      );
    }

    if (narrativeAnalysis.isPending) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    const tensionData = [
      ...(data?.tensionCurve?.peaks || []).map((peak: any) => ({
        chapter: `Ch ${peak.chapter}`,
        intensity: peak.intensity,
        type: 'peak'
      })),
      ...(data?.tensionCurve?.valleys || []).map((valley: any) => ({
        chapter: `Ch ${valley.chapter}`,
        intensity: valley.intensity,
        type: 'valley'
      }))
    ].sort((a, b) => {
      const aNum = parseInt(a.chapter.replace('Ch ', ''));
      const bNum = parseInt(b.chapter.replace('Ch ', ''));
      return aNum - bNum;
    });

    const pacingColors = {
      slow: "#3b82f6",
      moderate: "#10b981",
      fast: "#f59e0b",
      varied: "#8b5cf6"
    };

    return (
      <div className="space-y-6">
        {/* Overall Pacing */}
        <Card>
          <CardHeader>
            <CardTitle>Pacing Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <span className="text-sm text-muted-foreground">Overall Pace</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge style={{ backgroundColor: pacingColors[data?.pacing?.overall as keyof typeof pacingColors] }}>
                    {data?.pacing?.overall || 'N/A'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Effectiveness</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={data?.pacing?.effectiveness || 0} className="flex-1" />
                  <span className="text-sm font-medium">{data?.pacing?.effectiveness || 0}%</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Momentum</span>
                <div className="flex items-center space-x-2 mt-1">
                  {data?.momentum?.building ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">{data?.momentum?.maintained || 0}% maintained</span>
                </div>
              </div>
            </div>

            {/* Chapter-by-chapter pacing */}
            {data?.pacing?.chapters && data.pacing.chapters.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Chapter Pacing</h4>
                <div className="flex flex-wrap gap-2">
                  {data.pacing.chapters.map((ch: any, i: number) => (
                    <div key={i} className="flex items-center space-x-1 p-2 border rounded">
                      <span className="text-xs">Ch {ch.number}:</span>
                      <Badge variant="outline" className="text-xs">{ch.pace}</Badge>
                      {ch.issue && (
                        <AlertCircle className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tension Curve */}
        {tensionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Story Tension Curve</CardTitle>
              <CardDescription>
                Pattern: {data?.tensionCurve?.pattern || 'N/A'} | 
                Effectiveness: {data?.tensionCurve?.effectiveness || 0}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tensionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="chapter" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="intensity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Rhythm & Transitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Narrative Rhythm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Variety</span>
                  <Progress value={data?.rhythm?.variety || 0} className="mt-1" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Flow</span>
                  <Progress value={data?.rhythm?.flow || 0} className="mt-1" />
                </div>
                {data?.rhythm?.patterns && data.rhythm.patterns.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Patterns:</span>
                    <div className="mt-1">
                      {data.rhythm.patterns.map((pattern: string, i: number) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scene Transitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quality</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={data?.transitions?.quality || 0} className="w-20" />
                    <span className="text-sm font-medium">{data?.transitions?.quality || 0}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Smooth: {data?.transitions?.smooth || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Jarring: {data?.transitions?.jarring || 0}</span>
                  </div>
                </div>
                {data?.transitions?.issues && data.transitions.issues.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-orange-500">Issues:</span>
                    {data.transitions.issues.map((issue: any, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground mt-1">
                        Between {issue.between}: {issue.problem}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problem Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.lagAreas && data.lagAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Minus className="mr-2 h-4 w-4 text-blue-500" />
                  Slow/Lagging Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.lagAreas.map((area: any, i: number) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium">{area.location}</div>
                      <div className="text-muted-foreground">Reason: {area.reason}</div>
                      <div className="text-muted-foreground italic">Fix: {area.suggestion}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data?.rushAreas && data.rushAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
                  Rushed Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.rushAreas.map((area: any, i: number) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium">{area.location}</div>
                      <div className="text-muted-foreground">Reason: {area.reason}</div>
                      <div className="text-muted-foreground italic">Fix: {area.suggestion}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Hooks Effectiveness */}
        {data?.hooks && (
          <Card>
            <CardHeader>
              <CardTitle>Hook Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chapter Endings</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={data.hooks.chapter_endings} className="w-32" />
                    <span className="text-sm font-medium">{data.hooks.chapter_endings}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chapter Openings</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={data.hooks.chapter_openings} className="w-32" />
                    <span className="text-sm font-medium">{data.hooks.chapter_openings}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Engagement</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={data.hooks.overall_engagement} className="w-32" />
                    <span className="text-sm font-medium">{data.hooks.overall_engagement}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Button */}
        {data && (
          <div className="flex justify-end">
            <Button onClick={() => handleExportReport(narrativeAnalysis.data, 'narrative')} variant="outline" data-testid="button-export-narrative">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden" data-testid="modal-advanced-analysis">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <DialogTitle>Advanced Writing Analysis</DialogTitle>
              <DialogDescription>
                Deep insights into your writing style, plot consistency, and narrative flow
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="style" data-testid="tab-style">
              <Brain className="mr-2 h-4 w-4" />
              Style
            </TabsTrigger>
            <TabsTrigger value="plot" data-testid="tab-plot">
              <BookCheck className="mr-2 h-4 w-4" />
              Plot
            </TabsTrigger>
            <TabsTrigger value="character" data-testid="tab-character">
              <Users className="mr-2 h-4 w-4" />
              Character
            </TabsTrigger>
            <TabsTrigger value="narrative" data-testid="tab-narrative">
              <Wind className="mr-2 h-4 w-4" />
              Flow
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-200px)] mt-4">
            <TabsContent value="style" className="pr-4">
              {renderStyleAnalysis()}
            </TabsContent>
            <TabsContent value="plot" className="pr-4">
              {renderPlotAnalysis()}
            </TabsContent>
            <TabsContent value="character" className="pr-4">
              {renderCharacterAnalysis()}
            </TabsContent>
            <TabsContent value="narrative" className="pr-4">
              {renderNarrativeAnalysis()}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}