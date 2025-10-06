import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Users, BookOpen, Download, Filter, Target, PieChart, LineChart } from 'lucide-react';

interface RevenueData {
  period: string;
  totalRevenue: number;
  bookSales: number;
  royalties: number;
  subscriptions: number;
  growth: number;
}

interface ClientRevenue {
  clientId: string;
  clientName: string;
  clientType: 'author' | 'publisher' | 'agency';
  revenue: number;
  books: number;
  avgRevenuePerBook: number;
  growth: number;
  topGenres: string[];
}

interface GenrePerformance {
  genre: string;
  revenue: number;
  books: number;
  avgPrice: number;
  growth: number;
  marketShare: number;
}

interface RevenueAnalyticsProps {
  clientId?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  onExport?: (data: any) => void;
}

const mockRevenueData: RevenueData[] = [
  { period: '2024-01', totalRevenue: 45680, bookSales: 32400, royalties: 9800, subscriptions: 3480, growth: 12.5 },
  { period: '2024-02', totalRevenue: 52300, bookSales: 38200, royalties: 10800, subscriptions: 3300, growth: 14.5 },
  { period: '2024-03', totalRevenue: 48950, bookSales: 35600, royalties: 9950, subscriptions: 3400, growth: -6.4 },
  { period: '2024-04', totalRevenue: 58200, bookSales: 42100, royalties: 12200, subscriptions: 3900, growth: 18.9 },
  { period: '2024-05', totalRevenue: 61800, bookSales: 44500, royalties: 13100, subscriptions: 4200, growth: 6.2 },
  { period: '2024-06', totalRevenue: 67400, bookSales: 48900, royalties: 14200, subscriptions: 4300, growth: 9.1 }
];

const mockClientRevenue: ClientRevenue[] = [
  {
    clientId: '1',
    clientName: 'Sarah Martinez',
    clientType: 'author',
    revenue: 45800,
    books: 12,
    avgRevenuePerBook: 3817,
    growth: 23.5,
    topGenres: ['Contemporary Romance', 'Romantic Suspense']
  },
  {
    clientId: '2',
    clientName: 'Midnight Publishing',
    clientType: 'publisher',
    revenue: 298500,
    books: 156,
    avgRevenuePerBook: 1913,
    growth: 15.2,
    topGenres: ['Paranormal Romance', 'Dark Romance', 'Erotic Romance']
  },
  {
    clientId: '3',
    clientName: 'Elena Rodriguez',
    clientType: 'author',
    revenue: 28900,
    books: 8,
    avgRevenuePerBook: 3613,
    growth: 8.7,
    topGenres: ['Historical Romance', 'Clean Romance']
  }
];

