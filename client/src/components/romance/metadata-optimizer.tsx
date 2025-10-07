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
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Search, Zap, BookOpen, Tag, BarChart3, Globe, Users, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  relevance: number;
  trend: 'up' | 'down' | 'stable';
  difficulty: number;
  avgPosition: number;
  cpc: number;
  romanceScore: number;
}

interface CategoryData {
  category: string;
  rank: number;
  competition: number;
  avgSales: number;
  trendingStatus: 'hot' | 'rising' | 'stable' | 'declining';
  subcategories: string[];
}

interface OptimizationSuggestion {
  type: 'keyword' | 'category' | 'title' | 'description';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface MetadataOptimizerProps {
  bookTitle?: string;
  currentKeywords?: string[];
  currentCategories?: string[];
  targetAudience?: string;
  subgenre?: string;
  heatLevel?: number;
  onOptimizationComplete?: (data: any) => void;
}

const romanceKeywords: KeywordData[] = [
  { keyword: 'enemies to lovers', searchVolume: 8900, competition: 'medium', relevance: 95, trend: 'up', difficulty: 6, avgPosition: 3.2, cpc: 0.45, romanceScore: 98 },
  { keyword: 'second chance romance', searchVolume: 7200, competition: 'medium', relevance: 92, trend: 'stable', difficulty: 5, avgPosition: 4.1, cpc: 0.38, romanceScore: 95 },
  { keyword: 'alpha male romance', searchVolume: 12500, competition: 'high', relevance: 88, trend: 'up', difficulty: 8, avgPosition: 2.8, cpc: 0.67, romanceScore: 92 },
  { keyword: 'small town romance', searchVolume: 6800, competition: 'low', relevance: 90, trend: 'stable', difficulty: 4, avgPosition: 5.2, cpc: 0.29, romanceScore: 89 },
  { keyword: 'billionaire romance', searchVolume: 15200, competition: 'high', relevance: 85, trend: 'down', difficulty: 9, avgPosition: 2.1, cpc: 0.89, romanceScore: 87 },
  { keyword: 'friends to lovers', searchVolume: 5400, competition: 'medium', relevance: 93, trend: 'up', difficulty: 5, avgPosition: 4.8, cpc: 0.35, romanceScore: 94 },
  { keyword: 'fake relationship', searchVolume: 4200, competition: 'low', relevance: 89, trend: 'up', difficulty: 3, avgPosition: 6.1, cpc: 0.22, romanceScore: 91 },
  { keyword: 'workplace romance', searchVolume: 3800, competition: 'medium', relevance: 86, trend: 'stable', difficulty: 6, avgPosition: 4.9, cpc: 0.41, romanceScore: 88 },
  { keyword: 'forbidden romance', searchVolume: 7600, competition: 'medium', relevance: 91, trend: 'up', difficulty: 7, avgPosition: 3.7, cpc: 0.52, romanceScore: 93 },
  { keyword: 'age gap romance', searchVolume: 9200, competition: 'high', relevance: 87, trend: 'up', difficulty: 8, avgPosition: 3.0, cpc: 0.71, romanceScore: 90 }
];

const romanceCategories: CategoryData[] = [
  { category: 'Contemporary Romance', rank: 1, competition: 85, avgSales: 1200, trendingStatus: 'stable', subcategories: ['Workplace', 'Sports', 'Military'] },
  { category: 'Romantic Suspense', rank: 2, competition: 72, avgSales: 950, trendingStatus: 'rising', subcategories: ['Thriller', 'Mystery', 'Action'] },
  { category: 'Historical Romance', rank: 3, competition: 68, avgSales: 800, trendingStatus: 'stable', subcategories: ['Regency', 'Victorian', 'Medieval'] },
  { category: 'Paranormal Romance', rank: 4, competition: 79, avgSales: 750, trendingStatus: 'declining', subcategories: ['Vampire', 'Werewolf', 'Witch'] },
  { category: 'Erotic Romance', rank: 5, competition: 88, avgSales: 1100, trendingStatus: 'hot', subcategories: ['BDSM', 'Menage', 'Dark'] },
  { category: 'New Adult Romance', rank: 6, competition: 76, avgSales: 650, trendingStatus: 'rising', subcategories: ['College', 'Coming of Age', 'First Love'] }
];

export const MetadataOptimizer: React.FC<MetadataOptimizerProps> = ({
  bookTitle = '',
  currentKeywords = [],
  currentCategories = [],
  targetAudience = '',
  subgenre = 'contemporary',
  heatLevel = 3,
  onOptimizationComplete
}) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(currentKeywords);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategories);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [competitionLevel, setCompetitionLevel] = useState([1, 10]);
  const [minSearchVolume, setMinSearchVolume] = useState([1000]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationScore, setOptimizationScore] = useState(0);

  useEffect(() => {
    generateOptimizationSuggestions();
    calculateOptimizationScore();
  }, [selectedKeywords, selectedCategories, bookTitle]);

  const generateOptimizationSuggestions = () => {
    const suggestions: OptimizationSuggestion[] = [];

    // Keyword suggestions
    if (selectedKeywords.length < 5) {
      suggestions.push({
        type: 'keyword',
        priority: 'high',
        suggestion: 'Add more targeted romance keywords to improve discoverability',
        impact: 'Could increase visibility by 30-50%',
        difficulty: 'easy'
      });
    }

    // Category suggestions
    if (selectedCategories.length < 2) {
      suggestions.push({
        type: 'category',
        priority: 'high',
        suggestion: 'Select additional relevant categories to reach broader audience',
        impact: 'Potential 25% increase in organic reach',
        difficulty: 'easy'
      });
    }

    // Title optimization
    if (bookTitle && !selectedKeywords.some(k => bookTitle.toLowerCase().includes(k.toLowerCase()))) {
      suggestions.push({
        type: 'title',
        priority: 'medium',
        suggestion: 'Consider incorporating high-performing keywords into your title',
        impact: 'Could improve search ranking by 2-3 positions',
        difficulty: 'medium'
      });
    }

    setOptimizationSuggestions(suggestions);
  };

  const calculateOptimizationScore = () => {
    let score = 0;
    
    // Keyword score (40% weight)
    const keywordScore = Math.min(selectedKeywords.length / 7 * 40, 40);
    score += keywordScore;
    
    // Category score (30% weight)
    const categoryScore = Math.min(selectedCategories.length / 3 * 30, 30);
    score += categoryScore;
    
    // Title optimization (20% weight)
    const titleScore = bookTitle && selectedKeywords.some(k => bookTitle.toLowerCase().includes(k.toLowerCase())) ? 20 : 0;
    score += titleScore;
    
    // Competition balance (10% weight)
    const avgCompetition = selectedKeywords.reduce((sum, kw) => {
      const keyword = romanceKeywords.find(k => k.keyword === kw);
      return sum + (keyword ? keyword.difficulty : 5);
    }, 0) / Math.max(selectedKeywords.length, 1);
    const competitionScore = avgCompetition < 7 ? 10 : avgCompetition < 8 ? 5 : 0;
    score += competitionScore;
    
    setOptimizationScore(Math.round(score));
  };

  const filteredKeywords = romanceKeywords.filter(keyword => {
    const matchesFilter = keyword.keyword.toLowerCase().includes(keywordFilter.toLowerCase());
    const matchesVolume = keyword.searchVolume >= minSearchVolume[0];
    const matchesCompetition = keyword.difficulty >= competitionLevel[0] && keyword.difficulty <= competitionLevel[1];
    return matchesFilter && matchesVolume && matchesCompetition;
  });

  const handleKeywordToggle = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(prev => prev.filter(k => k !== keyword));
    } else if (selectedKeywords.length < 7) {
      setSelectedKeywords(prev => [...prev, keyword]);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories(prev => [...prev, category]);
    }
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Auto-select optimal keywords based on criteria
    const optimalKeywords = romanceKeywords
      .filter(k => k.romanceScore >= 90 && k.difficulty <= 7)
      .slice(0, 7)
      .map(k => k.keyword);
    
    setSelectedKeywords(optimalKeywords);
    
    // Auto-select optimal categories
    const optimalCategories = romanceCategories
      .filter(c => c.trendingStatus === 'hot' || c.trendingStatus === 'rising')
      .slice(0, 3)
      .map(c => c.category);
    
    setSelectedCategories(optimalCategories);
    
    setIsOptimizing(false);
    onOptimizationComplete?.({ keywords: optimalKeywords, categories: optimalCategories });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <Target className="h-5 w-5 text-romance-accent" />
            Romance Metadata Optimizer
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-romance-muted">Optimization Score:</span>
              <span className={`font-semibold ${getScoreColor(optimizationScore)}`}>
                {optimizationScore}/100
              </span>
            </div>
            <Progress value={optimizationScore} className="w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="optimize">Optimize</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Current Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Selected Keywords ({selectedKeywords.length}/7)</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="bg-romance-secondary/20">
                            {keyword}
                          </Badge>
                        ))}
                        {selectedKeywords.length === 0 && (
                          <span className="text-sm text-romance-muted">No keywords selected</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Selected Categories ({selectedCategories.length}/3)</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedCategories.map((category, index) => (
                          <Badge key={index} variant="outline" className="border-romance-primary">
                            {category}
                          </Badge>
                        ))}
                        {selectedCategories.length === 0 && (
                          <span className="text-sm text-romance-muted">No categories selected</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Optimization Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {optimizationSuggestions.length > 0 ? (
                        optimizationSuggestions.map((suggestion, index) => (
                          <div key={index} className="border-l-4 border-romance-primary pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={suggestion.priority === 'high' ? 'destructive' : 
                                        suggestion.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {suggestion.priority}
                              </Badge>
                              <Tag className="h-3 w-3" />
                              <span className="text-sm font-medium capitalize">{suggestion.type}</span>
                            </div>
                            <p className="text-sm text-romance-text">{suggestion.suggestion}</p>
                            <p className="text-xs text-romance-muted mt-1">{suggestion.impact}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <Star className="h-8 w-8 mx-auto mb-2 text-romance-accent" />
                          <p className="text-sm text-romance-muted">Great! Your metadata is well optimized.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="keyword-search">Search Keywords</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="keyword-search"
                        placeholder="Search romance keywords..."
                        value={keywordFilter}
                        onChange={(e) => setKeywordFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <Label>Min Search Volume: {minSearchVolume[0].toLocaleString()}</Label>
                    <Slider
                      value={minSearchVolume}
                      onValueChange={setMinSearchVolume}
                      max={20000}
                      min={1000}
                      step={1000}
                      className="mt-2"
                    />
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {filteredKeywords.map((keyword, index) => (
                    <Card 
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedKeywords.includes(keyword.keyword)
                          ? 'border-romance-primary ring-2 ring-romance-primary/20'
                          : 'border-gray-200 hover:border-romance-primary/50'
                      }`}
                      onClick={() => handleKeywordToggle(keyword.keyword)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{keyword.keyword}</h3>
                              {getTrendIcon(keyword.trend)}
                              <Badge className={`text-xs ${getCompetitionColor(keyword.competition)}`}>
                                {keyword.competition}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="block text-xs text-gray-500">Volume</span>
                                <span className="font-medium">{keyword.searchVolume.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="block text-xs text-gray-500">Difficulty</span>
                                <span className="font-medium">{keyword.difficulty}/10</span>
                              </div>
                              <div>
                                <span className="block text-xs text-gray-500">Romance Score</span>
                                <span className="font-medium">{keyword.romanceScore}/100</span>
                              </div>
                              <div>
                                <span className="block text-xs text-gray-500">Avg Position</span>
                                <span className="font-medium">{keyword.avgPosition}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="grid gap-4">
                {romanceCategories.map((category, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all ${
                      selectedCategories.includes(category.category)
                        ? 'border-romance-primary ring-2 ring-romance-primary/20'
                        : 'border-gray-200 hover:border-romance-primary/50'
                    }`}
                    onClick={() => handleCategoryToggle(category.category)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{category.category}</h3>
                            <Badge 
                              className={`text-xs ${
                                category.trendingStatus === 'hot' ? 'bg-red-100 text-red-700' :
                                category.trendingStatus === 'rising' ? 'bg-green-100 text-green-700' :
                                category.trendingStatus === 'stable' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {category.trendingStatus}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="block text-xs text-gray-500">Rank</span>
                              <span className="font-medium">#{category.rank}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">Competition</span>
                              <span className="font-medium">{category.competition}%</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">Avg Sales/Month</span>
                              <span className="font-medium">{category.avgSales}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Subcategories: </span>
                            <span className="text-xs">{category.subcategories.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="optimize" className="space-y-6">
              <Card className="border-romance-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    AI-Powered Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-romance-muted">
                    Let our AI analyze current market trends and automatically select the optimal keywords and categories for your romance book.
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={runOptimization}
                      disabled={isOptimizing}
                      className="bg-romance-primary hover:bg-romance-primary/90"
                    >
                      {isOptimizing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Run AI Optimization
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isOptimizing && (
                    <div className="bg-romance-background/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-pulse h-2 w-2 bg-romance-primary rounded-full"></div>
                        <span className="text-sm">Analyzing market trends...</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-pulse h-2 w-2 bg-romance-primary rounded-full"></div>
                        <span className="text-sm">Evaluating keyword performance...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse h-2 w-2 bg-romance-primary rounded-full"></div>
                        <span className="text-sm">Optimizing category selection...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-romance-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Market Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-romance-background/50 rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-romance-accent" />
                      <div className="text-2xl font-bold text-romance-primary">2.3M+</div>
                      <div className="text-sm text-romance-muted">Monthly Romance Readers</div>
                    </div>
                    <div className="text-center p-4 bg-romance-background/50 rounded-lg">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-romance-accent" />
                      <div className="text-2xl font-bold text-romance-primary">15,400</div>
                      <div className="text-sm text-romance-muted">New Releases This Month</div>
                    </div>
                    <div className="text-center p-4 bg-romance-background/50 rounded-lg">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-romance-accent" />
                      <div className="text-2xl font-bold text-romance-primary">+23%</div>
                      <div className="text-sm text-romance-muted">Category Growth</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};