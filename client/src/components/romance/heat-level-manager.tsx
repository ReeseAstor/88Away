import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RomanceCard, RomanceButton, RomanceIcon, HeatLevelBadge, type HeatLevel } from './index';
import { cn } from '@/lib/utils';

interface Scene {
  id: string;
  title: string;
  documentId: string;
  heatLevel: HeatLevel;
  content: string;
  heatElements: HeatElement[];
  warnings: string[];
  notes?: string;
}

interface HeatElement {
  type: 'tension' | 'physical' | 'emotional' | 'explicit';
  description: string;
  intensity: number; // 1-10 scale
}

interface HeatLevelGuidelines {
  level: HeatLevel;
  description: string;
  characteristics: string[];
  examples: string[];
  warnings: string[];
}

interface HeatLevelManagerProps {
  projectHeatLevel: HeatLevel;
  scenes?: Scene[];
  onHeatLevelChange?: (level: HeatLevel) => void;
  onSceneHeatLevelUpdate?: (sceneId: string, heatLevel: HeatLevel) => void;
  onSceneAnalyze?: (sceneId: string) => void;
}

const HEAT_LEVEL_GUIDELINES: Record<HeatLevel, HeatLevelGuidelines> = {
  sweet: {
    level: 'sweet',
    description: 'Clean romance with minimal physical content',
    characteristics: [
      'Kisses only, nothing more explicit',
      'Emotional intimacy is the focus',
      'Tension through longing looks and gentle touches',
      'Fade-to-black approach for any physical intimacy',
      'Suitable for all ages'
    ],
    examples: [
      'First kiss under the stars',
      'Hand-holding and sweet embraces',
      'Emotional confessions of love',
      'Tender moments without sexual content'
    ],
    warnings: []
  },
  warm: {
    level: 'warm',
    description: 'Moderate heat with some physical content',
    characteristics: [
      'Making out and heavy kissing',
      'Some touching over clothes',
      'Sexual tension but fade-to-black for intimate scenes',
      'Emotional and physical attraction balanced',
      'YA appropriate with parental guidance'
    ],
    examples: [
      'Passionate kissing scenes',
      'Undressing but cutting away before explicit content',
      'Morning-after scenes without details',
      'Sexual tension and anticipation'
    ],
    warnings: ['Mild sexual content', 'Passionate scenes']
  },
  steamy: {
    level: 'steamy',
    description: 'Hot romance with detailed intimate scenes',
    characteristics: [
      'Detailed intimate scenes on page',
      'Multiple love scenes throughout the book',
      'Explicit sexual language and descriptions',
      'Focus on physical pleasure and desire',
      'Adult content - 18+ recommended'
    ],
    examples: [
      'Detailed love-making scenes',
      'Explicit descriptions of physical intimacy',
      'Multiple intimate encounters',
      'Sensual and erotic language'
    ],
    warnings: ['Explicit sexual content', 'Adult themes', 'Graphic intimate scenes']
  },
  scorching: {
    level: 'scorching',
    description: 'Very explicit content with intense scenes',
    characteristics: [
      'Extremely detailed and graphic intimate scenes',
      'Multiple partners or unconventional situations',
      'BDSM, kink, or fetish content',
      'Very explicit language throughout',
      'Mature adult content only'
    ],
    examples: [
      'BDSM or kink scenarios',
      'Multiple explicit scenes per chapter',
      'Unconventional intimate situations',
      'Very graphic sexual descriptions'
    ],
    warnings: ['Very explicit sexual content', 'BDSM/Kink themes', 'Mature adult content', 'Graphic language']
  }
};

const CONTENT_ANALYSIS_KEYWORDS = {
  sweet: ['kiss', 'embrace', 'tender', 'gentle', 'sweet', 'innocent', 'pure'],
  warm: ['passionate', 'desire', 'longing', 'heated', 'aroused', 'want', 'need'],
  steamy: ['naked', 'pleasure', 'moan', 'thrust', 'climax', 'orgasm', 'intimate'],
  scorching: ['explicit terms', 'intense', 'dominant', 'submit', 'bind', 'command']
};

