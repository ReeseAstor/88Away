import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Target, AlertTriangle, CheckCircle, BookOpen, Clock, Users, Star } from 'lucide-react';

interface ProjectCosts {
  writing: number;
  editing: number;
  coverDesign: number;
  formatting: number;
  marketing: number;
  advertising: number;
  software: number;
  isbn: number;
  other: number;
}

interface RevenueProjection {
  ebookSales: number;
  paperbackSales: number;
  audiobookSales: number;
  kuPages: number;
  merchandising: number;
  licensing: number;
}

interface MarketFactors {
  genre: string;
  heatLevel: number;
  seriesPosition: number;
  authorPlatform: 'new' | 'emerging' | 'established' | 'bestseller';
  marketingBudget: number;
  launchStrategy: 'soft' | 'medium' | 'aggressive';
  seasonality: number;
}

interface ROIResult {
  totalInvestment: number;
  projectedRevenue: number;
  netProfit: number;
  roiPercentage: number;
  breakEvenUnits: number;
  paybackPeriod: number;
  profitMargin: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface ROICalculatorProps {
  onCalculationComplete?: (result: ROIResult) => void;
}

const defaultCosts: ProjectCosts = {
  writing: 0,
  editing: 1500,
  coverDesign: 400,
  formatting: 150,
  marketing: 800,
  advertising: 1200,
  software: 50,
  isbn: 125,
  other: 275
};

const defaultRevenue: RevenueProjection = {
  ebookSales: 5000,
  paperbackSales: 500,
  audiobookSales: 1000,
  kuPages: 15000,
  merchandising: 200,
  licensing: 0
};

const defaultMarketFactors: MarketFactors = {
  genre: 'contemporary',
  heatLevel: 3,
  seriesPosition: 1,
  authorPlatform: 'emerging',
  marketingBudget: 2000,
  launchStrategy: 'medium',
  seasonality: 100
};

const genreMultipliers = {
  contemporary: 1.0,
  historical: 0.85,
  paranormal: 0.9,
  suspense: 0.8,
  erotic: 1.15,
  dark: 1.25,
  fantasy: 0.75
};

const platformMultipliers = {
  new: 0.6,
  emerging: 0.8,
  established: 1.2,
  bestseller: 2.0
};

const launchMultipliers = {
  soft: 0.7,
  medium: 1.0,
  aggressive: 1.4
};

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  onCalculationComplete
}) => {
  const [activeTab, setActiveTab] = useState('costs');
  const [costs, setCosts] = useState<ProjectCosts>(defaultCosts);
  const [revenue, setRevenue] = useState<RevenueProjection>(defaultRevenue);
  const [marketFactors, setMarketFactors] = useState<MarketFactors>(defaultMarketFactors);
  const [roiResult, setRoiResult] = useState<ROIResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateCost = (key: keyof ProjectCosts, value: number) => {
    setCosts(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const updateRevenue = (key: keyof RevenueProjection, value: number) => {
    setRevenue(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const updateMarketFactor = (key: keyof MarketFactors, value: any) => {
    setMarketFactors(prev => ({ ...prev, [key]: value }));
  };

  const calculateROI = () => {
    // Calculate total investment
    const totalInvestment = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    // Apply market factor adjustments
    const genreMultiplier = genreMultipliers[marketFactors.genre as keyof typeof genreMultipliers] || 1.0;
    const platformMultiplier = platformMultipliers[marketFactors.authorPlatform];
    const launchMultiplier = launchMultipliers[marketFactors.launchStrategy];
    const seasonalityMultiplier = marketFactors.seasonality / 100;
    const heatLevelMultiplier = 0.8 + (marketFactors.heatLevel * 0.1);
    const seriesMultiplier = marketFactors.seriesPosition === 1 ? 0.9 : 1.0 + (marketFactors.seriesPosition - 1) * 0.15;

    const overallMultiplier = genreMultiplier * platformMultiplier * launchMultiplier * 
                             seasonalityMultiplier * heatLevelMultiplier * seriesMultiplier;

    // Calculate adjusted revenue projections
    const ebookRevenue = revenue.ebookSales * 3.99 * 0.70; // $3.99 * 70% royalty
    const paperbackRevenue = revenue.paperbackSales * 12.99 * 0.60; // $12.99 * 60% royalty
    const audiobookRevenue = revenue.audiobookSales * 14.99 * 0.25; // $14.99 * 25% royalty
    const kuRevenue = revenue.kuPages * 0.0045; // $0.0045 per page
    const merchandisingRevenue = revenue.merchandising;
    const licensingRevenue = revenue.licensing;

    const baseRevenue = ebookRevenue + paperbackRevenue + audiobookRevenue + 
                       kuRevenue + merchandisingRevenue + licensingRevenue;
    
    const projectedRevenue = baseRevenue * overallMultiplier;

    // Calculate metrics
    const netProfit = projectedRevenue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    const profitMargin = projectedRevenue > 0 ? (netProfit / projectedRevenue) * 100 : 0;
    
    // Calculate break-even units (assuming average $3.99 ebook price)
    const avgUnitRevenue = 3.99 * 0.70; // $3.99 * 70% royalty
    const breakEvenUnits = Math.ceil(totalInvestment / avgUnitRevenue);
    
    // Estimate payback period (months)
    const monthlyRevenue = projectedRevenue / 12;
    const paybackPeriod = monthlyRevenue > 0 ? totalInvestment / monthlyRevenue : 999;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (roiPercentage > 100 && totalInvestment < 3000) riskLevel = 'low';
    else if (roiPercentage < 25 || totalInvestment > 8000) riskLevel = 'high';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (roiPercentage < 50) {
      recommendations.push('Consider reducing costs or increasing marketing to improve ROI');
    }
    if (totalInvestment > 5000) {
      recommendations.push('High investment detected - ensure strong marketing strategy');
    }
    if (marketFactors.authorPlatform === 'new' && totalInvestment > 2000) {
      recommendations.push('As a new author, consider starting with lower investment');
    }
    if (costs.marketing < totalInvestment * 0.3) {
      recommendations.push('Marketing budget may be too low for optimal results');
    }
    if (marketFactors.seriesPosition === 1) {
      recommendations.push('First books typically have lower sales - plan for series growth');
    }
    if (roiPercentage > 200) {
      recommendations.push('Excellent projected ROI - consider investing more in marketing');
    }

    const result: ROIResult = {
      totalInvestment,
      projectedRevenue,
      netProfit,
      roiPercentage,
      breakEvenUnits,
      paybackPeriod,
      profitMargin,
      riskLevel,
      recommendations
    };

    setRoiResult(result);
    onCalculationComplete?.(result);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi > 100) return 'text-green-600';
    if (roi > 50) return 'text-blue-600';
    if (roi > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    calculateROI();
  }, [costs, revenue, marketFactors]);

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <Calculator className="h-5 w-5 text-romance-accent" />
            Romance Publishing ROI Calculator
          </CardTitle>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple View' : 'Advanced Settings'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Section */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="costs">Costs</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="factors">Market Factors</TabsTrigger>
                </TabsList>

                <TabsContent value="costs" className="space-y-4">
                  <h3 className="text-lg font-semibold text-romance-text">Project Costs</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="writing">Writing/Ghostwriting</Label>
                      <Input
                        id="writing"
                        type="number"
                        value={costs.writing}
                        onChange={(e) => updateCost('writing', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="editing">Editing</Label>
                      <Input
                        id="editing"
                        type="number"
                        value={costs.editing}
                        onChange={(e) => updateCost('editing', parseFloat(e.target.value) || 0)}
                        placeholder="1500"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="coverDesign">Cover Design</Label>
                      <Input
                        id="coverDesign"
                        type="number"
                        value={costs.coverDesign}
                        onChange={(e) => updateCost('coverDesign', parseFloat(e.target.value) || 0)}
                        placeholder="400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="formatting">Formatting</Label>
                      <Input
                        id="formatting"
                        type="number"
                        value={costs.formatting}
                        onChange={(e) => updateCost('formatting', parseFloat(e.target.value) || 0)}
                        placeholder="150"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="marketing">Marketing</Label>
                      <Input
                        id="marketing"
                        type="number"
                        value={costs.marketing}
                        onChange={(e) => updateCost('marketing', parseFloat(e.target.value) || 0)}
                        placeholder="800"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="advertising">Advertising</Label>
                      <Input
                        id="advertising"
                        type="number"
                        value={costs.advertising}
                        onChange={(e) => updateCost('advertising', parseFloat(e.target.value) || 0)}
                        placeholder="1200"
                      />
                    </div>
                    
                    {showAdvanced && (
                      <>
                        <div>
                          <Label htmlFor="software">Software/Tools</Label>
                          <Input
                            id="software"
                            type="number"
                            value={costs.software}
                            onChange={(e) => updateCost('software', parseFloat(e.target.value) || 0)}
                            placeholder="50"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="isbn">ISBN</Label>
                          <Input
                            id="isbn"
                            type="number"
                            value={costs.isbn}
                            onChange={(e) => updateCost('isbn', parseFloat(e.target.value) || 0)}
                            placeholder="125"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="other">Other Costs</Label>
                          <Input
                            id="other"
                            type="number"
                            value={costs.other}
                            onChange={(e) => updateCost('other', parseFloat(e.target.value) || 0)}
                            placeholder="275"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="revenue" className="space-y-4">
                  <h3 className="text-lg font-semibold text-romance-text">Revenue Projections</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ebookSales">Ebook Sales (units)</Label>
                      <Input
                        id="ebookSales"
                        type="number"
                        value={revenue.ebookSales}
                        onChange={(e) => updateRevenue('ebookSales', parseFloat(e.target.value) || 0)}
                        placeholder="5000"
                      />
                      <div className="text-xs text-romance-muted mt-1">Assumes $3.99 price, 70% royalty</div>
                    </div>
                    
                    <div>
                      <Label htmlFor="paperbackSales">Paperback Sales (units)</Label>
                      <Input
                        id="paperbackSales"
                        type="number"
                        value={revenue.paperbackSales}
                        onChange={(e) => updateRevenue('paperbackSales', parseFloat(e.target.value) || 0)}
                        placeholder="500"
                      />
                      <div className="text-xs text-romance-muted mt-1">Assumes $12.99 price, 60% royalty</div>
                    </div>
                    
                    <div>
                      <Label htmlFor="audiobookSales">Audiobook Sales (units)</Label>
                      <Input
                        id="audiobookSales"
                        type="number"
                        value={revenue.audiobookSales}
                        onChange={(e) => updateRevenue('audiobookSales', parseFloat(e.target.value) || 0)}
                        placeholder="1000"
                      />
                      <div className="text-xs text-romance-muted mt-1">Assumes $14.99 price, 25% royalty</div>
                    </div>
                    
                    <div>
                      <Label htmlFor="kuPages">KU Pages Read</Label>
                      <Input
                        id="kuPages"
                        type="number"
                        value={revenue.kuPages}
                        onChange={(e) => updateRevenue('kuPages', parseFloat(e.target.value) || 0)}
                        placeholder="15000"
                      />
                      <div className="text-xs text-romance-muted mt-1">Assumes $0.0045 per page</div>
                    </div>
                    
                    {showAdvanced && (
                      <>
                        <div>
                          <Label htmlFor="merchandising">Merchandising Revenue</Label>
                          <Input
                            id="merchandising"
                            type="number"
                            value={revenue.merchandising}
                            onChange={(e) => updateRevenue('merchandising', parseFloat(e.target.value) || 0)}
                            placeholder="200"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="licensing">Licensing Revenue</Label>
                          <Input
                            id="licensing"
                            type="number"
                            value={revenue.licensing}
                            onChange={(e) => updateRevenue('licensing', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="factors" className="space-y-4">
                  <h3 className="text-lg font-semibold text-romance-text">Market Factors</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Romance Genre</Label>
                      <Select value={marketFactors.genre} onValueChange={(value) => updateMarketFactor('genre', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contemporary">Contemporary Romance</SelectItem>
                          <SelectItem value="historical">Historical Romance</SelectItem>
                          <SelectItem value="paranormal">Paranormal Romance</SelectItem>
                          <SelectItem value="suspense">Romantic Suspense</SelectItem>
                          <SelectItem value="erotic">Erotic Romance</SelectItem>
                          <SelectItem value="dark">Dark Romance</SelectItem>
                          <SelectItem value="fantasy">Fantasy Romance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Heat Level: {marketFactors.heatLevel}</Label>
                      <Slider
                        value={[marketFactors.heatLevel]}
                        onValueChange={(value) => updateMarketFactor('heatLevel', value[0])}
                        max={5}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-romance-muted mt-1">
                        <span>Sweet</span>
                        <span>Steamy</span>
                        <span>Erotic</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Author Platform</Label>
                      <Select value={marketFactors.authorPlatform} onValueChange={(value: any) => updateMarketFactor('authorPlatform', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New Author</SelectItem>
                          <SelectItem value="emerging">Emerging Author</SelectItem>
                          <SelectItem value="established">Established Author</SelectItem>
                          <SelectItem value="bestseller">Bestselling Author</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Series Position</Label>
                      <Input
                        type="number"
                        value={marketFactors.seriesPosition}
                        onChange={(e) => updateMarketFactor('seriesPosition', parseInt(e.target.value) || 1)}
                        min="1"
                        placeholder="1"
                      />
                      <div className="text-xs text-romance-muted mt-1">Book number in series (1 for standalone)</div>
                    </div>
                    
                    <div>
                      <Label>Launch Strategy</Label>
                      <Select value={marketFactors.launchStrategy} onValueChange={(value: any) => updateMarketFactor('launchStrategy', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft">Soft Launch</SelectItem>
                          <SelectItem value="medium">Medium Launch</SelectItem>
                          <SelectItem value="aggressive">Aggressive Launch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Seasonality Factor: {marketFactors.seasonality}%</Label>
                      <Slider
                        value={[marketFactors.seasonality]}
                        onValueChange={(value) => updateMarketFactor('seasonality', value[0])}
                        max={150}
                        min={50}
                        step={5}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-romance-muted mt-1">
                        <span>Off-season</span>
                        <span>Normal</span>
                        <span>Peak</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <Card className="border-romance-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    ROI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roiResult && (
                    <>
                      <div className="text-center p-4 bg-romance-background/50 rounded-lg">
                        <div className={`text-3xl font-bold ${getROIColor(roiResult.roiPercentage)}`}>
                          {roiResult.roiPercentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-romance-muted">Return on Investment</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Investment</span>
                          <span className="font-medium">${roiResult.totalInvestment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Projected Revenue</span>
                          <span className="font-medium text-green-600">${roiResult.projectedRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Net Profit</span>
                          <span className={`font-medium ${roiResult.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${roiResult.netProfit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Break-even Units</span>
                          <span className="font-medium">{roiResult.breakEvenUnits.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Payback Period</span>
                          <span className="font-medium">
                            {roiResult.paybackPeriod < 12 ? `${roiResult.paybackPeriod.toFixed(1)} months` : 
                             roiResult.paybackPeriod < 999 ? `${(roiResult.paybackPeriod/12).toFixed(1)} years` : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Profit Margin</span>
                          <span className="font-medium">{roiResult.profitMargin.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Risk Level</span>
                          <Badge className={getRiskColor(roiResult.riskLevel)}>
                            {roiResult.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {roiResult && roiResult.recommendations.length > 0 && (
                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {roiResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-romance-accent mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};