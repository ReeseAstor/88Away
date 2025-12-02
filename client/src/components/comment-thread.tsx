import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Reply,
  Edit,
  Trash,
  CheckCircle,
  Clock,
  MoreVertical,
  Send,
  X,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import type { DocumentComment as Comment, User } from '@shared/schema';

type CommentWithAuthor = Comment & {
  author?: User | null;
};

interface CommentThreadProps {
  comment: CommentWithAuthor;
  replies: CommentWithAuthor[];
  currentUser: User | null;
  userRole?: 'owner' | 'editor' | 'reviewer' | 'reader' | null;
  onReply: (content: string) => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onResolve: () => void;
}

export default function CommentThread({
  comment,
  replies,
  currentUser,
  userRole,
  onReply,
  onEdit,
  onDelete,
  onResolve,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content || '');

  const isAuthor = currentUser?.id === comment.authorId;
  const canEdit = isAuthor && userRole !== 'reader';
  const canDelete = (isAuthor || userRole === 'owner') && userRole !== 'reader';
  const canResolve = userRole !== 'reader';
  const canReply = userRole !== 'reader';

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Card className="p-4" data-testid={`comment-thread-${comment.id}`}>
      {/* Main Comment */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              {comment.author?.profileImageUrl && (
                <AvatarImage src={comment.author.profileImageUrl} />
              )}
              <AvatarFallback>{comment.author ? getUserInitials(comment.author) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">
                  {comment.author ? `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.resolved && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>

              {/* Comment Content or Edit Mode */}
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px]"
                    data-testid="edit-comment-textarea"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      data-testid="button-save-edit"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content || '');
                      }}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
              )}

              {/* Text Range Reference */}
              {comment.range && typeof comment.range === 'object' && comment.range !== null && 'start' in comment.range && 'end' in comment.range && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <span className="text-muted-foreground">Reference: </span>
                  <span>Characters {(comment.range as { start: number; end: number }).start} - {(comment.range as { start: number; end: number }).end}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          {!isEditing && (canEdit || canDelete || canResolve) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`comment-menu-${comment.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && !comment.resolved && (
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    data-testid="menu-edit-comment"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canResolve && !comment.resolved && (
                  <DropdownMenuItem
                    onClick={onResolve}
                    data-testid="menu-resolve-comment"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                    data-testid="menu-delete-comment"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reply Button */}
        {!isEditing && canReply && !comment.resolved && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(true)}
              data-testid="button-reply"
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          </div>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="ml-11 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px]"
              data-testid="reply-textarea"
              autoFocus
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyContent.trim()}
                data-testid="button-send-reply"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
                data-testid="button-cancel-reply"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="ml-11 space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} className="flex items-start space-x-3">
                <Avatar className="h-7 w-7">
                  {reply.author?.profileImageUrl && (
                    <AvatarImage src={reply.author.profileImageUrl} />
                  )}
                  <AvatarFallback className="text-xs">
                    {reply.author ? getUserInitials(reply.author) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {reply.author ? `${reply.author.firstName || ''} ${reply.author.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {reply.createdAt && formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}