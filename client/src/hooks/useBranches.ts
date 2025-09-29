import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

// Types
interface Branch {
  id: string;
  documentId: string;
  name: string;
  description?: string;
  parentBranchId?: string;
  isDefault: boolean;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastCommitMessage?: string;
  commitCount?: number;
}

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

interface MergeEvent {
  id: string;
  documentId: string;
  sourceBranchId: string;
  targetBranchId: string;
  status: 'pending' | 'completed' | 'conflict' | 'failed';
  conflictCount: number;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  resolutionStrategy?: 'merge' | 'overwrite';
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

// Hook to fetch branches for a document
export function useBranches(documentId: string | null) {
  return useQuery<Branch[]>({
    queryKey: ['/api/documents', documentId, 'branches'],
    enabled: !!documentId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

// Hook to create a new branch
export function useCreateBranch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentDocumentId } = useStore();

  return useMutation({
    mutationFn: async (data: {
      documentId: string;
      name: string;
      description?: string;
      parentBranchId?: string;
    }) => {
      return apiRequest("POST", `/api/documents/${data.documentId}/branches`, {
        name: data.name,
        description: data.description,
        parentBranchId: data.parentBranchId,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', variables.documentId, 'branches'] 
      });
      toast({
        title: "Branch Created",
        description: `Branch "${variables.name}" has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create branch. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to switch to a different branch
export function useSwitchBranch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setCurrentBranch } = useStore();

  return useMutation({
    mutationFn: async ({ documentId, branchId }: {
      documentId: string;
      branchId: string;
    }) => {
      // First, get the latest version from the branch
      const response = await apiRequest("GET", `/api/branches/${branchId}/latest-version`);
      const latestVersion = await response.json();
      
      // Update the document content with the branch's latest version
      await apiRequest("PUT", `/api/documents/${documentId}`, {
        currentBranchId: branchId,
        content: latestVersion.content,
      });
      
      return latestVersion;
    },
    onSuccess: (data, variables) => {
      setCurrentBranch(variables.branchId);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', variables.documentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/branches', variables.branchId, 'versions'] 
      });
      
      toast({
        title: "Branch Switched",
        description: "Successfully switched to the selected branch.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch branch. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to fetch versions for a branch
export function useBranchVersions(branchId: string | null) {
  return useQuery<Version[]>({
    queryKey: ['/api/branches', branchId, 'versions'],
    enabled: !!branchId,
    staleTime: 30000,
  });
}

// Hook to rollback to a specific version
export function useRollback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ versionId, branchId }: {
      versionId: string;
      branchId: string;
    }) => {
      return apiRequest("POST", `/api/versions/${versionId}/rollback`);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/branches', variables.branchId, 'versions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents'] 
      });
      
      toast({
        title: "Rollback Successful",
        description: "The document has been rolled back to the selected version.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to rollback to the selected version.",
        variant: "destructive",
      });
    },
  });
}

// Hook to merge branches
export function useMergeBranches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      documentId,
      sourceBranchId, 
      targetBranchId,
      strategy = 'merge'
    }: {
      documentId: string;
      sourceBranchId: string;
      targetBranchId: string;
      strategy?: 'merge' | 'overwrite';
    }) => {
      const response = await apiRequest("POST", `/api/documents/${documentId}/merge`, {
        sourceBranchId,
        targetBranchId,
        strategy,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', variables.documentId, 'branches'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/branches'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', variables.documentId, 'merge-events'] 
      });
      
      if (data.hasConflicts) {
        toast({
          title: "Merge Has Conflicts",
          description: `${data.conflictCount} conflict(s) need to be resolved.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Merge Successful",
          description: "Branches have been merged successfully.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to merge branches. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to fetch merge events
export function useMergeEvents(documentId: string | null) {
  return useQuery<MergeEvent[]>({
    queryKey: ['/api/documents', documentId, 'merge-events'],
    enabled: !!documentId,
    staleTime: 60000, // Consider data fresh for 1 minute
  });
}

// Hook to preview a merge (check for conflicts)
export function useMergePreview() {
  return useMutation({
    mutationFn: async ({ 
      documentId,
      sourceBranchId, 
      targetBranchId 
    }: {
      documentId: string;
      sourceBranchId: string;
      targetBranchId: string;
    }): Promise<MergePreview> => {
      const response = await apiRequest("POST", `/api/documents/${documentId}/merge-preview`, {
        sourceBranchId,
        targetBranchId,
      });
      return await response.json();
    },
  });
}

// Hook to update a branch
export function useUpdateBranch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      branchId,
      data
    }: {
      branchId: string;
      data: {
        name?: string;
        description?: string;
        isProtected?: boolean;
      };
    }) => {
      return apiRequest("PATCH", `/api/branches/${branchId}`, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/branches'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents'] 
      });
      
      toast({
        title: "Branch Updated",
        description: "Branch has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update branch.",
        variant: "destructive",
      });
    },
  });
}

// Hook to delete a branch
export function useDeleteBranch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (branchId: string) => {
      return apiRequest("DELETE", `/api/branches/${branchId}`);
    },
    onSuccess: (data, branchId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/branches'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents'] 
      });
      
      toast({
        title: "Branch Deleted",
        description: "Branch has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete branch. It may be protected or have dependent data.",
        variant: "destructive",
      });
    },
  });
}

// Hook to resolve merge conflicts
export function useResolveMergeConflicts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      mergeEventId,
      resolutions 
    }: {
      mergeEventId: string;
      resolutions: Array<{
        conflictId: string;
        resolution: 'current' | 'incoming' | 'manual' | 'both';
        manualContent?: string;
      }>;
    }) => {
      return apiRequest("POST", `/api/merge-events/${mergeEventId}/resolve`, {
        resolutions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/branches'] 
      });
      
      toast({
        title: "Conflicts Resolved",
        description: "All conflicts have been resolved and the merge is complete.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve conflicts. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to create a version/commit
export function useCreateVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      branchId,
      content,
      message 
    }: {
      branchId: string;
      content: string;
      message: string;
    }) => {
      return apiRequest("POST", `/api/branches/${branchId}/versions`, {
        content,
        message,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/branches', variables.branchId, 'versions'] 
      });
      
      toast({
        title: "Version Created",
        description: "A new version has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create version.",
        variant: "destructive",
      });
    },
  });
}