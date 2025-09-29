import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import type { DocumentComment as Comment } from '@shared/schema';

// Hook to fetch document comments
export function useDocumentComments(documentId: string | null) {
  return useQuery<Comment[]>({
    queryKey: ['/api/documents', documentId, 'comments'],
    enabled: !!documentId,
  });
}

// Hook to create a new comment
export function useCreateComment(documentId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      range?: { start: number; end: number };
      parentId?: string;
    }) => {
      return apiRequest('POST', `/api/documents/${documentId}/comments`, data);
    },
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', documentId, 'comments'] 
      });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to update a comment
export function useUpdateComment(documentId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      content 
    }: { 
      commentId: string; 
      content: string;
    }) => {
      return apiRequest('PATCH', `/api/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', documentId, 'comments'] 
      });
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to delete a comment
export function useDeleteComment(documentId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest('DELETE', `/api/comments/${commentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', documentId, 'comments'] 
      });
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to resolve/unresolve a comment
export function useResolveComment(documentId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      resolved 
    }: { 
      commentId: string; 
      resolved: boolean;
    }) => {
      return apiRequest('PATCH', `/api/comments/${commentId}/resolve`, { resolved });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', documentId, 'comments'] 
      });
      toast({
        title: variables.resolved ? "Comment resolved" : "Comment reopened",
        description: variables.resolved 
          ? "The comment has been marked as resolved."
          : "The comment has been reopened.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update comment status. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to listen for real-time comment updates
export function useCommentSubscription(documentId: string | null, enabled: boolean = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!documentId || !enabled) return;

    const handleCommentUpdate = (event: CustomEvent) => {
      const { type, comment } = event.detail;
      
      // Invalidate comments query to refetch latest data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', documentId, 'comments'] 
      });
    };

    window.addEventListener('collaboration-comment' as any, handleCommentUpdate);

    return () => {
      window.removeEventListener('collaboration-comment' as any, handleCommentUpdate);
    };
  }, [documentId, enabled, queryClient]);
}