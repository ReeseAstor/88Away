import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  Zap, 
  FileText, 
  Users,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  BarChart3
} from "lucide-react";
import { Project, AiGeneration } from "@shared/schema";

interface SubscriptionData {
  plan: string;
  status: string;
  aiSessionsUsed: number;
  aiSessionsLimit: number;
  projectsUsed: number;
  projectsLimit: number;
  collaboratorsUsed: number;
  collaboratorsLimit: number;
  nextBilling: string;
  amount: string;
}

export default function Subscription() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: aiGenerations = [] } = useQuery<AiGeneration[]>({
    queryKey: ['/api/ai/history'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch real subscription data from API
  const { data: subscriptionInfo } = useQuery({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Calculate subscription data from real API data
  const subscriptionData: SubscriptionData = {
    plan: subscriptionInfo?.plan?.name || "Free Plan",
    status: subscriptionInfo?.subscription?.status || "active",
    aiSessionsUsed: subscriptionInfo?.usage?.aiSessions || aiGenerations.length || 0,
    aiSessionsLimit: subscriptionInfo?.plan?.features?.aiSessionsLimit === -1 ? 999999 : (subscriptionInfo?.plan?.features?.aiSessionsLimit || 10),
    projectsUsed: subscriptionInfo?.usage?.projects || projects.length || 0,
    projectsLimit: subscriptionInfo?.plan?.features?.projectsLimit === -1 ? 999999 : (subscriptionInfo?.plan?.features?.projectsLimit || 1),
    collaboratorsUsed: 0, // TODO: Calculate from actual data
    collaboratorsLimit: subscriptionInfo?.plan?.features?.collaboratorsLimit === -1 ? 999999 : (subscriptionInfo?.plan?.features?.collaboratorsLimit || 0),
    nextBilling: subscriptionInfo?.subscription?.current_period_end 
      ? new Date(subscriptionInfo.subscription.current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    amount: subscriptionInfo?.plan?.amount 
      ? `$${(subscriptionInfo.plan.amount / 100).toFixed(2)}`
      : "$0.00"
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return { icon: CheckCircle, color: "text-chart-1", bg: "bg-chart-1/10", label: "Active" };
      case "past_due":
        return { icon: AlertCircle, color: "text-chart-2", bg: "bg-chart-2/10", label: "Past Due" };
      case "canceled":
        return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Canceled" };
      default:
        return { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/10", label: "Unknown" };
    }
  };

  const statusInfo = getStatusInfo(subscriptionData.status);
  const StatusIcon = statusInfo.icon;

  const usageMetrics = [
    {
      title: "AI Sessions",
      used: subscriptionData.aiSessionsUsed,
      limit: subscriptionData.aiSessionsLimit,
      icon: Zap,
      color: "text-chart-2"
    },
    {
      title: "Active Projects",
      used: subscriptionData.projectsUsed,
      limit: subscriptionData.projectsLimit,
      icon: FileText,
      color: "text-accent"
    },
    {
      title: "Team Members",
      used: subscriptionData.collaboratorsUsed,
      limit: subscriptionData.collaboratorsLimit,
      icon: Users,
      color: "text-chart-1"
    }
  ];

  const billingHistory = [
    {
      date: "2024-11-15",
      amount: "$29.00",
      status: "paid",
      description: "Pro Plan - Monthly"
    },
    {
      date: "2024-10-15",
      amount: "$29.00",
      status: "paid",
      description: "Pro Plan - Monthly"
    },
    {
      date: "2024-09-15",
      amount: "$29.00",
      status: "paid",
      description: "Pro Plan - Monthly"
    }
  ];

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      
      if (!response.ok) throw new Error('Failed to create portal session');
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpgradePlan = async () => {
    try {
      // Redirect to billing portal for plan changes
      await handleManageBilling();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate upgrade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = (date: string) => {
    toast({
      title: "Downloading Invoice",
      description: `Invoice for ${date} will be downloaded.`,
    });
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath="/subscription"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-subscription-title">
                Subscription & Billing
              </h1>
            </div>
            
            <Button 
              onClick={handleManageBilling}
              data-testid="button-manage-billing"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          </div>
        </header>

        {/* Subscription Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Plan & Usage */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Current Plan */}
              <Card data-testid="card-current-plan">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                        <Crown className="h-6 w-6 text-chart-1" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{subscriptionData.plan}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{subscriptionData.amount}/month</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" onClick={handleUpgradePlan} data-testid="button-upgrade-plan">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {usageMetrics.map((metric) => {
                      const percentage = (metric.used / metric.limit) * 100;
                      const MetricIcon = metric.icon;
                      
                      return (
                        <div key={metric.title} className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <MetricIcon className={`h-4 w-4 ${metric.color}`} />
                            <span className="text-sm font-medium text-card-foreground">{metric.title}</span>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">{metric.used} used</span>
                              <span className="text-muted-foreground">{metric.limit} limit</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-card-foreground mb-1">
                        {new Date(subscriptionData.nextBilling).toLocaleDateString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Next Billing Date</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-card-foreground mb-1">{subscriptionData.amount}</div>
                      <p className="text-sm text-muted-foreground">Monthly Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Usage Analytics */}
              <Card data-testid="card-usage-analytics">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Usage Analytics</span>
                  </CardTitle>
                  <CardDescription>Your usage patterns over the last 30 days</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <div className="text-3xl font-bold text-accent mb-2">
                        {subscriptionData.aiSessionsUsed}
                      </div>
                      <p className="text-sm text-muted-foreground">AI Sessions This Month</p>
                      <div className="flex items-center justify-center mt-2 text-xs text-chart-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +15% from last month
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-chart-1/5 rounded-lg">
                      <div className="text-3xl font-bold text-chart-1 mb-2">
                        {projects.reduce((total, project) => total + (project.currentWordCount || 0), 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Words Written</p>
                      <div className="flex items-center justify-center mt-2 text-xs text-chart-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +23% from last month
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-chart-2/5 rounded-lg">
                      <div className="text-3xl font-bold text-chart-2 mb-2">
                        {subscriptionData.collaboratorsUsed}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Collaborators</p>
                      <div className="flex items-center justify-center mt-2 text-xs text-chart-1">
                        <Activity className="h-3 w-3 mr-1" />
                        5 active today
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Billing History & Features */}
            <div className="space-y-8">
              
              {/* Plan Features */}
              <Card data-testid="card-plan-features">
                <CardHeader>
                  <CardTitle>Plan Features</CardTitle>
                  <CardDescription>What's included in your Pro Plan</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span className="text-sm">100 AI sessions per month</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span className="text-sm">Up to 5 active projects</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span className="text-sm">Team collaboration (15 members)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span className="text-sm">Advanced export formats</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span className="text-sm">Version history</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Billing History */}
              <Card data-testid="card-billing-history">
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>Your recent payments and invoices</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {billingHistory.map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{invoice.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(invoice.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={invoice.status === "paid" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {invoice.status}
                          </Badge>
                          <span className="text-sm font-medium">{invoice.amount}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.date)}
                            data-testid={`button-download-${index}`}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={handleManageBilling}
                    data-testid="button-view-all-invoices"
                  >
                    View All Invoices
                  </Button>
                </CardContent>
              </Card>
              
              {/* Payment Method */}
              <Card data-testid="card-payment-method">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">•••• •••• •••• 4242</div>
                      <div className="text-xs text-muted-foreground">Expires 12/2025</div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={handleManageBilling}
                    data-testid="button-update-payment"
                  >
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
