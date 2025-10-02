import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File, Globe, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { type OnboardingProgress } from "@shared/schema";

interface ExportMenuProps {
  projectId: string;
  projectTitle: string;
  userPlan?: string;
}

export default function ExportMenu({ projectId, projectTitle, userPlan = "starter" }: ExportMenuProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  const { data: onboardingProgress } = useQuery<OnboardingProgress>({
    queryKey: ['/api/user/onboarding'],
    enabled: !!user,
    retry: false,
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: async (progress: Partial<OnboardingProgress>) => {
      await apiRequest("PATCH", "/api/user/onboarding", progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  const handleExport = async (format: string) => {
    // Check if user has access to advanced formats
    const advancedFormats = ["pdf", "epub", "docx"];
    const isProfessionalFeature = advancedFormats.includes(format);
    const hasAccess = userPlan === "professional" || userPlan === "enterprise" || userPlan === "pro";

    if (isProfessionalFeature && !hasAccess) {
      toast({
        title: "Premium Feature",
        description: `${format.toUpperCase()} export is available for Professional plan subscribers. Upgrade to access advanced export formats.`,
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const url = `/api/projects/${projectId}/export?format=${format}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = ''; // Let the server set the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Started",
        description: `Your ${format.toUpperCase()} export is being generated and will download shortly.`,
      });

      if (user && !user.hasCompletedOnboarding && onboardingProgress && !onboardingProgress.steps.tryExport) {
        updateOnboardingMutation.mutate({
          steps: { ...onboardingProgress.steps, tryExport: true }
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      format: "json",
      label: "JSON Data",
      description: "Raw project data",
      icon: <File className="h-4 w-4" />,
      isPremium: false,
    },
    {
      format: "html",
      label: "HTML Document",
      description: "Web-formatted export",
      icon: <Globe className="h-4 w-4" />,
      isPremium: false,
    },
    {
      format: "pdf",
      label: "PDF Document",
      description: "Professional print format",
      icon: <FileText className="h-4 w-4" />,
      isPremium: true,
    },
    {
      format: "docx",
      label: "Word Document",
      description: "Microsoft Word format",
      icon: <FileText className="h-4 w-4" />,
      isPremium: true,
    },
    {
      format: "epub",
      label: "ePub eBook",
      description: "Digital publishing format",
      icon: <FileText className="h-4 w-4" />,
      isPremium: true,
    },
  ];

  const hasAccess = userPlan === "professional" || userPlan === "enterprise" || userPlan === "pro";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isExporting}
          data-testid="button-export-menu"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Formats</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {exportOptions.filter(option => !option.isPremium).map((option) => (
          <DropdownMenuItem
            key={option.format}
            onClick={() => handleExport(option.format)}
            className="cursor-pointer"
            data-testid={`export-${option.format}`}
          >
            <div className="flex items-center space-x-3">
              {option.icon}
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          <span>Professional Formats</span>
        </DropdownMenuLabel>
        
        {exportOptions.filter(option => option.isPremium).map((option) => (
          <DropdownMenuItem
            key={option.format}
            onClick={() => handleExport(option.format)}
            className={`cursor-pointer ${!hasAccess ? 'opacity-50' : ''}`}
            data-testid={`export-${option.format}`}
          >
            <div className="flex items-center space-x-3">
              {option.icon}
              <div className="flex-1">
                <div className="font-medium flex items-center space-x-2">
                  <span>{option.label}</span>
                  {!hasAccess && <Crown className="h-3 w-3 text-yellow-500" />}
                </div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}