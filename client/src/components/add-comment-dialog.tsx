import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";

interface AddCommentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, range?: { start: number; end: number }) => void;
  selectedText?: string;
  defaultRange?: { start: number; end: number };
}

export default function AddCommentDialog({
  open,
  onClose,
  onSubmit,
  selectedText,
  defaultRange,
}: AddCommentDialogProps) {
  const [content, setContent] = useState('');
  const [rangeStart, setRangeStart] = useState(defaultRange?.start ?? 0);
  const [rangeEnd, setRangeEnd] = useState(defaultRange?.end ?? 0);
  const [useRange, setUseRange] = useState(!!defaultRange);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim()) {
      const range = useRange ? { start: rangeStart, end: rangeEnd } : undefined;
      onSubmit(content.trim(), range);
      setContent('');
      setRangeStart(0);
      setRangeEnd(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="add-comment-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Add Comment</span>
          </DialogTitle>
          <DialogDescription>
            Add a comment to this document. You can optionally reference a specific text range.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Text Preview */}
          {selectedText && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground mb-1">Selected Text:</Label>
              <p className="text-sm italic">{selectedText}</p>
            </div>
          )}

          {/* Comment Content */}
          <div className="space-y-2">
            <Label htmlFor="comment-content">Comment</Label>
            <Textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment..."
              className="min-h-[100px]"
              data-testid="comment-content-textarea"
              autoFocus
              required
            />
          </div>

          {/* Optional Text Range */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-range"
                checked={useRange}
                onChange={(e) => setUseRange(e.target.checked)}
                data-testid="checkbox-use-range"
              />
              <Label htmlFor="use-range" className="cursor-pointer">
                Reference specific text range (optional)
              </Label>
            </div>
            
            {useRange && (
              <div className="flex space-x-2 ml-6">
                <div className="flex-1">
                  <Label htmlFor="range-start" className="text-xs">Start</Label>
                  <Input
                    id="range-start"
                    type="number"
                    min="0"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(parseInt(e.target.value) || 0)}
                    data-testid="input-range-start"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="range-end" className="text-xs">End</Label>
                  <Input
                    id="range-end"
                    type="number"
                    min="0"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || 0)}
                    data-testid="input-range-end"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-comment"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim()}
              data-testid="button-submit-comment"
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}