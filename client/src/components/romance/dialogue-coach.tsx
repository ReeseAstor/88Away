import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { RomanceCard, RomanceButton, RomanceIcon, HeatLevelBadge, type HeatLevel } from './index';
import { cn } from '@/lib/utils';

interface DialogueSegment {
  id: string;
  speaker: string;
  originalText: string;
  enhancedText?: string;
  character: {
    name: string;
    personality: string;
    romanticArchetype?: string;
    voice?: string;
  };
}

interface DialogueCoachRequest {
  originalDialogue: string;
  characters: Array<{
    name: string;
    personality: string;
    romanticArchetype?: string;
    voice?: string;
  }>;
  relationshipStatus: string;
  tensionGoal: string;
  heatLevel: HeatLevel;
  context: string;
  specificNeeds?: string;
}

interface DialogueEnhancement {
  id: string;
  originalDialogue: string;
  enhancedDialogue: string;
  improvements: Array<{
    originalLine: string;
    enhancedLine: string;
    character: string;
    improvementType: 'chemistry' | 'subtext' | 'voice' | 'emotion' | 'tension';
    explanation: string;
  }>;
  analysis: {
    chemistryLevel: 'low' | 'medium' | 'high' | 'electric';
    authenticityScore: number;
    voiceConsistency: string;
  };
  suggestions: {
    subtextOpportunities: string[];
    chemistryBuilders: string[];
    emotionalDepth: string[];
  };
  metadata: {
    heatLevel: HeatLevel;
    generatedAt: Date;
    model: string;
  };
}

interface DialogueCoachProps {
  projectId: string;
  onDialogueEnhanced?: (enhancement: DialogueEnhancement) => void;
  onDialogueSaved?: (enhancement: DialogueEnhancement) => void;
  availableCharacters?: Array<{
    id: string;
    name: string;
    personality: string;
    romanticArchetype?: string;
  }>;
  romanceContext?: any;
}

const RELATIONSHIP_STATUSES = [
  'Strangers meeting for first time',
  'Acquaintances with growing interest',
  'Friends realizing deeper feelings',
  'New romantic partners',
  'Established couple in love',
  'Couple facing conflict',
  'Ex-lovers reuniting',
  'Enemies with attraction',
  'Secret relationship',
  'Arranged relationship developing'
];

const TENSION_GOALS = [
  'Build initial attraction',
  'Create sexual tension',
  'Deepen emotional connection',
  'Show vulnerability',
  'Increase romantic chemistry',
  'Create anticipation',
  'Build to kiss/intimate moment',
  'Resolve misunderstanding',
  'Show commitment',
  'Express love/feelings'
];

const IMPROVEMENT_TYPE_CONFIG = {
  chemistry: { icon: '💕', label: 'Chemistry', color: 'text-romance-burgundy-600' },
  subtext: { icon: '💭', label: 'Subtext', color: 'text-purple-600' },
  voice: { icon: '🎭', label: 'Voice', color: 'text-blue-600' },
  emotion: { icon: '💗', label: 'Emotion', color: 'text-pink-600' },
  tension: { icon: '⚡', label: 'Tension', color: 'text-orange-600' }
};