const mockGenrePerformance: GenrePerformance[] = [
  { genre: 'Contemporary Romance', revenue: 125400, books: 45, avgPrice: 4.99, growth: 18.2, marketShare: 32.1 },
  { genre: 'Paranormal Romance', revenue: 98200, books: 38, avgPrice: 5.49, growth: 12.8, marketShare: 25.2 },
  { genre: 'Historical Romance', revenue: 76800, books: 28, avgPrice: 5.99, growth: 9.5, marketShare: 19.7 },
  { genre: 'Romantic Suspense', revenue: 54600, books: 22, avgPrice: 4.49, growth: 15.3, marketShare: 14.0 },
  { genre: 'Erotic Romance', revenue: 35200, books: 15, avgPrice: 6.49, growth: 22.1, marketShare: 9.0 }
];

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({
  clientId,
  timeRange = 'month',
  onExport
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedClient, setSelectedClient] = useState(clientId || 'all');
  const [revenueData, setRevenueData] = useState(mockRevenueData);
  const [clientData, setClientData] = useState(mockClientRevenue);
  const [genreData, setGenreData] = useState(mockGenrePerformance);

  const calculateTotals = () => {
    const currentMonth = revenueData[revenueData.length - 1];
    const previousMonth = revenueData[revenueData.length - 2];
    
    const totalRevenue = revenueData.reduce((sum, data) => sum + data.totalRevenue, 0);
    const totalBooks = clientData.reduce((sum, client) => sum + client.books, 0);
    const totalClients = clientData.length;
    const avgGrowth = currentMonth && previousMonth ? 
      ((currentMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalBooks,
      totalClients,
      avgGrowth,
      currentMonthRevenue: currentMonth?.totalRevenue || 0
    };
  };

  const getTopPerformers = () => {
    const topClients = [...clientData]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    const topGenres = [...genreData]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { topClients, topGenres };
  };

  const exportData = () => {
    const exportPayload = {
      summary: calculateTotals(),
      revenueTimeline: revenueData,
      clientBreakdown: clientData,
      genrePerformance: genreData,
      exportDate: new Date().toISOString(),
      timeRange: selectedTimeRange
    };
    
    onExport?.(exportPayload);
    
    // Simulate file download
    const dataStr = JSON.stringify(exportPayload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `romance-revenue-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totals = calculateTotals();
  const { topClients, topGenres } = getTopPerformers();

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card className="border-romance-primary/20">
        <CardHeader className="bg-gradient-to-r from-romance-primary/5 to-romance-secondary/5">
          <CardTitle className="flex items-center gap-2 text-romance-text">
            <BarChart3 className="h-5 w-5 text-romance-accent" />
            Revenue Analytics Dashboard
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clientData.map((client) => (
                    <SelectItem key={client.clientId} value={client.clientId}>
                      {client.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-romance-accent/30">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-romance-primary" />
                <div className="text-2xl font-bold text-romance-primary">
                  ${totals.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-romance-muted">Total Revenue</div>
                <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${getGrowthColor(totals.avgGrowth)}`}>
                  {getGrowthIcon(totals.avgGrowth)}
                  {totals.avgGrowth > 0 ? '+' : ''}{totals.avgGrowth.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-romance-accent/30">
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-romance-primary" />
                <div className="text-2xl font-bold text-romance-primary">{totals.totalBooks}</div>
                <div className="text-sm text-romance-muted">Total Books</div>
                <div className="text-xs text-romance-muted mt-1">
                  ${(totals.totalRevenue / totals.totalBooks).toFixed(0)} avg/book
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-romance-accent/30">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-romance-primary" />
                <div className="text-2xl font-bold text-romance-primary">{totals.totalClients}</div>
                <div className="text-sm text-romance-muted">Active Clients</div>
                <div className="text-xs text-romance-muted mt-1">
                  ${(totals.totalRevenue / totals.totalClients).toFixed(0)} avg/client
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-romance-accent/30">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-romance-primary" />
                <div className="text-2xl font-bold text-romance-primary">
                  ${totals.currentMonthRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-romance-muted">This Month</div>
                <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${getGrowthColor(totals.avgGrowth)}`}>
                  {getGrowthIcon(totals.avgGrowth)}
                  vs last month
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clients">Client Analysis</TabsTrigger>
              <TabsTrigger value="genres">Genre Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Revenue Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {revenueData.slice(-6).map((data, index) => (
                        <div key={data.period} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">{data.period}</div>
                            <div className={`flex items-center gap-1 text-xs ${getGrowthColor(data.growth)}`}>
                              {getGrowthIcon(data.growth)}
                              {data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${data.totalRevenue.toLocaleString()}</div>
                            <div className="text-xs text-romance-muted">
                              Books: ${data.bookSales.toLocaleString()} | Royalties: ${data.royalties.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'Book Sales', value: totals.currentMonthRevenue * 0.72, color: 'bg-romance-primary' },
                        { label: 'Royalties', value: totals.currentMonthRevenue * 0.21, color: 'bg-romance-secondary' },
                        { label: 'Subscriptions', value: totals.currentMonthRevenue * 0.07, color: 'bg-romance-accent' }
                      ].map((item, index) => {
                        const percentage = (item.value / totals.currentMonthRevenue) * 100;
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{item.label}</span>
                              <span>${item.value.toFixed(0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${item.color}`}></div>
                              <Progress value={percentage} className="flex-1" />
                              <span className="text-xs text-romance-muted">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="grid gap-4">
                {clientData.map((client) => (
                  <Card key={client.clientId} className="border-romance-accent/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{client.clientName}</h3>
                          <Badge variant="outline" className="mt-1 capitalize">
                            {client.clientType}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-romance-primary">
                            ${client.revenue.toLocaleString()}
                          </div>
                          <div className={`text-sm flex items-center gap-1 ${getGrowthColor(client.growth)}`}>
                            {getGrowthIcon(client.growth)}
                            {client.growth > 0 ? '+' : ''}{client.growth.toFixed(1)}% growth
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-romance-primary">{client.books}</div>
                          <div className="text-xs text-romance-muted">Books Published</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-romance-primary">
                            ${client.avgRevenuePerBook.toLocaleString()}
                          </div>
                          <div className="text-xs text-romance-muted">Avg Revenue/Book</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-romance-primary">
                            {((client.revenue / totals.totalRevenue) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-romance-muted">Market Share</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-romance-muted mb-2">Top Genres:</div>
                        <div className="flex flex-wrap gap-2">
                          {client.topGenres.map((genre, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="genres" className="space-y-6">
              <div className="grid gap-4">
                {genreData.map((genre, index) => (
                  <Card key={index} className="border-romance-accent/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{genre.genre}</h3>
                          <div className="text-sm text-romance-muted">
                            {genre.books} books | Avg price: ${genre.avgPrice}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-romance-primary">
                            ${genre.revenue.toLocaleString()}
                          </div>
                          <div className={`text-sm flex items-center gap-1 ${getGrowthColor(genre.growth)}`}>
                            {getGrowthIcon(genre.growth)}
                            {genre.growth > 0 ? '+' : ''}{genre.growth.toFixed(1)}% growth
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Market Share</span>
                          <span>{genre.marketShare.toFixed(1)}%</span>
                        </div>
                        <Progress value={genre.marketShare} />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-romance-primary">
                            ${(genre.revenue / genre.books).toFixed(0)}
                          </div>
                          <div className="text-xs text-romance-muted">Revenue/Book</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-romance-primary">
                            {((genre.revenue / genre.avgPrice) / genre.books).toFixed(1)}
                          </div>
                          <div className="text-xs text-romance-muted">Avg Sales/Book</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-romance-primary">
                            #{index + 1}
                          </div>
                          <div className="text-xs text-romance-muted">Genre Rank</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Performing Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topClients.map((client, index) => (
                        <div key={client.clientId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-romance-primary/20 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{client.clientName}</div>
                              <div className="text-xs text-romance-muted capitalize">{client.clientType}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${client.revenue.toLocaleString()}</div>
                            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(client.growth)}`}>
                              {getGrowthIcon(client.growth)}
                              {client.growth > 0 ? '+' : ''}{client.growth.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-romance-accent/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Top Performing Genres
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topGenres.map((genre, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-romance-primary/20 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{genre.genre}</div>
                              <div className="text-xs text-romance-muted">{genre.books} books</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${genre.revenue.toLocaleString()}</div>
                            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(genre.growth)}`}>
                              {getGrowthIcon(genre.growth)}
                              {genre.growth > 0 ? '+' : ''}{genre.growth.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="border-romance-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly Growth Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueData.slice(-6).map((data, index, array) => {
                      const prevData = array[index - 1];
                      const monthGrowth = prevData ? 
                        ((data.totalRevenue - prevData.totalRevenue) / prevData.totalRevenue) * 100 : 0;
                      
                      return (
                        <div key={data.period} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="font-medium">{data.period}</div>
                            <div className="text-sm text-romance-muted">
                              Books: ${data.bookSales.toLocaleString()} | 
                              Royalties: ${data.royalties.toLocaleString()} | 
                              Subs: ${data.subscriptions.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="font-medium">${data.totalRevenue.toLocaleString()}</div>
                            {index > 0 && (
                              <div className={`flex items-center gap-1 text-sm ${getGrowthColor(monthGrowth)}`}>
                                {getGrowthIcon(monthGrowth)}
                                {monthGrowth > 0 ? '+' : ''}{monthGrowth.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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