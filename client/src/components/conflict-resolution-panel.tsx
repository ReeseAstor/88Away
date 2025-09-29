import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { 
  AlertTriangle, 
  CheckCircle,
  FileText,
  GitMerge,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Conflict {
  id: string;
  section: string;
  lineStart: number;
  lineEnd: number;
  currentContent: string;
  incomingContent: string;
  baseContent?: string;
  type: 'text' | 'structural';
}

interface ConflictResolution {
  conflictId: string;
  resolution: 'current' | 'incoming' | 'manual' | 'both';
  manualContent?: string;
}

interface ConflictResolutionPanelProps {
  conflicts: Conflict[];
  sourceBranch: string;
  targetBranch: string;
  onResolve: (resolutions: ConflictResolution[]) => Promise<void>;
  onCancel: () => void;
  userRole?: string | null;
}

export default function ConflictResolutionPanel({
  conflicts,
  sourceBranch,
  targetBranch,
  onResolve,
  onCancel,
  userRole
}: ConflictResolutionPanelProps) {
  const { toast } = useToast();
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [manualContent, setManualContent] = useState<Map<string, string>>(new Map());
  const [isResolving, setIsResolving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const currentConflict = conflicts[currentConflictIndex];
  const canResolve = userRole && ['owner', 'editor'].includes(userRole);

  const handleResolutionChange = (conflictId: string, resolution: ConflictResolution['resolution']) => {
    const newResolution: ConflictResolution = {
      conflictId,
      resolution,
      manualContent: resolution === 'manual' ? manualContent.get(conflictId) : undefined
    };
    
    const newResolutions = new Map(resolutions);
    newResolutions.set(conflictId, newResolution);
    setResolutions(newResolutions);
  };

  const handleManualContentChange = (conflictId: string, content: string) => {
    const newManualContent = new Map(manualContent);
    newManualContent.set(conflictId, content);
    setManualContent(newManualContent);
    
    if (resolutions.get(conflictId)?.resolution === 'manual') {
      handleResolutionChange(conflictId, 'manual');
    }
  };

  const handleResolveAll = async () => {
    const allResolutions = Array.from(resolutions.values());
    
    if (allResolutions.length !== conflicts.length) {
      toast({
        title: "Error",
        description: "Please resolve all conflicts before continuing",
        variant: "destructive"
      });
      return;
    }

    const hasManualResolutions = allResolutions.some(r => r.resolution === 'manual');
    if (hasManualResolutions) {
      const invalidManual = allResolutions.find(
        r => r.resolution === 'manual' && !r.manualContent?.trim()
      );
      if (invalidManual) {
        toast({
          title: "Error",
          description: "Please provide content for all manual resolutions",
          variant: "destructive"
        });
        return;
      }
    }

    setIsResolving(true);
    try {
      await onResolve(allResolutions);
      toast({
        title: "Success",
        description: "All conflicts resolved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve conflicts",
        variant: "destructive"
      });
    }
    setIsResolving(false);
  };

  const getResolutionLabel = (resolution?: ConflictResolution['resolution']) => {
    switch (resolution) {
      case 'current':
        return `Keep ${targetBranch}`;
      case 'incoming':
        return `Use ${sourceBranch}`;
      case 'manual':
        return 'Manual Edit';
      case 'both':
        return 'Keep Both';
      default:
        return 'Not Resolved';
    }
  };

  const getResolutionContent = (conflict: Conflict): string => {
    const resolution = resolutions.get(conflict.id);
    if (!resolution) return conflict.currentContent;
    
    switch (resolution.resolution) {
      case 'current':
        return conflict.currentContent;
      case 'incoming':
        return conflict.incomingContent;
      case 'manual':
        return resolution.manualContent || '';
      case 'both':
        return `${conflict.currentContent}\n\n${conflict.incomingContent}`;
      default:
        return conflict.currentContent;
    }
  };

  const resolvedCount = resolutions.size;
  const progress = (resolvedCount / conflicts.length) * 100;

  if (!canResolve) {
    return (
      <Card className="p-6" data-testid="conflict-resolution">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Permission Required</h3>
          <p className="text-muted-foreground">
            You need editor or owner permissions to resolve merge conflicts.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col" data-testid="conflict-resolution">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                Resolve Merge Conflicts
              </CardTitle>
              <CardDescription>
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} between {sourceBranch} → {targetBranch}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{resolvedCount} / {conflicts.length}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {currentConflict && (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Conflict {currentConflictIndex + 1} of {conflicts.length}
                    </Badge>
                    <Badge variant={currentConflict.type === 'structural' ? 'destructive' : 'secondary'}>
                      {currentConflict.type === 'structural' ? 'Structural' : 'Text'} Conflict
                    </Badge>
                    {resolutions.has(currentConflict.id) && (
                      <Badge variant="default" className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentConflictIndex(Math.max(0, currentConflictIndex - 1))}
                      disabled={currentConflictIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentConflictIndex(Math.min(conflicts.length - 1, currentConflictIndex + 1))}
                      disabled={currentConflictIndex === conflicts.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <FileText className="h-3 w-3 inline mr-1" />
                  {currentConflict.section} • Lines {currentConflict.lineStart}-{currentConflict.lineEnd}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 divide-x">
                <div className="flex flex-col">
                  <div className="p-3 border-b bg-muted/50">
                    <div className="font-medium text-sm flex items-center justify-between">
                      <span>{targetBranch} (Current)</span>
                      <RadioGroup
                        value={resolutions.get(currentConflict.id)?.resolution || ''}
                        onValueChange={(value) => handleResolutionChange(currentConflict.id, value as any)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="current" id="current" />
                          <Label htmlFor="current" className="text-xs cursor-pointer">Use This</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {currentConflict.currentContent}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="flex flex-col">
                  <div className="p-3 border-b bg-muted/50">
                    <div className="font-medium text-sm flex items-center justify-between">
                      <span>{sourceBranch} (Incoming)</span>
                      <RadioGroup
                        value={resolutions.get(currentConflict.id)?.resolution || ''}
                        onValueChange={(value) => handleResolutionChange(currentConflict.id, value as any)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="incoming" id="incoming" />
                          <Label htmlFor="incoming" className="text-xs cursor-pointer">Use This</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {currentConflict.incomingContent}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              <div className="p-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <RadioGroup
                      value={resolutions.get(currentConflict.id)?.resolution || ''}
                      onValueChange={(value) => handleResolutionChange(currentConflict.id, value as any)}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="cursor-pointer">Keep Both</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual" className="cursor-pointer flex items-center">
                          <Edit3 className="h-3 w-3 mr-1" />
                          Manual Edit
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {resolutions.get(currentConflict.id)?.resolution === 'manual' && (
                    <div className="space-y-2">
                      <Label>Manual Resolution</Label>
                      <Textarea
                        value={manualContent.get(currentConflict.id) || ''}
                        onChange={(e) => handleManualContentChange(currentConflict.id, e.target.value)}
                        placeholder="Enter your manual resolution..."
                        rows={5}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  {resolutions.has(currentConflict.id) && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium mb-1">
                        Resolution: {getResolutionLabel(resolutions.get(currentConflict.id)?.resolution)}
                      </div>
                      <ScrollArea className="h-24">
                        <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                          {getResolutionContent(currentConflict)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowConfirmDialog(true)}>
              Cancel
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {resolvedCount === conflicts.length && (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    All conflicts resolved
                  </span>
                )}
              </span>
              <Button
                onClick={handleResolveAll}
                disabled={resolvedCount !== conflicts.length || isResolving}
                data-testid="button-resolve-conflicts"
              >
                <GitMerge className="h-4 w-4 mr-2" />
                {isResolving ? 'Resolving...' : 'Complete Merge'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Conflict Resolution?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel? All resolution progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Resolving</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel} className="bg-destructive text-destructive-foreground">
              Cancel Resolution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}