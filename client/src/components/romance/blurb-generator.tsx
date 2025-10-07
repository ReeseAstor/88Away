import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Copy, RefreshCw, Target, TrendingUp, Heart, Zap, BookOpen, Users, Star } from 'lucide-react';

interface BlurbTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
  category: 'contemporary' | 'historical' | 'paranormal' | 'fantasy' | 'suspense' | 'erotic';
}

interface BlurbAnalysis {
  hookStrength: number;
  emotionalImpact: number;
  marketAppeal: number;
  readabilityScore: number;
  wordCount: number;
  suggestions: string[];
}

interface BlurbGeneratorProps {
  bookTitle?: string;
  heroName?: string;
  heroineName?: string;
  tropes?: string[];
  heatLevel?: number;
  subgenre?: string;
  onBlurbGenerated?: (blurb: string) => void;
}

const blurbTemplates: BlurbTemplate[] = [
  {
    id: 'enemies-to-lovers',
    name: 'Enemies to Lovers',
    description: 'Perfect for antagonistic relationships that turn romantic',
    structure: ['Conflict setup', 'Character introduction', 'Stakes/tension', 'Hint at attraction', 'Call to action'],
    category: 'contemporary'
  },
  {
    id: 'second-chance',
    name: 'Second Chance Romance',
    description: 'For rekindled love stories and past relationships',
    structure: ['Past connection', 'Current situation', 'What went wrong', 'New circumstances', 'Hope for future'],
    category: 'contemporary'
  },
  {
    id: 'alpha-billionaire',
    name: 'Alpha Billionaire',
    description: 'Commanding hero with wealth and power',
    structure: ['Hero power/status', 'Meeting circumstances', 'Attraction/tension', 'Complications', 'Stakes'],
    category: 'contemporary'
  },
  {
    id: 'small-town',
    name: 'Small Town Romance',
    description: 'Community-centered love stories',
    structure: ['Setting introduction', 'Character arrival/return', 'Community dynamics', 'Romance development', 'Happy ending hint'],
    category: 'contemporary'
  },
  {
    id: 'regency-lords',
    name: 'Regency Lords & Ladies',
    description: 'Historical nobility romance',
    structure: ['Social setting', 'Character status', 'Scandal/conflict', 'Attraction despite odds', 'Society stakes'],
    category: 'historical'
  },
  {
    id: 'vampire-fated',
    name: 'Vampire Fated Mates',
    description: 'Supernatural destined love',
    structure: ['Supernatural world', 'Fated connection', 'Danger/conflict', 'Powers/abilities', 'Eternal love stakes'],
    category: 'paranormal'
  }
];

const marketingHooks = [
  'What happens when...',
  'She never expected...',
  'He thought he had everything until...',
  'One night changes everything...',
  'Some rules are meant to be broken...',
  'Love wasn\'t part of the plan...',
  'The last person she should want...',
  'Everything she believed was a lie...',
  'He\'s her biggest mistake... and her only salvation.',
  'Sometimes the enemy becomes the lover.'
];