export function HeatLevelManager({
  projectHeatLevel,
  scenes = [],
  onHeatLevelChange,
  onSceneHeatLevelUpdate,
  onSceneAnalyze
}: HeatLevelManagerProps) {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Analyze consistency across scenes
  const heatConsistency = useMemo(() => {
    if (scenes.length === 0) return { consistent: true, issues: [] };
    
    const issues: string[] = [];
    const scenesByLevel = scenes.reduce((acc, scene) => {
      if (!acc[scene.heatLevel]) acc[scene.heatLevel] = [];
      acc[scene.heatLevel].push(scene);
      return acc;
    }, {} as Record<HeatLevel, Scene[]>);

    // Check if scenes exceed project heat level
    const projectLevelIndex = ['sweet', 'warm', 'steamy', 'scorching'].indexOf(projectHeatLevel);
    Object.entries(scenesByLevel).forEach(([level, sceneList]) => {
      const levelIndex = ['sweet', 'warm', 'steamy', 'scorching'].indexOf(level as HeatLevel);
      if (levelIndex > projectLevelIndex) {
        issues.push(`${sceneList.length} scene(s) rated "${level}" exceed project level "${projectHeatLevel}"`);
      }
    });

    // Check for dramatic inconsistencies
    const levels = Object.keys(scenesByLevel);
    if (levels.length > 2) {
      const minLevel = levels.reduce((min, level) => 
        ['sweet', 'warm', 'steamy', 'scorching'].indexOf(level as HeatLevel) < 
        ['sweet', 'warm', 'steamy', 'scorching'].indexOf(min as HeatLevel) ? level : min
      );
      const maxLevel = levels.reduce((max, level) => 
        ['sweet', 'warm', 'steamy', 'scorching'].indexOf(level as HeatLevel) > 
        ['sweet', 'warm', 'steamy', 'scorching'].indexOf(max as HeatLevel) ? level : max
      );
      
      const gap = ['sweet', 'warm', 'steamy', 'scorching'].indexOf(maxLevel as HeatLevel) - 
                  ['sweet', 'warm', 'steamy', 'scorching'].indexOf(minLevel as HeatLevel);
      
      if (gap > 2) {
        issues.push(`Large heat level variation: scenes range from "${minLevel}" to "${maxLevel}"`);
      }
    }

    return {
      consistent: issues.length === 0,
      issues
    };
  }, [scenes, projectHeatLevel]);

  // Get heat level distribution
  const heatDistribution = useMemo(() => {
    const distribution = scenes.reduce((acc, scene) => {
      acc[scene.heatLevel] = (acc[scene.heatLevel] || 0) + 1;
      return acc;
    }, {} as Record<HeatLevel, number>);
    
    return distribution;
  }, [scenes]);

  const analyzeSceneContent = (scene: Scene): { suggestedLevel: HeatLevel; confidence: number; reasons: string[] } => {
    const content = scene.content.toLowerCase();
    const reasons: string[] = [];
    let scores = { sweet: 0, warm: 0, steamy: 0, scorching: 0 };

    // Analyze keywords
    Object.entries(CONTENT_ANALYSIS_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
        scores[level as HeatLevel] += matches;
        if (matches > 0) {
          reasons.push(`Found "${keyword}" (${matches}x) suggesting ${level} content`);
        }
      });
    });

    // Determine suggested level
    const maxScore = Math.max(...Object.values(scores));
    const suggestedLevel = Object.keys(scores).find(level => 
      scores[level as HeatLevel] === maxScore
    ) as HeatLevel || 'sweet';
    
    const totalWords = content.split(' ').length;
    const confidence = Math.min(100, (maxScore / Math.max(1, totalWords / 100)) * 100);

    return { suggestedLevel, confidence, reasons };
  };

  const getHeatLevelColor = (level: HeatLevel) => {
    const colors = {
      sweet: 'bg-romance-champagne-100 text-romance-champagne-800',
      warm: 'bg-romance-blush-100 text-romance-blush-800',
      steamy: 'bg-romance-burgundy-100 text-romance-burgundy-800',
      scorching: 'bg-passion-100 text-passion-800'
    };
    return colors[level];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800">
            Heat Level Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage content rating and spice level consistency across your romance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <RomanceButton
            variant="secondary"
            onClick={() => setIsGuidelinesOpen(true)}
          >
            <RomanceIcon name="info" className="mr-2" />
            Guidelines
          </RomanceButton>
          <div className="flex items-center space-x-2">
            <Label>Project Heat Level:</Label>
            <HeatLevelBadge level={projectHeatLevel} />
          </div>
        </div>
      </div>

      {/* Consistency Alerts */}
      {!heatConsistency.consistent && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <RomanceIcon name="warning" className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Heat Level Consistency Issues</div>
            <ul className="space-y-1 text-sm">
              {heatConsistency.issues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-600">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scenes">Scene Analysis</TabsTrigger>
          <TabsTrigger value="guidelines">Content Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Project Heat Level Settings */}
          <RomanceCard variant="elegant">
            <CardHeader>
              <CardTitle>Project Heat Level Settings</CardTitle>
              <CardDescription>
                Set the overall content rating for your romance project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Current Heat Level</Label>
                  <Select value={projectHeatLevel} onValueChange={(value: HeatLevel) => onHeatLevelChange?.(value)}>
                    <SelectTrigger className="romance-input mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sweet">Sweet 🍯</SelectItem>
                      <SelectItem value="warm">Warm 🌸</SelectItem>
                      <SelectItem value="steamy">Steamy 🔥</SelectItem>
                      <SelectItem value="scorching">Scorching 💥</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Total Scenes</Label>
                  <div className="text-2xl font-semibold text-romance-burgundy-800 mt-2">
                    {scenes.length}
                  </div>
                </div>
              </div>

              <div className="bg-romance-blush-50 p-4 rounded-lg border border-romance-blush-200">
                <h4 className="font-medium text-romance-burgundy-800 mb-2">
                  {HEAT_LEVEL_GUIDELINES[projectHeatLevel].description}
                </h4>
                <ul className="text-sm text-romance-burgundy-700 space-y-1">
                  {HEAT_LEVEL_GUIDELINES[projectHeatLevel].characteristics.slice(0, 3).map((char, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span>•</span>
                      <span>{char}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </RomanceCard>

          {/* Heat Level Distribution */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Scene Heat Level Distribution</CardTitle>
              <CardDescription>
                How your scenes are distributed across heat levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scenes.length === 0 ? (
                <div className="text-center py-8">
                  <RomanceIcon name="book" size="xl" className="mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No scenes to analyze yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(['sweet', 'warm', 'steamy', 'scorching'] as HeatLevel[]).map(level => {
                    const count = heatDistribution[level] || 0;
                    const percentage = scenes.length > 0 ? (count / scenes.length) * 100 : 0;
                    
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <HeatLevelBadge level={level} />
                          <span className="text-sm text-muted-foreground">
                            {count} scenes ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </RomanceCard>
        </TabsContent>

        <TabsContent value="scenes" className="space-y-6">
          {/* Scene List */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Scene Heat Level Analysis</CardTitle>
              <CardDescription>
                Review and adjust heat levels for individual scenes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scenes.length === 0 ? (
                <div className="text-center py-8">
                  <RomanceIcon name="edit-pencil" size="xl" className="mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No scenes available for analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scenes.map(scene => {
                    const analysis = analyzeSceneContent(scene);
                    const needsReview = scene.heatLevel !== analysis.suggestedLevel;
                    
                    return (
                      <div key={scene.id} className="border border-romance-burgundy-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-romance-burgundy-800">
                                {scene.title}
                              </h4>
                              <HeatLevelBadge level={scene.heatLevel} />
                              {needsReview && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  Needs Review
                                </Badge>
                              )}
                            </div>
                            
                            {needsReview && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <RomanceIcon name="warning" size="sm" />
                                  <span className="text-sm font-medium">
                                    AI suggests: 
                                  </span>
                                  <HeatLevelBadge level={analysis.suggestedLevel} />
                                  <span className="text-xs text-muted-foreground">
                                    ({analysis.confidence.toFixed(0)}% confidence)
                                  </span>
                                </div>
                                {analysis.reasons.length > 0 && (
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {analysis.reasons.slice(0, 2).map((reason, index) => (
                                      <li key={index}>• {reason}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {scene.warnings.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {scene.warnings.map((warning, index) => (
                                  <Badge key={index} variant="outline" className="text-xs text-red-600 border-red-300">
                                    {warning}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {scene.notes && (
                              <p className="text-sm text-muted-foreground">
                                {scene.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Select 
                              value={scene.heatLevel} 
                              onValueChange={(value: HeatLevel) => onSceneHeatLevelUpdate?.(scene.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sweet">Sweet</SelectItem>
                                <SelectItem value="warm">Warm</SelectItem>
                                <SelectItem value="steamy">Steamy</SelectItem>
                                <SelectItem value="scorching">Scorching</SelectItem>
                              </SelectContent>
                            </Select>
                            <RomanceButton
                              variant="secondary"
                              size="sm"
                              onClick={() => onSceneAnalyze?.(scene.id)}
                            >
                              <RomanceIcon name="search" size="sm" />
                            </RomanceButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </RomanceCard>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          {/* Content Guidelines */}
          <div className="grid gap-6">
            {(['sweet', 'warm', 'steamy', 'scorching'] as HeatLevel[]).map(level => (
              <RomanceCard key={level} variant={level === projectHeatLevel ? 'passion' : 'default'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <HeatLevelBadge level={level} />
                      <span>{HEAT_LEVEL_GUIDELINES[level].description}</span>
                    </CardTitle>
                    {level === projectHeatLevel && (
                      <Badge className="bg-romance-burgundy-600 text-white">
                        Current Level
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-romance-burgundy-800 mb-2">Characteristics:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {HEAT_LEVEL_GUIDELINES[level].characteristics.map((char, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-romance-burgundy-800 mb-2">Examples:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {HEAT_LEVEL_GUIDELINES[level].examples.map((example, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {HEAT_LEVEL_GUIDELINES[level].warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-romance-burgundy-800 mb-2">Content Warnings:</h4>
                      <div className="flex flex-wrap gap-2">
                        {HEAT_LEVEL_GUIDELINES[level].warnings.map((warning, index) => (
                          <Badge key={index} variant="outline" className="text-red-600 border-red-300">
                            {warning}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </RomanceCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}