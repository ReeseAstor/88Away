import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, Minus, Globe, Calendar, BarChart3, LineChart, PieChart, Target, Star, Heart, Zap, DollarSign, BookOpen, Users, ArrowUp, ArrowDown } from 'lucide-react';

interface MarketTrend {
  genre: string;
  currentRank: number;
  previousRank: number;
  growthRate: number;
  marketShare: number;
  avgPrice: number;
  competition: 'low' | 'medium' | 'high';
  seasonality: number;
  readerDemographics: {
    ageGroup: string;
    percentage: number;
  }[];
}

interface SeasonalPattern {
  month: string;
  sales: number;
  releases: number;
  trendinGgenres: string[];
  holidayImpact: number;
}

interface EmergingTrend {
  name: string;
  description: string;
  growthRate: number;
  confidence: number;
  timeline: string;
  keywords: string[];
  marketOpportunity: number;
}

interface CompetitorAnalysis {
  category: string;
  topAuthors: string[];
  avgReleaseFrequency: number;
  marketSaturation: number;
  priceRange: { min: number; max: number; avg: number };
  successFactors: string[];
}

interface RomanceMarketTrendsProps {
  timeframe?: 'month' | 'quarter' | 'year';
  region?: 'global' | 'us' | 'uk' | 'canada' | 'australia';
  onTrendSelect?: (trend: MarketTrend) => void;
}

const mockMarketTrends: MarketTrend[] = [
  {
    genre: 'Contemporary Romance',
    currentRank: 1,
    previousRank: 1,
    growthRate: 12.3,
    marketShare: 32.5,
    avgPrice: 4.99,
    competition: 'high',
    seasonality: 85,
    readerDemographics: [
      { ageGroup: '18-24', percentage: 15 },
      { ageGroup: '25-34', percentage: 35 },
      { ageGroup: '35-44', percentage: 30 },
      { ageGroup: '45+', percentage: 20 }
    ]
  },
  {
    genre: 'Dark Romance',
    currentRank: 2,
    previousRank: 4,
    growthRate: 28.7,
    marketShare: 18.2,
    avgPrice: 5.49,
    competition: 'medium',
    seasonality: 92,
    readerDemographics: [
      { ageGroup: '18-24', percentage: 25 },
      { ageGroup: '25-34', percentage: 45 },
      { ageGroup: '35-44', percentage: 22 },
      { ageGroup: '45+', percentage: 8 }
    ]
  },
  {
    genre: 'Paranormal Romance',
    currentRank: 3,
    previousRank: 2,
    growthRate: -5.2,
    marketShare: 15.8,
    avgPrice: 5.99,
    competition: 'medium',
    seasonality: 78,
    readerDemographics: [
      { ageGroup: '18-24', percentage: 30 },
      { ageGroup: '25-34', percentage: 35 },
      { ageGroup: '35-44', percentage: 25 },
      { ageGroup: '45+', percentage: 10 }
    ]
  },
  {
    genre: 'Romantic Suspense',
    currentRank: 4,
    previousRank: 3,
    growthRate: 8.9,
    marketShare: 12.1,
    avgPrice: 4.49,
    competition: 'low',
    seasonality: 88,
    readerDemographics: [
      { ageGroup: '18-24', percentage: 10 },
      { ageGroup: '25-34', percentage: 25 },
      { ageGroup: '35-44', percentage: 40 },
      { ageGroup: '45+', percentage: 25 }
    ]
  },
  {
    genre: 'Historical Romance',
    currentRank: 5,
    previousRank: 5,
    growthRate: 3.4,
    marketShare: 10.2,
    avgPrice: 6.49,
    competition: 'low',
    seasonality: 72,
    readerDemographics: [
      { ageGroup: '18-24', percentage: 8 },
      { ageGroup: '25-34', percentage: 20 },
      { ageGroup: '35-44', percentage: 35 },
      { ageGroup: '45+', percentage: 37 }
    ]
  },
  {
    genre: 'Erotic Romance',
    currentRank: 6,
    previousRank: 6,
    growthRate: 15.6,
    marketShare: 8.9,
    avgPrice: 3.99,
    competition: 'high',
    seasonality: 95,
    readerDemographics: [
      { ageGroup: '18-24', percentage: 35 },
      { ageGroup: '25-34', percentage: 40 },
      { ageGroup: '35-44', percentage: 20 },
      { ageGroup: '45+', percentage: 5 }
    ]
  }
];

