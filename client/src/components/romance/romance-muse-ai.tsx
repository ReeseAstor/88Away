import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RomanceCard, RomanceButton, RomanceIcon, HeatLevelBadge, type HeatLevel } from './index';
import { cn } from '@/lib/utils';

interface Character {
  id: string;
  name: string;
  status: 'present' | 'mentioned' | 'absent';
  romanticArchetype?: string;
  personality?: string;
}

interface RomanceMuseRequest {
  projectTitle: string;
  sceneIntent: string;
  setting: string;
  characters: Character[];
  romanticTension: {
    level: 'low' | 'medium' | 'high' | 'intense';
    type: 'emotional' | 'sexual' | 'romantic' | 'situational';
    focus: string;
  };
  heatLevel: HeatLevel;
  relationshipDynamics?: string;
  lastSceneSummary?: string;
  targetLength: 'short' | 'medium' | 'long';
  specificRequests?: string;
}

interface GeneratedScene {
  id: string;
  content: string;
  metadata: {
    wordCount: number;
    heatLevel: HeatLevel;
    tensionLevel: string;
    generatedAt: Date;
    model: string;
  };
  feedback?: {
    rating: number;
    comments: string;
  };
}

interface RomanceMuseAIProps {
  projectId: string;
  onSceneGenerated?: (scene: GeneratedScene) => void;
  onSceneSaved?: (scene: GeneratedScene) => void;
  availableCharacters?: Character[];
  projectContext?: any;
  romanceContext?: any;
}

const TENSION_TYPES = {
  emotional: { label: 'Emotional', icon: '💭', description: 'Feelings, vulnerability, emotional stakes' },
  romantic: { label: 'Romantic', icon: '💕', description: 'Romantic attraction, chemistry, connection' },
  sexual: { label: 'Sexual', icon: '🔥', description: 'Physical attraction, desire, sensuality' },
  situational: { label: 'Situational', icon: '⚡', description: 'External circumstances, obstacles, drama' }
};

const ROMANTIC_ARCHETYPES = [
  'Alpha Hero', 'Beta Hero', 'Cinnamon Roll', 'Bad Boy', 'Good Guy',
  'Strong Heroine', 'Innocent Heroine', 'Feisty Heroine', 'Damaged Hero',
  'Rake', 'Virgin', 'Experienced', 'Single Parent', 'Protector'
];

const SCENE_TEMPLATES = {
  meet_cute: {
    name: 'Meet Cute',
    description: 'First meeting between romantic interests',
    prompts: ['Accidental encounter', 'Mistaken identity', 'Rescue scenario', 'Workplace meeting']
  },
  first_kiss: {
    name: 'First Kiss',
    description: 'The pivotal first romantic moment',
    prompts: ['Tender first kiss', 'Passionate moment', 'Interrupted kiss', 'Unexpected kiss']
  },
  conflict: {
    name: 'Romantic Conflict',
    description: 'Tension and obstacles between lovers',
    prompts: ['Misunderstanding', 'External pressure', 'Past secrets revealed', 'Jealousy moment']
  },
  intimate: {
    name: 'Intimate Scene',
    description: 'Close emotional or physical moment',
    prompts: ['Emotional vulnerability', 'Physical intimacy', 'Quiet conversation', 'Shared experience']
  },
  reunion: {
    name: 'Reunion',
    description: 'Characters coming back together',
    prompts: ['After separation', 'Making up', 'Grand gesture', 'Realization scene']
  }
};

