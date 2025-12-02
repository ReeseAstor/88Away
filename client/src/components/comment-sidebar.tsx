import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  X, 
  Plus,
  CheckCircle,
  Clock,
  Reply,
  MoreVertical,
  Edit,
  Trash
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import CommentThread from './comment-thread';
import AddCommentDialog from './add-comment-dialog';
import type { DocumentComment as Comment, User } from '@shared/schema';

interface CommentSidebarProps {
  documentId: string;
  comments: Comment[];
  currentUser: User | null;
  userRole?: 'owner' | 'editor' | 'reviewer' | 'reader' | null;
  onClose?: () => void;
  onAddComment: (content: string, range?: { start: number; end: number }) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onResolveComment: (commentId: string) => void;
  onReplyToComment: (commentId: string, content: string) => void;
}

export default function CommentSidebar({
  documentId,
  comments,
  currentUser,
  userRole,
  onClose,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onResolveComment,
  onReplyToComment,
}: CommentSidebarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  
  // Filter comments based on selected filter
  const filteredComments = comments.filter((comment) => {
    if (filter === 'all') return true;
    if (filter === 'open') return !comment.resolved;
    if (filter === 'resolved') return comment.resolved;
    return true;
  });

  // Group comments by thread (parent comments and their replies)
  type CommentWithAuthor = Comment & {
    author?: User | null;
    parentId?: string | null;
  };
  
  const commentThreads = filteredComments.reduce((threads, comment) => {
    const commentWithAuthor = comment as CommentWithAuthor;
    if (!commentWithAuthor.parentId) {
      threads[commentWithAuthor.id] = {
        parent: commentWithAuthor,
        replies: filteredComments.filter(c => (c as CommentWithAuthor).parentId === commentWithAuthor.id) as CommentWithAuthor[]
      };
    }
    return threads;
  }, {} as Record<string, { parent: CommentWithAuthor; replies: CommentWithAuthor[] }>);

  const canComment = userRole && userRole !== 'reader';

  return (
    <div className="h-full flex flex-col bg-background border-l border-border" data-testid="comment-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">Comments</h3>
            <Badge variant="secondary">{comments.length}</Badge>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-comments"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            data-testid="filter-all-comments"
          >
            All ({comments.length})
          </Button>
          <Button
            variant={filter === 'open' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('open')}
            data-testid="filter-open-comments"
          >
            <Clock className="h-4 w-4 mr-1" />
            Open ({comments.filter(c => !c.resolved).length})
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('resolved')}
            data-testid="filter-resolved-comments"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Resolved ({comments.filter(c => c.resolved).length})
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1 p-4">
        {Object.keys(commentThreads).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet</p>
            {canComment && (
              <p className="text-sm mt-2">Select text and click "Add Comment" to start</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(commentThreads).map(([threadId, thread]) => (
              <CommentThread
                key={threadId}
                comment={thread.parent}
                replies={thread.replies}
                currentUser={currentUser}
                userRole={userRole}
                onReply={(content) => onReplyToComment(thread.parent.id, content)}
                onEdit={(content) => onUpdateComment(thread.parent.id, content)}
                onDelete={() => onDeleteComment(thread.parent.id)}
                onResolve={() => onResolveComment(thread.parent.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Comment Button */}
      {canComment && (
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-new-comment"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
        </div>
      )}

      {/* Add Comment Dialog */}
      {showAddDialog && (
        <AddCommentDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSubmit={(content, range) => {
            onAddComment(content, range);
            setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
}