export function DialogueCoach({
  projectId,
  onDialogueEnhanced,
  onDialogueSaved,
  availableCharacters = [],
  romanceContext
}: DialogueCoachProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enhancement, setEnhancement] = useState<DialogueEnhancement | null>(null);
  const [activeTab, setActiveTab] = useState('input');

  const [request, setRequest] = useState<DialogueCoachRequest>({
    originalDialogue: '',
    characters: [],
    relationshipStatus: '',
    tensionGoal: '',
    heatLevel: 'warm',
    context: '',
    specificNeeds: ''
  });

  const handleCharacterAdd = (character: any) => {
    if (!request.characters.find(c => c.name === character.name)) {
      setRequest({
        ...request,
        characters: [...request.characters, {
          name: character.name,
          personality: character.personality || '',
          romanticArchetype: character.romanticArchetype,
          voice: character.voice
        }]
      });
    }
  };

  const handleCharacterRemove = (characterName: string) => {
    setRequest({
      ...request,
      characters: request.characters.filter(c => c.name !== characterName)
    });
  };

  const parseDialogue = (text: string): DialogueSegment[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const segments: DialogueSegment[] = [];

    lines.forEach((line, index) => {
      // Try to identify speaker from common dialogue formats
      let speaker = 'Unknown';
      let dialogue = line.trim();

      // Pattern: "Name: dialogue" or "Name said, 'dialogue'"
      const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
      const quotedMatch = line.match(/^([^"']+)(?:said|asked|replied|whispered|murmured)[^"']*["']([^"']+)["']/i);
      
      if (colonMatch) {
        speaker = colonMatch[1].trim();
        dialogue = colonMatch[2].trim();
      } else if (quotedMatch) {
        speaker = quotedMatch[1].trim();
        dialogue = quotedMatch[2].trim();
      } else if (line.includes('"') || line.includes("'")) {
        // Extract quoted text and try to find speaker
        const quoteMatch = line.match(/["']([^"']+)["']/);
        if (quoteMatch) {
          dialogue = quoteMatch[1];
          const beforeQuote = line.substring(0, line.indexOf(quoteMatch[0]));
          const speakerMatch = beforeQuote.match(/([A-Z][a-z]+)/);
          if (speakerMatch) {
            speaker = speakerMatch[1];
          }
        }
      }

      const character = request.characters.find(c => 
        c.name.toLowerCase().includes(speaker.toLowerCase()) ||
        speaker.toLowerCase().includes(c.name.toLowerCase())
      );

      segments.push({
        id: `segment_${index}`,
        speaker,
        originalText: dialogue,
        character: character || { name: speaker, personality: '' }
      });
    });

    return segments;
  };

  const handleAnalyze = async () => {
    if (!request.originalDialogue.trim() || request.characters.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    try {
      // This would call the dialogue coach AI service
      const response = await fetch(`/api/ai/romance/dialogue-enhancement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          request,
          romanceContext
        }),
      });

      const result = await response.json();
      
      const dialogueSegments = parseDialogue(request.originalDialogue);
      
      const enhancementResult: DialogueEnhancement = {
        id: `enhancement_${Date.now()}`,
        originalDialogue: request.originalDialogue,
        enhancedDialogue: result.enhancedDialogue || request.originalDialogue,
        improvements: result.improvements || [],
        analysis: result.analysis || {
          chemistryLevel: 'medium',
          authenticityScore: 7.5,
          voiceConsistency: 'Good character voice maintenance'
        },
        suggestions: result.suggestions || {
          subtextOpportunities: ['Add more subtext to character interactions'],
          chemistryBuilders: ['Include more physical awareness between characters'],
          emotionalDepth: ['Show vulnerability through dialogue choices']
        },
        metadata: {
          heatLevel: request.heatLevel,
          generatedAt: new Date(),
          model: result.metadata?.model || 'demo'
        }
      };

      setEnhancement(enhancementResult);
      onDialogueEnhanced?.(enhancementResult);
      setActiveTab('result');
    } catch (error) {
      console.error('Dialogue enhancement failed:', error);
      
      // Create a demo enhancement for development
      const segments = parseDialogue(request.originalDialogue);
      const demoEnhancement: DialogueEnhancement = {
        id: `enhancement_${Date.now()}`,
        originalDialogue: request.originalDialogue,
        enhancedDialogue: `[Enhanced ${request.heatLevel} dialogue would appear here]

This shows the AI-enhanced version of your dialogue with:
- Improved romantic chemistry
- Better character voice consistency
- Enhanced ${request.tensionGoal}
- Appropriate ${request.heatLevel} content level

Original:
${request.originalDialogue}`,
        improvements: [
          {
            originalLine: segments[0]?.originalText || 'Sample line',
            enhancedLine: 'Enhanced version with better chemistry',
            character: segments[0]?.speaker || 'Character',
            improvementType: 'chemistry',
            explanation: 'Added romantic subtext and physical awareness'
          }
        ],
        analysis: {
          chemistryLevel: 'high',
          authenticityScore: 8.5,
          voiceConsistency: 'Strong character voice with romantic enhancement'
        },
        suggestions: {
          subtextOpportunities: ['Add meaningful glances between characters', 'Include internal reaction to partner\'s words'],
          chemistryBuilders: ['Use character names more intimately', 'Add physical awareness cues'],
          emotionalDepth: ['Show vulnerability through hesitation', 'Include emotional stakes in conversation']
        },
        metadata: {
          heatLevel: request.heatLevel,
          generatedAt: new Date(),
          model: 'demo'
        }
      };
      
      setEnhancement(demoEnhancement);
      setActiveTab('result');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveEnhancement = () => {
    if (enhancement) {
      onDialogueSaved?.(enhancement);
    }
  };

  const getChemistryLevelColor = (level: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-yellow-600', 
      high: 'text-romance-burgundy-600',
      electric: 'text-passion-600'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800">
            Dialogue Coach AI
          </h2>
          <p className="text-muted-foreground mt-1">
            Enhance romantic dialogue with AI-powered chemistry building
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="romance-badge">
            <RomanceIcon name="heart-eyes" className="mr-1" />
            Dialogue Specialist
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Input Dialogue</TabsTrigger>
          <TabsTrigger value="setup">Context & Goals</TabsTrigger>
          <TabsTrigger value="result" disabled={!enhancement}>Enhanced Result</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          {/* Dialogue Input */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Original Dialogue</CardTitle>
              <CardDescription>
                Paste your dialogue that needs romantic enhancement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dialogue-input">Dialogue Text</Label>
                <Textarea
                  id="dialogue-input"
                  value={request.originalDialogue}
                  onChange={(e) => setRequest({ ...request, originalDialogue: e.target.value })}
                  className="romance-input min-h-[200px] font-mono"
                  rows={10}
                  placeholder={`Enter your dialogue here. Use formats like:

Character1: "Hello there."
Character2: "Hi! Nice to meet you."

or

"I can't believe you're here," Sarah whispered.
"I promised I'd come back," he replied softly.`}
                />
              </div>

              <div className="bg-romance-blush-50 p-4 rounded-lg border border-romance-blush-200">
                <h4 className="font-medium text-romance-burgundy-800 mb-2">
                  Dialogue Formatting Tips
                </h4>
                <ul className="text-sm text-romance-burgundy-700 space-y-1">
                  <li>• Use "Character: dialogue" format for clear speaker identification</li>
                  <li>• Include dialogue tags: "Hello," she whispered.</li>
                  <li>• Separate different speakers with line breaks</li>
                  <li>• Include internal thoughts in brackets [thinking...]</li>
                </ul>
              </div>
            </CardContent>
          </RomanceCard>

          {/* Character Selection */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Characters in Dialogue</CardTitle>
              <CardDescription>
                Select characters participating in this conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableCharacters.length === 0 ? (
                <div className="text-center py-8">
                  <RomanceIcon name="person" size="xl" className="mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No characters available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add characters to your project first
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableCharacters.map(character => {
                      const isSelected = request.characters.find(c => c.name === character.name);
                      
                      return (
                        <div
                          key={character.id}
                          className={cn(
                            'p-3 border rounded-lg cursor-pointer transition-all',
                            isSelected
                              ? 'border-romance-burgundy-400 bg-romance-blush-50'
                              : 'border-romance-burgundy-200 hover:border-romance-burgundy-300'
                          )}
                          onClick={() => 
                            isSelected 
                              ? handleCharacterRemove(character.name)
                              : handleCharacterAdd(character)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-romance-burgundy-800">
                                {character.name}
                              </div>
                              {character.romanticArchetype && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {character.romanticArchetype}
                                </Badge>
                              )}
                            </div>
                            <div className={cn(
                              'w-4 h-4 rounded-full border-2 transition-colors',
                              isSelected 
                                ? 'bg-romance-burgundy-600 border-romance-burgundy-600'
                                : 'border-gray-300'
                            )}>
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {request.characters.length > 0 && (
                    <div className="mt-4 p-3 bg-romance-champagne-50 rounded-lg border border-romance-champagne-200">
                      <h4 className="font-medium text-romance-burgundy-800 mb-2">
                        Selected Characters ({request.characters.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {request.characters.map(character => (
                          <Badge
                            key={character.name}
                            variant="outline"
                            className="bg-white"
                          >
                            {character.name}
                            <button
                              onClick={() => handleCharacterRemove(character.name)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </RomanceCard>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          {/* Relationship Context */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Relationship Context</CardTitle>
              <CardDescription>
                Define the romantic context for dialogue enhancement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Relationship Status</Label>
                <Select 
                  value={request.relationshipStatus} 
                  onValueChange={(value) => setRequest({ ...request, relationshipStatus: value })}
                >
                  <SelectTrigger className="romance-input">
                    <SelectValue placeholder="Select relationship status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tension Goal</Label>
                <Select 
                  value={request.tensionGoal} 
                  onValueChange={(value) => setRequest({ ...request, tensionGoal: value })}
                >
                  <SelectTrigger className="romance-input">
                    <SelectValue placeholder="What should this dialogue achieve?" />
                  </SelectTrigger>
                  <SelectContent>
                    {TENSION_GOALS.map(goal => (
                      <SelectItem key={goal} value={goal}>
                        {goal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Heat Level</Label>
                  <Select 
                    value={request.heatLevel} 
                    onValueChange={(value: HeatLevel) => setRequest({ ...request, heatLevel: value })}
                  >
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
                <div className="flex items-end">
                  <HeatLevelBadge level={request.heatLevel} />
                </div>
              </div>

              <div>
                <Label htmlFor="context">Scene Context</Label>
                <Textarea
                  id="context"
                  value={request.context}
                  onChange={(e) => setRequest({ ...request, context: e.target.value })}
                  className="romance-input"
                  rows={3}
                  placeholder="Describe the scene setting, emotional state, and circumstances..."
                />
              </div>

              <div>
                <Label htmlFor="specific-needs">Specific Enhancement Needs (Optional)</Label>
                <Textarea
                  id="specific-needs"
                  value={request.specificNeeds || ''}
                  onChange={(e) => setRequest({ ...request, specificNeeds: e.target.value })}
                  className="romance-input"
                  rows={2}
                  placeholder="Any specific improvements you want? (e.g., 'add more flirtation', 'increase vulnerability', 'build to kiss scene')"
                />
              </div>
            </CardContent>
          </RomanceCard>

          {/* Enhancement Button */}
          <div className="flex justify-center">
            <RomanceButton
              variant="primary"
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !request.originalDialogue.trim() || request.characters.length === 0}
              className="px-8"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Enhancing Dialogue...
                </>
              ) : (
                <>
                  <RomanceIcon name="heart-eyes" className="mr-2" />
                  Enhance Romantic Chemistry
                </>
              )}
            </RomanceButton>
          </div>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          {enhancement && (
            <>
              {/* Analysis Results */}
              <RomanceCard>
                <CardHeader>
                  <CardTitle>Dialogue Analysis</CardTitle>
                  <CardDescription>
                    AI assessment of your enhanced dialogue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className={cn('text-2xl font-bold', getChemistryLevelColor(enhancement.analysis.chemistryLevel))}>
                        {enhancement.analysis.chemistryLevel.charAt(0).toUpperCase() + enhancement.analysis.chemistryLevel.slice(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Chemistry Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-romance-burgundy-600">
                        {enhancement.analysis.authenticityScore}/10
                      </div>
                      <div className="text-sm text-muted-foreground">Authenticity Score</div>
                    </div>
                    <div className="text-center">
                      <HeatLevelBadge level={enhancement.metadata.heatLevel} />
                      <div className="text-sm text-muted-foreground mt-1">Content Level</div>
                    </div>
                  </div>

                  <div className="bg-romance-blush-50 p-4 rounded-lg border border-romance-blush-200">
                    <h4 className="font-medium text-romance-burgundy-800 mb-2">
                      Voice Consistency Assessment
                    </h4>
                    <p className="text-sm text-romance-burgundy-700">
                      {enhancement.analysis.voiceConsistency}
                    </p>
                  </div>
                </CardContent>
              </RomanceCard>

              {/* Enhanced Dialogue */}
              <RomanceCard>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Enhanced Dialogue</CardTitle>
                      <CardDescription>
                        Your dialogue with improved romantic chemistry
                      </CardDescription>
                    </div>
                    <RomanceButton
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEnhancement}
                    >
                      <RomanceIcon name="save" className="mr-1" />
                      Save Enhancement
                    </RomanceButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="ai-romance-response">
                      <div className="whitespace-pre-wrap font-serif text-romance-burgundy-900 leading-relaxed">
                        {enhancement.enhancedDialogue}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </RomanceCard>

              {/* Specific Improvements */}
              {enhancement.improvements.length > 0 && (
                <RomanceCard>
                  <CardHeader>
                    <CardTitle>Line-by-Line Improvements</CardTitle>
                    <CardDescription>
                      Specific enhancements made to your dialogue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {enhancement.improvements.map((improvement, index) => {
                        const config = IMPROVEMENT_TYPE_CONFIG[improvement.improvementType];
                        
                        return (
                          <div key={index} className="border border-romance-burgundy-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span>{config.icon}</span>
                              <Badge variant="outline" className={config.color}>
                                {config.label}
                              </Badge>
                              <span className="font-medium text-romance-burgundy-800">
                                {improvement.character}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">Original</Label>
                                <div className="bg-gray-50 p-2 rounded text-sm">
                                  "{improvement.originalLine}"
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Enhanced</Label>
                                <div className="bg-romance-blush-50 p-2 rounded text-sm">
                                  "{improvement.enhancedLine}"
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {improvement.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </RomanceCard>
              )}

              {/* Suggestions */}
              <RomanceCard>
                <CardHeader>
                  <CardTitle>Enhancement Suggestions</CardTitle>
                  <CardDescription>
                    Additional ways to improve romantic dialogue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-romance-burgundy-800 mb-2 flex items-center">
                        <RomanceIcon name="butterfly" className="mr-1" />
                        Subtext Opportunities
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {enhancement.suggestions.subtextOpportunities.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-romance-burgundy-800 mb-2 flex items-center">
                        <RomanceIcon name="sparks" className="mr-1" />
                        Chemistry Builders
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {enhancement.suggestions.chemistryBuilders.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-romance-burgundy-800 mb-2 flex items-center">
                        <RomanceIcon name="heart" className="mr-1" />
                        Emotional Depth
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {enhancement.suggestions.emotionalDepth.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </RomanceCard>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}