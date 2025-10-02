import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Brain, 
  Clock, 
  Target,
  Calendar,
  Activity,
  FileText,
  PenTool,
  ArrowLeft,
  Crown,
  Zap,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface ProjectAnalytics {
  overview: {
    totalProjects: number;
    totalDocuments: number;
    totalWordCount: number;
    totalCharacters: number;
    totalWorldbuildingEntries: number;
    totalTimelineEvents: number;
    aiGenerationsCount: number;
  };
  writingProgress: {
    daily: Array<{ date: string; words: number; sessions: number }>;
    weekly: Array<{ week: string; words: number; sessions: number }>;
    monthly: Array<{ month: string; words: number; sessions: number }>;
  };
  aiUsage: {
    totalGenerations: number;
    byPersona: Array<{ persona: string; count: number }>;
    recent: Array<{
      id: string;
      persona: string;
      prompt: string;
      createdAt: string;
      metadata?: any;
    }>;
    tokenUsageOverTime?: Array<{ date: string; tokens: number; cost: number }>;
    totalTokensUsed?: number;
    estimatedCost?: number;
  };
  collaboration: {
    totalCollaborators: number;
    activeCollaborators: number;
    recentActivity: Array<{
      id: string;
      userName: string;
      action: string;
      entityType: string;
      createdAt: string;
    }>;
  };
  productivity: {
    averageSessionDuration: number;
    totalWritingTime: number;
    mostProductiveHour: number;
    consistencyScore: number;
  };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const personaIcons = {
  muse: '✨',
  editor: '✏️',
  coach: '🎯'
};

export default function AnalyticsPage() {
  const { id: projectId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: analytics, isLoading, error } = useQuery<ProjectAnalytics>({
    queryKey: ['/api/projects', projectId, 'analytics'],
    enabled: !!projectId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Analytics Unavailable
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Unable to load analytics data. Please try again or ensure you have access to this project.
            </p>
            <Button onClick={() => setLocation('/')} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPremium = user?.subscriptionPlan === 'professional' || user?.subscriptionPlan === 'enterprise';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/projects/${projectId}`)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              data-testid="button-back-project"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Project Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Comprehensive insights into your writing progress and collaboration
              </p>
            </div>
          </div>
          {!isPremium && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Premium Feature
            </Badge>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Words
              </CardTitle>
              <PenTool className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.overview.totalWordCount.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Across {analytics.overview.totalDocuments} documents
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                AI Generations
              </CardTitle>
              <Brain className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.aiUsage.totalGenerations}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                AI-powered assistance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Collaborators
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.collaboration.totalCollaborators}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {analytics.collaboration.activeCollaborators} active this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Consistency
              </CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {analytics.productivity.consistencyScore}%
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Writing days this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <TabsTrigger value="progress" className="flex items-center gap-2" data-testid="tab-progress">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2" data-testid="tab-ai">
              <Brain className="h-4 w-4" />
              AI Usage
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2" data-testid="tab-collaboration">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2" data-testid="tab-productivity">
              <Clock className="h-4 w-4" />
              Productivity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            {/* Writing Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Daily Writing Progress
                  </CardTitle>
                  <CardDescription>
                    Words written per day over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.writingProgress.daily}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="words" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Weekly Overview
                  </CardTitle>
                  <CardDescription>
                    Writing sessions and word count by week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.writingProgress.weekly}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="week" 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="words" fill="#10b981" />
                      <Bar dataKey="sessions" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            {/* Token Usage & Cost Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-purple-200 dark:border-purple-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Tokens Used
                  </CardTitle>
                  <Zap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-total-tokens">
                    {analytics.aiUsage.totalTokensUsed?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Across all AI generations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Estimated Cost
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-estimated-cost">
                    ${(analytics.aiUsage.estimatedCost || 0).toFixed(3)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Based on current token usage
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Usage Over Time */}
              {analytics.aiUsage.tokenUsageOverTime && analytics.aiUsage.tokenUsageOverTime.length > 0 && (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-blue-600" />
                      Token Usage Trend
                    </CardTitle>
                    <CardDescription>
                      Daily token consumption over the last 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.aiUsage.tokenUsageOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="tokens" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* AI Usage by Persona */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Persona Usage
                  </CardTitle>
                  <CardDescription>
                    Which AI assistants you use most
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.aiUsage.byPersona}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="persona"
                      >
                        {analytics.aiUsage.byPersona.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    {analytics.aiUsage.byPersona.map((entry, index) => (
                      <div key={entry.persona} className="flex items-center gap-2" data-testid={`persona-${entry.persona}`}>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm capitalize">{entry.persona}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent AI Generations */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Recent AI Activity
                  </CardTitle>
                  <CardDescription>
                    Latest AI-generated content with token usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {analytics.aiUsage.recent.map((generation) => {
                        const tokens = generation.metadata?.tokens_in + generation.metadata?.tokens_out || 0;
                        const cost = (tokens / 1000) * 0.002;
                        
                        return (
                          <div key={generation.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" data-testid={`generation-${generation.id}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {personaIcons[generation.persona as keyof typeof personaIcons]}
                                </span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {generation.persona}
                                </Badge>
                                {tokens > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {tokens.toLocaleString()} tokens
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(generation.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {generation.prompt}
                            </p>
                            {cost > 0 && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ~${cost.toFixed(4)} cost
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Cost Analysis */}
              {analytics.aiUsage.tokenUsageOverTime && analytics.aiUsage.tokenUsageOverTime.length > 0 && (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Cost Analysis
                    </CardTitle>
                    <CardDescription>
                      Estimated daily AI costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.aiUsage.tokenUsageOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => `$${value.toFixed(4)}`}
                        />
                        <Bar dataKey="cost" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        * Estimated at $0.002 per 1K tokens (GPT-4 avg)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="collaboration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Activity */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Team Activity
                  </CardTitle>
                  <CardDescription>
                    Recent collaborative actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {analytics.collaboration.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {activity.userName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {activity.action} {activity.entityType}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Collaboration Stats */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Collaboration Metrics
                  </CardTitle>
                  <CardDescription>
                    Team engagement statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Active Collaborators</span>
                      <span className="text-sm text-slate-600">
                        {analytics.collaboration.activeCollaborators} / {analytics.collaboration.totalCollaborators}
                      </span>
                    </div>
                    <Progress 
                      value={analytics.collaboration.totalCollaborators ? 
                        (analytics.collaboration.activeCollaborators / analytics.collaboration.totalCollaborators) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {analytics.collaboration.totalCollaborators}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Total Team</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.collaboration.activeCollaborators}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Productivity Metrics */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Writing Sessions
                  </CardTitle>
                  <CardDescription>
                    Your writing productivity patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {analytics.productivity.averageSessionDuration}m
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Avg Session</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {Math.round(analytics.productivity.totalWritingTime / 60)}h
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Total Time</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Consistency Score</span>
                      <span className="text-sm text-slate-600">
                        {analytics.productivity.consistencyScore}%
                      </span>
                    </div>
                    <Progress value={analytics.productivity.consistencyScore} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1">
                      Based on writing activity over the last 30 days
                    </p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Most Productive Hour
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.productivity.mostProductiveHour}:00
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Peak writing time
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Towards Goals */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-600" />
                    Progress Overview
                  </CardTitle>
                  <CardDescription>
                    Project milestones and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.overview.totalDocuments}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Documents</div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.overview.totalCharacters}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Characters</div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.overview.totalWorldbuildingEntries}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">World</div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.overview.totalTimelineEvents}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Timeline</div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {analytics.overview.totalWordCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Total words written
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}