import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { RomanceCard, RomanceButton, RomanceIcon, HeatLevelBadge, type HeatLevel } from './index';
import { cn } from '@/lib/utils';

interface TensionAnalysis {
  id: string;
  sceneText: string;
  currentLevel: 'low' | 'medium' | 'high' | 'intense';
  desiredLevel: 'low' | 'medium' | 'high' | 'intense';
  tensionType: 'emotional' | 'sexual' | 'romantic' | 'situational';
  enhancements: Array<{
    technique: string;
    implementation: string;
    impact: string;
    heatLevel: HeatLevel;
  }>;
  analysis: {
    currentScore: number;
    potentialScore: number;
    effectivenessRating: number;
    tensionTypes: string[];
  };
  suggestions: {
    dialogueImprovements: string[];
    bodyLanguageCues: string[];
    pacingRecommendations: string;
  };
  metadata: {
    heatLevel: HeatLevel;
    generatedAt: Date;
    model: string;
  };
}

interface TensionBuilderProps {
  projectId: string;
  onAnalysisComplete?: (analysis: TensionAnalysis) => void;
  romanceContext?: any;
}

const TENSION_LEVELS = {
  low: { label: 'Low', score: 25, color: 'bg-gray-400' },
  medium: { label: 'Medium', score: 50, color: 'bg-yellow-500' },
  high: { label: 'High', score: 75, color: 'bg-orange-500' },
  intense: { label: 'Intense', score: 100, color: 'bg-red-500' }
};

const TENSION_TYPES = {
  emotional: { icon: '💭', label: 'Emotional', description: 'Internal feelings, vulnerability, emotional stakes' },
  romantic: { icon: '💕', label: 'Romantic', description: 'Love, attraction, romantic connection' },
  sexual: { icon: '🔥', label: 'Sexual', description: 'Physical desire, sensuality, sexual chemistry' },
  situational: { icon: '⚡', label: 'Situational', description: 'External obstacles, circumstances, drama' }
};

export function TensionBuilder({ projectId, onAnalysisComplete, romanceContext }: TensionBuilderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TensionAnalysis | null>(null);
  const [sceneText, setSceneText] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'low' | 'medium' | 'high' | 'intense'>('medium');
  const [desiredLevel, setDesiredLevel] = useState<'low' | 'medium' | 'high' | 'intense'>('high');
  const [tensionType, setTensionType] = useState<'emotional' | 'sexual' | 'romantic' | 'situational'>('romantic');
  const [heatLevel, setHeatLevel] = useState<HeatLevel>('warm');
  const [constraints, setConstraints] = useState('');

  const handleAnalyze = async () => {
    if (!sceneText.trim()) return;

    setIsAnalyzing(true);
    try {
      const demoAnalysis: TensionAnalysis = {
        id: `analysis_${Date.now()}`,
        sceneText,
        currentLevel,
        desiredLevel,
        tensionType,
        enhancements: [
          {
            technique: 'Physical Awareness Building',
            implementation: 'Add subtle physical reactions and awareness between characters',
            impact: 'Increases romantic chemistry through body language',
            heatLevel: heatLevel
          },
          {
            technique: 'Dialogue Subtext Enhancement',
            implementation: 'Layer deeper meaning beneath surface conversation',
            impact: 'Creates anticipation and emotional depth',
            heatLevel: heatLevel
          }
        ],
        analysis: {
          currentScore: TENSION_LEVELS[currentLevel].score,
          potentialScore: TENSION_LEVELS[desiredLevel].score,
          effectivenessRating: 8.5,
          tensionTypes: [tensionType, 'emotional']
        },
        suggestions: {
          dialogueImprovements: [
            'Add meaningful pauses and hesitations',
            'Include character names spoken more intimately',
            'Use double meanings and romantic subtext'
          ],
          bodyLanguageCues: [
            'Describe eye contact and lingering glances',
            'Include subtle touches and proximity',
            'Show internal physical reactions'
          ],
          pacingRecommendations: 'Build tension gradually through alternating moments of closeness and distance'
        },
        metadata: {
          heatLevel,
          generatedAt: new Date(),
          model: 'tension-builder-ai'
        }
      };

      setAnalysis(demoAnalysis);
      onAnalysisComplete?.(demoAnalysis);
    } catch (error) {
      console.error('Tension analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTensionProgress = (level: string) => {
    return TENSION_LEVELS[level as keyof typeof TENSION_LEVELS]?.score || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800">
            Tension Builder AI
          </h2>
          <p className="text-muted-foreground mt-1">
            Analyze and enhance romantic tension in your scenes
          </p>
        </div>
      </div>

      {!analysis ? (
        <>
          <RomanceCard>
            <CardHeader>
              <CardTitle>Scene Analysis Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  value={sceneText}
                  onChange={(e) => setSceneText(e.target.value)}
                  className="romance-input min-h-[200px]"
                  placeholder="Paste your scene text here for tension analysis..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Tension Level</label>
                  <Select value={currentLevel} onValueChange={setCurrentLevel}>
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TENSION_LEVELS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Desired Tension Level</label>
                  <Select value={desiredLevel} onValueChange={setDesiredLevel}>
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TENSION_LEVELS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tension Type</label>
                  <Select value={tensionType} onValueChange={setTensionType}>
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TENSION_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.icon} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Heat Level</label>
                  <Select value={heatLevel} onValueChange={setHeatLevel}>
                    <SelectTrigger className="romance-input">
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
              </div>

              <RomanceButton
                variant="primary"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !sceneText.trim()}
                className="w-full"
              >
                {isAnalyzing ? 'Analyzing Tension...' : 'Analyze Romantic Tension'}
              </RomanceButton>
            </CardContent>
          </RomanceCard>
        </>
      ) : (
        <>
          <RomanceCard>
            <CardHeader>
              <CardTitle>Tension Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-romance-burgundy-600">
                    {analysis.analysis.currentScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Current Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.analysis.potentialScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Target Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-romance-burgundy-600">
                    {analysis.analysis.effectivenessRating}/10
                  </div>
                  <div className="text-sm text-muted-foreground">Effectiveness</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tension Progression</label>
                <Progress value={analysis.analysis.potentialScore} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Intense</span>
                </div>
              </div>
            </CardContent>
          </RomanceCard>

          <RomanceCard>
            <CardHeader>
              <CardTitle>Enhancement Techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.enhancements.map((enhancement, index) => (
                  <div key={index} className="border border-romance-burgundy-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-romance-burgundy-800">
                        {enhancement.technique}
                      </h4>
                      <HeatLevelBadge level={enhancement.heatLevel} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Implementation:</strong> {enhancement.implementation}
                    </p>
                    <p className="text-sm text-romance-burgundy-700">
                      <strong>Impact:</strong> {enhancement.impact}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </RomanceCard>

          <div className="flex justify-center">
            <RomanceButton
              variant="secondary"
              onClick={() => setAnalysis(null)}
            >
              Analyze Another Scene
            </RomanceButton>
          </div>
        </>
      )}
    </div>
  );
}