export const BlurbGenerator: React.FC<BlurbGeneratorProps> = ({
  bookTitle = '',
  heroName = '',
  heroineName = '',
  tropes = [],
  heatLevel = 3,
  subgenre = 'contemporary',
  onBlurbGenerated
}) => {
  const [activeTab, setActiveTab] = useState('generator');
  const [selectedTemplate, setSelectedTemplate] = useState<BlurbTemplate | null>(null);
  const [customInputs, setCustomInputs] = useState({
    title: bookTitle,
    hero: heroName,
    heroine: heroineName,
    setting: '',
    conflict: '',
    stakes: '',
    hook: ''
  });
  const [generatedBlurb, setGeneratedBlurb] = useState('');
  const [blurbVariations, setBlurbVariations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blurbAnalysis, setBlurbAnalysis] = useState<BlurbAnalysis | null>(null);
  const [targetLength, setTargetLength] = useState([150]);
  const [marketFocus, setMarketFocus] = useState<'amazon' | 'goodreads' | 'social' | 'universal'>('amazon');

  useEffect(() => {
    if (subgenre) {
      const template = blurbTemplates.find(t => t.category === subgenre);
      if (template) setSelectedTemplate(template);
    }
  }, [subgenre]);

  const generateBlurb = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const blurbContent = generateBlurbContent();
      setGeneratedBlurb(blurbContent);
      
      // Generate variations
      const variations = await generateVariations(blurbContent);
      setBlurbVariations(variations);
      
      // Analyze blurb
      const analysis = analyzeBlurb(blurbContent);
      setBlurbAnalysis(analysis);
      
      onBlurbGenerated?.(blurbContent);
    } catch (error) {
      console.error('Blurb generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBlurbContent = () => {
    const { title, hero, heroine, setting, conflict, stakes, hook } = customInputs;
    
    // Template-based generation logic
    let blurb = '';
    
    if (hook) {
      blurb += `${hook}\n\n`;
    }
    
    // Character introduction
    if (heroine && hero) {
      blurb += `When ${heroine} meets ${hero}, `;
    }
    
    // Setting and situation
    if (setting) {
      blurb += `in ${setting}, `;
    }
    
    // Conflict
    if (conflict) {
      blurb += `${conflict}. `;
    }
    
    // Stakes
    if (stakes) {
      blurb += `With ${stakes} on the line, `;
    }
    
    // Romance tension
    blurb += `sparks fly and hearts collide. `;
    
    // Call to action based on template
    switch (selectedTemplate?.id) {
      case 'enemies-to-lovers':
        blurb += `Can love bloom between sworn enemies? Or will their past destroy any chance of a future together?`;
        break;
      case 'second-chance':
        blurb += `Can they overcome their past mistakes and find their way back to each other? Or are some hearts too broken to mend?`;
        break;
      case 'alpha-billionaire':
        blurb += `Will she surrender to his commanding presence? Or will she be the one woman who can tame his heart?`;
        break;
      default:
        blurb += `Will love conquer all? Or will fate keep them apart?`;
    }
    
    return blurb.trim();
  };

  const generateVariations = async (baseBlurb: string): Promise<string[]> => {
    // Simulate generating variations with different tones
    return [
      baseBlurb.replace(/\?/g, '...'),
      baseBlurb.replace(/sparks fly/g, 'passion ignites'),
      baseBlurb + '\n\nA steamy romance that will leave you breathless.'
    ];
  };

  const analyzeBlurb = (blurb: string): BlurbAnalysis => {
    const wordCount = blurb.split(/\s+/).length;
    const sentences = blurb.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    
    return {
      hookStrength: Math.round(Math.random() * 40 + 60), // 60-100
      emotionalImpact: Math.round(Math.random() * 30 + 70), // 70-100
      marketAppeal: Math.round(Math.random() * 25 + 75), // 75-100
      readabilityScore: Math.min(100, Math.round(100 - (avgWordsPerSentence - 15) * 2)),
      wordCount,
      suggestions: [
        wordCount < 100 ? 'Consider adding more detail to reach optimal length' : '',
        wordCount > 200 ? 'Consider shortening for better readability' : '',
        !blurb.includes('?') ? 'Add a compelling question to create intrigue' : '',
        'Include more sensory details to enhance emotional connection'
      ].filter(Boolean)
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add toast notification here
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-romance-success';
    if (score >= 60) return 'text-romance-warning';
    return 'text-romance-danger';
  };

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <Sparkles className="h-5 w-5 text-romance-accent" />
            Romance Blurb Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generator">Generator</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="variations">Variations</TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-romance-text">Book Details</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="title">Book Title</Label>
                      <Input
                        id="title"
                        value={customInputs.title}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter your book title"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="hero">Hero Name</Label>
                        <Input
                          id="hero"
                          value={customInputs.hero}
                          onChange={(e) => setCustomInputs(prev => ({ ...prev, hero: e.target.value }))}
                          placeholder="Hero's name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="heroine">Heroine Name</Label>
                        <Input
                          id="heroine"
                          value={customInputs.heroine}
                          onChange={(e) => setCustomInputs(prev => ({ ...prev, heroine: e.target.value }))}
                          placeholder="Heroine's name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="setting">Setting</Label>
                      <Input
                        id="setting"
                        value={customInputs.setting}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, setting: e.target.value }))}
                        placeholder="Where does your story take place?"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="conflict">Main Conflict</Label>
                      <Textarea
                        id="conflict"
                        value={customInputs.conflict}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, conflict: e.target.value }))}
                        placeholder="What's keeping them apart?"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stakes">Stakes</Label>
                      <Input
                        id="stakes"
                        value={customInputs.stakes}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, stakes: e.target.value }))}
                        placeholder="What do they have to lose?"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-romance-text">Blurb Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Template</Label>
                      <Select value={selectedTemplate?.id || ''} onValueChange={(value) => {
                        const template = blurbTemplates.find(t => t.id === value);
                        setSelectedTemplate(template || null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a blurb template" />
                        </SelectTrigger>
                        <SelectContent>
                          {blurbTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTemplate && (
                        <p className="text-sm text-romance-muted mt-1">{selectedTemplate.description}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Target Length: {targetLength[0]} words</Label>
                      <Slider
                        value={targetLength}
                        onValueChange={setTargetLength}
                        max={300}
                        min={50}
                        step={25}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Market Focus</Label>
                      <Select value={marketFocus} onValueChange={(value: any) => setMarketFocus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amazon">Amazon KDP</SelectItem>
                          <SelectItem value="goodreads">Goodreads</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                          <SelectItem value="universal">Universal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Hook Starter</Label>
                      <Select value={customInputs.hook} onValueChange={(value) => setCustomInputs(prev => ({ ...prev, hook: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a hook" />
                        </SelectTrigger>
                        <SelectContent>
                          {marketingHooks.map((hook, index) => (
                            <SelectItem key={index} value={hook}>
                              {hook}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {tropes.length > 0 && (
                      <div>
                        <Label>Active Tropes</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tropes.map((trope, index) => (
                            <Badge key={index} variant="secondary" className="bg-romance-secondary/20">
                              {trope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={generateBlurb}
                  disabled={!selectedTemplate || isGenerating}
                  className="bg-romance-primary hover:bg-romance-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Blurb
                    </>
                  )}
                </Button>
              </div>
              
              {generatedBlurb && (
                <Card className="border-romance-accent/30">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg">Generated Blurb</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedBlurb)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-romance-background/50 p-4 rounded-lg">
                      <p className="text-romance-text whitespace-pre-line">{generatedBlurb}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blurbTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-romance-primary ring-2 ring-romance-primary/20'
                        : 'border-gray-200 hover:border-romance-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-romance-muted">{template.description}</p>
                      <Badge variant="outline" className="w-fit">
                        {template.category}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Structure:</Label>
                        <ul className="text-sm space-y-1">
                          {template.structure.map((step, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-romance-primary/10 text-romance-primary rounded-full flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              {blurbAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Hook Strength</span>
                          <span className={`font-semibold ${getScoreColor(blurbAnalysis.hookStrength)}`}>
                            {blurbAnalysis.hookStrength}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Emotional Impact</span>
                          <span className={`font-semibold ${getScoreColor(blurbAnalysis.emotionalImpact)}`}>
                            {blurbAnalysis.emotionalImpact}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Market Appeal</span>
                          <span className={`font-semibold ${getScoreColor(blurbAnalysis.marketAppeal)}`}>
                            {blurbAnalysis.marketAppeal}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Readability</span>
                          <span className={`font-semibold ${getScoreColor(blurbAnalysis.readabilityScore)}`}>
                            {blurbAnalysis.readabilityScore}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Word Count</span>
                          <span className="font-semibold">{blurbAnalysis.wordCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Improvement Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {blurbAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-romance-accent mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-romance-muted">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Generate a blurb to see detailed analysis</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="variations" className="space-y-4">
              {blurbVariations.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-romance-text">Blurb Variations</h3>
                  {blurbVariations.map((variation, index) => (
                    <Card key={index} className="border-romance-accent/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Variation {index + 1}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(variation)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-romance-background/50 p-4 rounded-lg">
                          <p className="text-romance-text whitespace-pre-line">{variation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-romance-muted">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Generate a blurb to see variations</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};