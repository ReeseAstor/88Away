import { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  History, 
  RotateCcw, 
  Eye, 
  User, 
  Calendar,
  FileText,
  GitCommit,
  ChevronDown,
  ChevronRight,
  Diff
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Version {
  id: string;
  branchId: string;
  versionNumber: number;
  message: string;
  content: string;
  wordCount: number;
  authorId: string;
  authorName: string;
  createdAt: Date;
  parentVersionId?: string;
  changes?: {
    additions: number;
    deletions: number;
    modified: number;
  };
}

interface VersionHistoryProps {
  versions: Version[];
  currentVersionId?: string;
  onRollback: (versionId: string) => Promise<void>;
  onPreview: (versionId: string) => void;
  onCompare: (versionId1: string, versionId2: string) => void;
  userRole?: string | null;
  isLoading?: boolean;
}

export default function VersionHistory({
  versions,
  currentVersionId,
  onRollback,
  onPreview,
  onCompare,
  userRole,
  isLoading = false
}: VersionHistoryProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [rollbackVersion, setRollbackVersion] = useState<Version | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  
  const canRollback = userRole && ['owner', 'editor'].includes(userRole);

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleSelectForCompare = (versionId: string) => {
    if (selectedForCompare.includes(versionId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== versionId));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, versionId]);
    }
    
    if (selectedForCompare.length === 1 && !selectedForCompare.includes(versionId)) {
      onCompare(selectedForCompare[0], versionId);
      setSelectedForCompare([]);
      setCompareMode(false);
    }
  };

  const handleRollback = async () => {
    if (!rollbackVersion) return;
    
    try {
      await onRollback(rollbackVersion.id);
      setRollbackVersion(null);
    } catch (error) {
      // Error handling done in parent component
    }
  };

  const getChangesSummary = (changes?: Version['changes']) => {
    if (!changes) return null;
    
    const parts = [];
    if (changes.additions > 0) parts.push(`+${changes.additions}`);
    if (changes.deletions > 0) parts.push(`-${changes.deletions}`);
    if (changes.modified > 0) parts.push(`~${changes.modified}`);
    
    return parts.join(' ');
  };

  if (isLoading) {
    return (
      <Card className="p-4" data-testid="version-history">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full" data-testid="version-history">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center">
            <History className="h-4 w-4 mr-2" />
            Version History
          </h3>
          {versions.length > 1 && (
            <Button
              size="sm"
              variant={compareMode ? "default" : "outline"}
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
              data-testid="button-toggle-compare"
            >
              <Diff className="h-3 w-3 mr-1" />
              {compareMode ? 'Cancel' : 'Compare'}
            </Button>
          )}
        </div>
        {compareMode && (
          <p className="text-xs text-muted-foreground">
            Select two versions to compare
          </p>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {versions.map((version, index) => {
            const isExpanded = expandedVersions.has(version.id);
            const isCurrent = version.id === currentVersionId;
            const isSelected = selectedForCompare.includes(version.id);
            
            return (
              <div
                key={version.id}
                className={`border rounded-lg p-3 transition-colors ${
                  isCurrent ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                } ${isSelected ? 'ring-2 ring-primary' : ''} ${
                  compareMode ? 'cursor-pointer' : ''
                }`}
                onClick={() => compareMode && handleSelectForCompare(version.id)}
                data-testid={`version-item-${version.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(version.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <GitCommit className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        v{version.versionNumber}
                      </span>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">Latest</Badge>
                      )}
                    </div>
                    
                    <div className="ml-8 mt-1">
                      <p className="text-sm">{version.message}</p>
                      
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {version.authorName}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(new Date(version.createdAt), 'PPpp')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {version.wordCount} words
                        </span>
                      </div>
                      
                      {version.changes && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getChangesSummary(version.changes)}
                          </Badge>
                        </div>
                      )}
                      
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="flex items-center space-x-2">
                            {!compareMode && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(version.id);
                                  }}
                                  data-testid={`button-preview-${version.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                                {canRollback && !isCurrent && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRollbackVersion(version);
                                    }}
                                    data-testid={`button-rollback-${version.id}`}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Rollback
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {versions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No version history available</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <AlertDialog open={!!rollbackVersion} onOpenChange={() => setRollbackVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback to Version {rollbackVersion?.versionNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback to this version? This will create a new version with the content from v{rollbackVersion?.versionNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRollback}>
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}