export function RomanceMuseAI({
  projectId,
  onSceneGenerated,
  onSceneSaved,
  availableCharacters = [],
  projectContext,
  romanceContext
}: RomanceMuseAIProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScene, setGeneratedScene] = useState<GeneratedScene | null>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [request, setRequest] = useState<RomanceMuseRequest>({
    projectTitle: projectContext?.title || 'Untitled Romance',
    sceneIntent: '',
    setting: '',
    characters: [],
    romanticTension: {
      level: 'medium',
      type: 'romantic',
      focus: ''
    },
    heatLevel: 'warm',
    targetLength: 'medium',
    specificRequests: ''
  });

  const handleCharacterToggle = (character: Character) => {
    const exists = request.characters.find(c => c.id === character.id);
    if (exists) {
      setRequest({
        ...request,
        characters: request.characters.filter(c => c.id !== character.id)
      });
    } else {
      setRequest({
        ...request,
        characters: [...request.characters, { ...character, status: 'present' }]
      });
    }
  };

  const handleCharacterStatusChange = (characterId: string, status: Character['status']) => {
    setRequest({
      ...request,
      characters: request.characters.map(c =>
        c.id === characterId ? { ...c, status } : c
      )
    });
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = SCENE_TEMPLATES[templateKey as keyof typeof SCENE_TEMPLATES];
    setSelectedTemplate(templateKey);
    setRequest({
      ...request,
      sceneIntent: template.name,
    });
  };

  const handleGenerate = async () => {
    if (!request.sceneIntent.trim() || request.characters.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      // This would call the AI service
      const response = await fetch(`/api/ai/romance/scene-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          request,
          projectContext,
          romanceContext
        }),
      });

      const result = await response.json();
      
      const scene: GeneratedScene = {
        id: `scene_${Date.now()}`,
        content: result.content || 'Scene generation failed. Please try again.',
        metadata: {
          wordCount: result.content?.split(' ').length || 0,
          heatLevel: request.heatLevel,
          tensionLevel: request.romanticTension.level,
          generatedAt: new Date(),
          model: result.metadata?.model || 'unknown'
        }
      };

      setGeneratedScene(scene);
      onSceneGenerated?.(scene);
      setActiveTab('result');
    } catch (error) {
      console.error('Scene generation failed:', error);
      // Create a fallback scene for demo purposes
      const fallbackScene: GeneratedScene = {
        id: `scene_${Date.now()}`,
        content: `[Generated ${request.heatLevel} romance scene would appear here]

This is a placeholder for the AI-generated romantic scene based on your specifications:

- Intent: ${request.sceneIntent}
- Setting: ${request.setting}
- Characters: ${request.characters.map(c => c.name).join(', ')}
- Tension Type: ${request.romanticTension.type}
- Heat Level: ${request.heatLevel}

The actual implementation would connect to the romance AI service to generate authentic, emotionally engaging romantic content.`,
        metadata: {
          wordCount: 85,
          heatLevel: request.heatLevel,
          tensionLevel: request.romanticTension.level,
          generatedAt: new Date(),
          model: 'demo'
        }
      };
      setGeneratedScene(fallbackScene);
      setActiveTab('result');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveScene = () => {
    if (generatedScene) {
      onSceneSaved?.(generatedScene);
    }
  };

  const handleFeedback = (rating: number, comments: string) => {
    if (generatedScene) {
      const updatedScene = {
        ...generatedScene,
        feedback: { rating, comments }
      };
      setGeneratedScene(updatedScene);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-romance-burgundy-800">
            Romance Muse AI
          </h2>
          <p className="text-muted-foreground mt-1">
            Generate authentic romantic scenes with AI assistance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="romance-badge">
            <RomanceIcon name="heart" className="mr-1" />
            Romance Specialized
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Scene Setup</TabsTrigger>
          <TabsTrigger value="characters">Characters & Tension</TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedScene}>Generated Scene</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {/* Scene Templates */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Scene Templates</CardTitle>
              <CardDescription>
                Choose a common romance scene type or create your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(SCENE_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(key)}
                    className={cn(
                      'p-3 text-left border rounded-lg transition-all',
                      selectedTemplate === key
                        ? 'border-romance-burgundy-400 bg-romance-blush-50'
                        : 'border-romance-burgundy-200 hover:border-romance-burgundy-300'
                    )}
                  >
                    <div className="font-medium text-romance-burgundy-800 mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </RomanceCard>

          {/* Basic Scene Setup */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Scene Details</CardTitle>
              <CardDescription>
                Define the core elements of your romantic scene
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scene-intent">Scene Intent</Label>
                <Input
                  id="scene-intent"
                  value={request.sceneIntent}
                  onChange={(e) => setRequest({ ...request, sceneIntent: e.target.value })}
                  className="romance-input"
                  placeholder="What should happen in this scene?"
                />
              </div>

              <div>
                <Label htmlFor="setting">Setting</Label>
                <Input
                  id="setting"
                  value={request.setting}
                  onChange={(e) => setRequest({ ...request, setting: e.target.value })}
                  className="romance-input"
                  placeholder="Where does this scene take place?"
                />
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

                <div>
                  <Label>Scene Length</Label>
                  <Select 
                    value={request.targetLength} 
                    onValueChange={(value: 'short' | 'medium' | 'long') => setRequest({ ...request, targetLength: value })}
                  >
                    <SelectTrigger className="romance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (200-400 words)</SelectItem>
                      <SelectItem value="medium">Medium (400-800 words)</SelectItem>
                      <SelectItem value="long">Long (800-1200 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="last-scene">Previous Scene Summary (Optional)</Label>
                <Textarea
                  id="last-scene"
                  value={request.lastSceneSummary || ''}
                  onChange={(e) => setRequest({ ...request, lastSceneSummary: e.target.value })}
                  className="romance-input"
                  rows={2}
                  placeholder="Briefly describe what happened in the previous scene..."
                />
              </div>
            </CardContent>
          </RomanceCard>
        </TabsContent>

        <TabsContent value="characters" className="space-y-6">
          {/* Character Selection */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Characters in Scene</CardTitle>
              <CardDescription>
                Select which characters appear in this romantic scene
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
                <div className="space-y-3">
                  {availableCharacters.map(character => {
                    const selected = request.characters.find(c => c.id === character.id);
                    
                    return (
                      <div
                        key={character.id}
                        className={cn(
                          'p-3 border rounded-lg transition-all cursor-pointer',
                          selected
                            ? 'border-romance-burgundy-400 bg-romance-blush-50'
                            : 'border-romance-burgundy-200 hover:border-romance-burgundy-300'
                        )}
                        onClick={() => handleCharacterToggle(character)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-romance-burgundy-800">
                              {character.name}
                            </div>
                            {character.romanticArchetype && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {character.romanticArchetype}
                              </Badge>
                            )}
                          </div>
                          
                          {selected && (
                            <Select
                              value={selected.status}
                              onValueChange={(value: Character['status']) => 
                                handleCharacterStatusChange(character.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="mentioned">Mentioned</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </RomanceCard>

          {/* Romantic Tension Settings */}
          <RomanceCard>
            <CardHeader>
              <CardTitle>Romantic Tension</CardTitle>
              <CardDescription>
                Configure the emotional and romantic dynamics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tension Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {Object.entries(TENSION_TYPES).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setRequest({
                        ...request,
                        romanticTension: { ...request.romanticTension, type: key as any }
                      })}
                      className={cn(
                        'p-3 text-left border rounded-lg transition-all',
                        request.romanticTension.type === key
                          ? 'border-romance-burgundy-400 bg-romance-blush-50'
                          : 'border-romance-burgundy-200 hover:border-romance-burgundy-300'
                      )}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span>{config.icon}</span>
                        <span className="font-medium text-romance-burgundy-800">
                          {config.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {config.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tension Level: {request.romanticTension.level}</Label>
                <Slider
                  value={[{ low: 1, medium: 2, high: 3, intense: 4 }[request.romanticTension.level]]}
                  onValueChange={(value) => {
                    const levels = ['low', 'medium', 'high', 'intense'];
                    setRequest({
                      ...request,
                      romanticTension: {
                        ...request.romanticTension,
                        level: levels[value[0] - 1] as any
                      }
                    });
                  }}
                  max={4}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Intense</span>
                </div>
              </div>

              <div>
                <Label htmlFor="tension-focus">Tension Focus</Label>
                <Input
                  id="tension-focus"
                  value={request.romanticTension.focus}
                  onChange={(e) => setRequest({
                    ...request,
                    romanticTension: { ...request.romanticTension, focus: e.target.value }
                  })}
                  className="romance-input"
                  placeholder="What should the tension focus on?"
                />
              </div>

              <div>
                <Label htmlFor="dynamics">Relationship Dynamics (Optional)</Label>
                <Textarea
                  id="dynamics"
                  value={request.relationshipDynamics || ''}
                  onChange={(e) => setRequest({ ...request, relationshipDynamics: e.target.value })}
                  className="romance-input"
                  rows={2}
                  placeholder="Describe the current relationship dynamic..."
                />
              </div>

              <div>
                <Label htmlFor="specific-requests">Specific Requests (Optional)</Label>
                <Textarea
                  id="specific-requests"
                  value={request.specificRequests || ''}
                  onChange={(e) => setRequest({ ...request, specificRequests: e.target.value })}
                  className="romance-input"
                  rows={2}
                  placeholder="Any specific elements you want included?"
                />
              </div>
            </CardContent>
          </RomanceCard>

          {/* Generate Button */}
          <div className="flex justify-center">
            <RomanceButton
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || !request.sceneIntent.trim() || request.characters.length === 0}
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating Romance...
                </>
              ) : (
                <>
                  <RomanceIcon name="sparks" className="mr-2" />
                  Generate Romantic Scene
                </>
              )}
            </RomanceButton>
          </div>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          {generatedScene && (
            <>
              {/* Scene Metadata */}
              <RomanceCard>
                <CardHeader>
                  <CardTitle>Generated Scene</CardTitle>
                  <CardDescription>
                    Your AI-generated romantic scene is ready
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <HeatLevelBadge level={generatedScene.metadata.heatLevel} />
                      <Badge variant="outline">
                        {generatedScene.metadata.wordCount} words
                      </Badge>
                      <Badge variant="outline">
                        {generatedScene.metadata.tensionLevel} tension
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RomanceButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab('setup')}
                      >
                        <RomanceIcon name="edit-pencil" className="mr-1" />
                        Revise
                      </RomanceButton>
                      <RomanceButton
                        variant="primary"
                        size="sm"
                        onClick={handleSaveScene}
                      >
                        <RomanceIcon name="save" className="mr-1" />
                        Save Scene
                      </RomanceButton>
                    </div>
                  </div>

                  {/* Generated Content */}
                  <div className="prose max-w-none">
                    <div className="bg-gradient-to-r from-tender-50 to-romance-blush-50 border-l-4 border-romance-burgundy-400 p-6 rounded-r-lg">
                      <div className="whitespace-pre-wrap font-serif text-romance-burgundy-900 leading-relaxed">
                        {generatedScene.content}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Section */}
                  <div className="mt-6 pt-6 border-t border-romance-burgundy-200">
                    <h4 className="font-medium text-romance-burgundy-800 mb-3">
                      Rate this scene
                    </h4>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleFeedback(rating, '')}
                          className={cn(
                            'w-8 h-8 rounded-full transition-colors',
                            generatedScene.feedback?.rating && rating <= generatedScene.feedback.rating
                              ? 'text-romance-burgundy-600'
                              : 'text-gray-300 hover:text-romance-burgundy-400'
                          )}
                        >
                          ⭐
                        </button>
                      ))}
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