const mockSeasonalPatterns: SeasonalPattern[] = [
  { month: 'Jan', sales: 85, releases: 120, trendinGgenres: ['New Adult', 'Resolution Romance'], holidayImpact: 15 },
  { month: 'Feb', sales: 150, releases: 200, trendinGgenres: ['Contemporary', 'Valentine Special'], holidayImpact: 95 },
  { month: 'Mar', sales: 110, releases: 180, trendinGgenres: ['Spring Fling', 'Contemporary'], holidayImpact: 25 },
  { month: 'Apr', sales: 95, releases: 160, trendinGgenres: ['Outdoor Romance', 'Sports'], holidayImpact: 20 },
  { month: 'May', sales: 105, releases: 190, trendinGgenres: ['Wedding Season', 'Contemporary'], holidayImpact: 45 },
  { month: 'Jun', sales: 120, releases: 210, trendinGgenres: ['Summer Romance', 'Beach Reads'], holidayImpact: 35 },
  { month: 'Jul', sales: 130, releases: 240, trendinGgenres: ['Vacation Romance', 'Summer Fling'], holidayImpact: 50 },
  { month: 'Aug', sales: 125, releases: 220, trendinGgenres: ['Back to School', 'Teacher Romance'], holidayImpact: 30 },
  { month: 'Sep', sales: 115, releases: 200, trendinGgenres: ['Autumn Romance', 'Cozy Romance'], holidayImpact: 25 },
  { month: 'Oct', sales: 140, releases: 230, trendinGgenres: ['Halloween Romance', 'Dark Romance'], holidayImpact: 70 },
  { month: 'Nov', sales: 110, releases: 190, trendinGgenres: ['Thanksgiving Romance', 'Family Saga'], holidayImpact: 40 },
  { month: 'Dec', sales: 160, releases: 250, trendinGgenres: ['Holiday Romance', 'Christmas Romance'], holidayImpact: 100 }
];

const mockEmergingTrends: EmergingTrend[] = [
  {
    name: 'Neurodiverse Romance',
    description: 'Romance featuring neurodiverse characters and authentic representation',
    growthRate: 45.2,
    confidence: 87,
    timeline: '6-12 months',
    keywords: ['autism', 'ADHD', 'representation', 'neurodiversity'],
    marketOpportunity: 8.5
  },
  {
    name: 'Climate Fiction Romance',
    description: 'Romantic stories set against environmental and climate themes',
    growthRate: 32.8,
    confidence: 72,
    timeline: '12-18 months',
    keywords: ['climate change', 'sustainability', 'eco-romance', 'future'],
    marketOpportunity: 6.2
  },
  {
    name: 'AI/Tech Romance',
    description: 'Romance exploring relationships with AI or in tech-heavy settings',
    growthRate: 28.4,
    confidence: 65,
    timeline: '18-24 months',
    keywords: ['artificial intelligence', 'virtual reality', 'tech romance', 'future'],
    marketOpportunity: 5.8
  }
];

const mockCompetitorAnalysis: CompetitorAnalysis[] = [
  {
    category: 'Contemporary Romance',
    topAuthors: ['Author A', 'Author B', 'Author C'],
    avgReleaseFrequency: 3.2,
    marketSaturation: 85,
    priceRange: { min: 2.99, max: 7.99, avg: 4.99 },
    successFactors: ['Strong social media', 'Series consistency', 'Reader engagement']
  },
  {
    category: 'Dark Romance',
    topAuthors: ['Author D', 'Author E', 'Author F'],
    avgReleaseFrequency: 2.8,
    marketSaturation: 65,
    priceRange: { min: 3.99, max: 8.99, avg: 5.49 },
    successFactors: ['Bold marketing', 'Trigger warnings', 'Community building']
  }
];

