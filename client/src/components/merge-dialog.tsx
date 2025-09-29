import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  GitMerge, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  FileText,
  Plus,
  Minus,
  GitBranch,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  id: string;
  name: string;
  description?: string;
  lastCommitMessage?: string;
  updatedAt: Date;
}

interface MergePreview {
  hasConflicts: boolean;
  conflicts: Array<{
    line: number;
    content: string;
    type: 'current' | 'incoming';
  }>;
  changes: {
    additions: number;
    deletions: number;
    modified: number;
  };
  affectedSections: string[];
}

interface MergeDialogProps {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  currentBranch: Branch | null;
  onMerge: (sourceBranchId: string, targetBranchId: string, strategy?: 'merge' | 'overwrite') => Promise<void>;
  onPreviewMerge?: (sourceBranchId: string, targetBranchId: string) => Promise<MergePreview>;
  userRole?: string | null;
}

export default function MergeDialog({
  open,
  onClose,
  branches,
  currentBranch,
  onMerge,
  onPreviewMerge,
  userRole
}: MergeDialogProps) {
  const { toast } = useToast();
  const [sourceBranch, setSourceBranch] = useState<string>('');
  const [targetBranch, setTargetBranch] = useState<string>(currentBranch?.id || '');
  const [mergeStrategy, setMergeStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<MergePreview | null>(null);

  const canMerge = userRole && ['owner', 'editor'].includes(userRole);

  const handlePreview = async () => {
    if (!sourceBranch || !targetBranch || !onPreviewMerge) return;

    setIsPreviewing(true);
    try {
      const result = await onPreviewMerge(sourceBranch, targetBranch);
      setPreview(result);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview merge",
        variant: "destructive"
      });
    }
    setIsPreviewing(false);
  };

  const handleMerge = async () => {
    if (!sourceBranch || !targetBranch) {
      toast({
        title: "Error",
        description: "Please select both source and target branches",
        variant: "destructive"
      });
      return;
    }

    if (sourceBranch === targetBranch) {
      toast({
        title: "Error",
        description: "Source and target branches must be different",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await onMerge(sourceBranch, targetBranch, mergeStrategy);
      toast({
        title: "Success",
        description: "Branches merged successfully"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to merge branches",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getSourceBranch = () => branches.find(b => b.id === sourceBranch);
  const getTargetBranch = () => branches.find(b => b.id === targetBranch);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="merge-dialog">
        <DialogHeader>
          <DialogTitle>Merge Branches</DialogTitle>
          <DialogDescription>
            Merge changes from one branch into another
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="source-branch">Source Branch</Label>
              <Select
                value={sourceBranch}
                onValueChange={setSourceBranch}
                disabled={!canMerge}
              >
                <SelectTrigger id="source-branch" data-testid="select-source-branch">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter(b => b.id !== targetBranch)
                    .map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center space-x-2">
                          <GitBranch className="h-3 w-3" />
                          <span>{branch.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {getSourceBranch()?.description && (
                <p className="text-xs text-muted-foreground">
                  {getSourceBranch()?.description}
                </p>
              )}
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground mb-2" />

            <div className="space-y-2">
              <Label htmlFor="target-branch">Target Branch</Label>
              <Select
                value={targetBranch}
                onValueChange={setTargetBranch}
                disabled={!canMerge}
              >
                <SelectTrigger id="target-branch" data-testid="select-target-branch">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter(b => b.id !== sourceBranch)
                    .map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center space-x-2">
                          <GitBranch className="h-3 w-3" />
                          <span>{branch.name}</span>
                          {branch.id === currentBranch?.id && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {getTargetBranch()?.description && (
                <p className="text-xs text-muted-foreground">
                  {getTargetBranch()?.description}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merge-strategy">Merge Strategy</Label>
            <Select
              value={mergeStrategy}
              onValueChange={(value) => setMergeStrategy(value as 'merge' | 'overwrite')}
              disabled={!canMerge}
            >
              <SelectTrigger id="merge-strategy" data-testid="select-merge-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">
                  <div className="space-y-1">
                    <div className="font-medium">Merge</div>
                    <div className="text-xs text-muted-foreground">
                      Combine changes from both branches
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="overwrite">
                  <div className="space-y-1">
                    <div className="font-medium">Overwrite</div>
                    <div className="text-xs text-muted-foreground">
                      Replace target with source content
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {onPreviewMerge && sourceBranch && targetBranch && (
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={isPreviewing || !canMerge}
              className="w-full"
              data-testid="button-preview-merge"
            >
              {isPreviewing ? 'Analyzing...' : 'Preview Changes'}
            </Button>
          )}

          {preview && (
            <div className="space-y-3">
              <Separator />
              
              {preview.hasConflicts ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Merge Conflicts Detected</AlertTitle>
                  <AlertDescription>
                    {preview.conflicts.length} conflict{preview.conflicts.length > 1 ? 's' : ''} found. 
                    You will need to resolve these conflicts after merging.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>No Conflicts</AlertTitle>
                  <AlertDescription>
                    These branches can be merged automatically without conflicts.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Plus className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-green-600">
                    {preview.changes.additions}
                  </div>
                  <div className="text-xs text-muted-foreground">Additions</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <Minus className="h-4 w-4 text-red-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-600">
                    {preview.changes.deletions}
                  </div>
                  <div className="text-xs text-muted-foreground">Deletions</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <FileText className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {preview.changes.modified}
                  </div>
                  <div className="text-xs text-muted-foreground">Modified</div>
                </div>
              </div>

              {preview.affectedSections.length > 0 && (
                <div className="space-y-2">
                  <Label>Affected Sections</Label>
                  <ScrollArea className="h-24 border rounded-lg p-2">
                    <div className="space-y-1">
                      {preview.affectedSections.map((section, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {section}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {!canMerge && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to merge branches. Only owners and editors can perform merges.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!sourceBranch || !targetBranch || isLoading || !canMerge}
            data-testid="button-merge-submit"
          >
            <GitMerge className="h-4 w-4 mr-2" />
            {isLoading ? 'Merging...' : 'Merge Branches'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}