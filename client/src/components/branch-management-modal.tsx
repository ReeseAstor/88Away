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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GitBranch, Trash2, Edit, Shield, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  id: string;
  name: string;
  description?: string;
  parentBranchId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isDefault?: boolean;
  isProtected?: boolean;
  commitCount?: number;
}

interface BranchManagementModalProps {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  currentBranchId: string | null;
  onCreateBranch: (data: { name: string; description?: string; parentBranchId?: string }) => Promise<void>;
  onUpdateBranch: (branchId: string, data: { name?: string; description?: string }) => Promise<void>;
  onDeleteBranch: (branchId: string) => Promise<void>;
  userRole?: string | null;
}

export default function BranchManagementModal({
  open,
  onClose,
  branches,
  currentBranchId,
  onCreateBranch,
  onUpdateBranch,
  onDeleteBranch,
  userRole
}: BranchManagementModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deleteConfirmBranch, setDeleteConfirmBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentBranchId: ''
  });

  const canManageBranches = userRole && ['owner', 'editor'].includes(userRole);

  const handleCreateBranch = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Branch name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await onCreateBranch({
        name: formData.name,
        description: formData.description || undefined,
        parentBranchId: formData.parentBranchId || undefined
      });
      setMode('list');
      setFormData({ name: '', description: '', parentBranchId: '' });
      toast({
        title: "Success",
        description: `Branch "${formData.name}" created successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create branch",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleUpdateBranch = async () => {
    if (!selectedBranch) return;

    setIsLoading(true);
    try {
      await onUpdateBranch(selectedBranch.id, {
        name: formData.name || undefined,
        description: formData.description || undefined
      });
      setMode('list');
      setSelectedBranch(null);
      setFormData({ name: '', description: '', parentBranchId: '' });
      toast({
        title: "Success",
        description: "Branch updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update branch",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleDeleteBranch = async (branch: Branch) => {
    setIsLoading(true);
    try {
      await onDeleteBranch(branch.id);
      setDeleteConfirmBranch(null);
      toast({
        title: "Success",
        description: `Branch "${branch.name}" deleted successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getBranchHierarchy = (branchId: string, level = 0): string => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return '';
    
    if (branch.parentBranchId) {
      const parentPath = getBranchHierarchy(branch.parentBranchId, level + 1);
      return parentPath ? `${parentPath} → ${branch.name}` : branch.name;
    }
    
    return branch.name;
  };

  return (
    <>
      <Dialog open={open && mode !== 'list'} onOpenChange={(open) => !open && setMode('list')}>
        <DialogContent data-testid="branch-management-modal">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create New Branch' : 'Edit Branch'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Create a new branch from an existing branch'
                : 'Update branch details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="feature/new-chapter"
                data-testid="input-branch-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="branch-description">Description (Optional)</Label>
              <Textarea
                id="branch-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this branch..."
                rows={3}
                data-testid="input-branch-description"
              />
            </div>
            
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="parent-branch">Parent Branch</Label>
                <Select
                  value={formData.parentBranchId}
                  onValueChange={(value) => setFormData({ ...formData, parentBranchId: value })}
                >
                  <SelectTrigger data-testid="select-parent-branch">
                    <SelectValue placeholder="Select parent branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.isDefault && (
                          <Badge variant="outline" className="ml-2 text-xs">Default</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode('list')}>
              Cancel
            </Button>
            <Button
              onClick={mode === 'create' ? handleCreateBranch : handleUpdateBranch}
              disabled={isLoading || !formData.name.trim()}
              data-testid={mode === 'create' ? 'button-create-branch-submit' : 'button-update-branch-submit'}
            >
              {isLoading ? 'Processing...' : mode === 'create' ? 'Create Branch' : 'Update Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open && mode === 'list'} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl" data-testid="branch-list-modal">
          <DialogHeader>
            <DialogTitle>Branch Management</DialogTitle>
            <DialogDescription>
              Manage branches for this document
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {canManageBranches && (
              <Button
                onClick={() => {
                  setFormData({ name: '', description: '', parentBranchId: currentBranchId || '' });
                  setMode('create');
                }}
                className="w-full mb-4"
                data-testid="button-new-branch"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Create New Branch
              </Button>
            )}
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`branch-list-item-${branch.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{branch.name}</span>
                          {branch.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {branch.isProtected && (
                            <Badge variant="outline">
                              <Shield className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                          {branch.id === currentBranchId && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        
                        {branch.parentBranchId && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1 ml-6">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Branched from: {getBranchHierarchy(branch.parentBranchId)}
                          </div>
                        )}
                        
                        {branch.description && (
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            {branch.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2 ml-6">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(branch.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span>{branch.createdBy}</span>
                          {branch.commitCount && (
                            <span>{branch.commitCount} commits</span>
                          )}
                        </div>
                      </div>
                      
                      {canManageBranches && !branch.isDefault && !branch.isProtected && (
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBranch(branch);
                              setFormData({
                                name: branch.name,
                                description: branch.description || '',
                                parentBranchId: branch.parentBranchId || ''
                              });
                              setMode('edit');
                            }}
                            data-testid={`button-edit-branch-${branch.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmBranch(branch)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-branch-${branch.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {branches.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No branches created yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmBranch} onOpenChange={() => setDeleteConfirmBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the branch "{deleteConfirmBranch?.name}"? 
              This action cannot be undone and will delete all versions in this branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmBranch && handleDeleteBranch(deleteConfirmBranch)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}