export const RomanceMarketTrends: React.FC<RomanceMarketTrendsProps> = ({
  timeframe = 'quarter',
  region = 'global',
  onTrendSelect
}) => {
  const [activeTab, setActiveTab] = useState('trends');
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [competitionFilter, setCompetitionFilter] = useState([0, 100]);

  const filteredTrends = mockMarketTrends.filter(trend => {
    if (selectedGenre !== 'all' && !trend.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
      return false;
    }
    const competitionScore = trend.competition === 'low' ? 25 : trend.competition === 'medium' ? 50 : 75;
    return competitionScore >= competitionFilter[0] && competitionScore <= competitionFilter[1];
  });

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (current > previous) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 15) return 'text-green-600 bg-green-100';
    if (growth > 5) return 'text-blue-600 bg-blue-100';
    if (growth > 0) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <TrendingUp className="h-5 w-5 text-romance-accent" />
            Romance Market Trends Analysis
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="australia">Australia</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="contemporary">Contemporary</SelectItem>
                <SelectItem value="dark">Dark Romance</SelectItem>
                <SelectItem value="paranormal">Paranormal</SelectItem>
                <SelectItem value="historical">Historical</SelectItem>
                <SelectItem value="suspense">Romantic Suspense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trends">Genre Trends</TabsTrigger>
              <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
              <TabsTrigger value="emerging">Emerging</TabsTrigger>
              <TabsTrigger value="competition">Competition</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Competition Level Filter</label>
                    <Slider
                      value={competitionFilter}
                      onValueChange={setCompetitionFilter}
                      max={100}
                      min={0}
                      step={25}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-romance-muted mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {filteredTrends.map((trend, index) => (
                    <Card 
                      key={trend.genre}
                      className="border-romance-accent/20 hover:border-romance-primary/50 transition-colors cursor-pointer"
                      onClick={() => onTrendSelect?.(trend)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-romance-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-romance-primary">#{trend.currentRank}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{trend.genre}</h3>
                              <div className="flex items-center gap-2 text-sm text-romance-muted">
                                {getTrendIcon(trend.currentRank, trend.previousRank)}
                                <span>
                                  {trend.currentRank < trend.previousRank ? 'Up' : 
                                   trend.currentRank > trend.previousRank ? 'Down' : 'Stable'}
                                  {trend.currentRank !== trend.previousRank && 
                                    ` ${Math.abs(trend.currentRank - trend.previousRank)} positions`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`mb-2 ${getGrowthColor(trend.growthRate)}`}>
                              {trend.growthRate > 0 ? '+' : ''}{trend.growthRate.toFixed(1)}%
                            </Badge>
                            <div className="text-sm text-romance-muted">${trend.avgPrice} avg price</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-romance-primary">
                              {trend.marketShare.toFixed(1)}%
                            </div>
                            <div className="text-xs text-romance-muted">Market Share</div>
                          </div>
                          <div className="text-center">
                            <Badge className={`${getCompetitionColor(trend.competition)}`}>
                              {trend.competition}
                            </Badge>
                            <div className="text-xs text-romance-muted mt-1">Competition</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-romance-primary">
                              {trend.seasonality}
                            </div>
                            <div className="text-xs text-romance-muted">Seasonality</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-romance-primary">
                              ${trend.avgPrice}
                            </div>
                            <div className="text-xs text-romance-muted">Avg Price</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Reader Demographics</div>
                          <div className="grid grid-cols-4 gap-2">
                            {trend.readerDemographics.map((demo, idx) => (
                              <div key={idx} className="text-center p-2 bg-romance-background/50 rounded">
                                <div className="text-sm font-medium">{demo.ageGroup}</div>
                                <div className="text-xs text-romance-muted">{demo.percentage}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seasonal" className="space-y-6">
              <Card className="border-romance-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Seasonal Romance Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {mockSeasonalPatterns.map((pattern, index) => (
                      <div key={pattern.month} className="flex items-center justify-between p-4 bg-romance-background/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-romance-primary/20 rounded-full flex items-center justify-center">
                            <span className="font-medium text-romance-primary">{pattern.month}</span>
                          </div>
                          <div>
                            <div className="font-medium">{pattern.trendinGgenres.join(', ')}</div>
                            <div className="text-sm text-romance-muted">
                              {pattern.sales} sales • {pattern.releases} releases
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="h-4 w-4 text-romance-accent" />
                            <span className="text-sm">{pattern.holidayImpact}% holiday impact</span>
                          </div>
                          <Progress value={pattern.holidayImpact} className="w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emerging" className="space-y-6">
              <div className="grid gap-4">
                {mockEmergingTrends.map((trend, index) => (
                  <Card key={trend.name} className="border-romance-accent/30">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{trend.name}</h3>
                          <p className="text-sm text-romance-muted mb-3">{trend.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {trend.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge className={`mb-2 ${getGrowthColor(trend.growthRate)}`}>
                            +{trend.growthRate.toFixed(1)}% growth
                          </Badge>
                          <div className="text-sm text-romance-muted">{trend.timeline}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-romance-muted mb-1">Confidence</div>
                          <div className="flex items-center gap-2">
                            <Progress value={trend.confidence} className="flex-1" />
                            <span className="text-sm font-medium">{trend.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-romance-muted mb-1">Market Opportunity</div>
                          <div className="text-lg font-semibold text-romance-primary">
                            {trend.marketOpportunity.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-romance-muted mb-1">Growth Rate</div>
                          <div className="text-lg font-semibold text-green-600">
                            +{trend.growthRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="competition" className="space-y-6">
              <div className="grid gap-4">
                {mockCompetitorAnalysis.map((analysis, index) => (
                  <Card key={analysis.category} className="border-romance-accent/30">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{analysis.category}</span>
                        <Badge className={`${getCompetitionColor(
                          analysis.marketSaturation > 80 ? 'high' : 
                          analysis.marketSaturation > 50 ? 'medium' : 'low'
                        )}`}>
                          {analysis.marketSaturation}% saturated
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-romance-muted mb-2">Price Range</div>
                          <div className="text-sm">
                            ${analysis.priceRange.min} - ${analysis.priceRange.max}
                          </div>
                          <div className="text-xs text-romance-muted">
                            Avg: ${analysis.priceRange.avg}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-romance-muted mb-2">Release Frequency</div>
                          <div className="text-lg font-semibold text-romance-primary">
                            {analysis.avgReleaseFrequency}
                          </div>
                          <div className="text-xs text-romance-muted">books/year</div>
                        </div>
                        <div>
                          <div className="text-sm text-romance-muted mb-2">Market Saturation</div>
                          <div className="flex items-center gap-2">
                            <Progress value={analysis.marketSaturation} className="flex-1" />
                            <span className="text-sm">{analysis.marketSaturation}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-romance-muted mb-2">Top Authors</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.topAuthors.map((author, idx) => (
                            <Badge key={idx} variant="secondary">
                              {author}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-romance-muted mb-2">Success Factors</div>
                        <ul className="text-sm space-y-1">
                          {analysis.successFactors.map((factor, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Star className="h-3 w-3 text-romance-accent" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};