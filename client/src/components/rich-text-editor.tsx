import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { YjsCollaboration } from './yjs-collaboration-extension';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List, 
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Users,
  Circle,
  Eye,
  Edit3,
  MessageSquare,
  Code,
  Code2,
  Minus,
  Check,
  Loader2
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  ydoc?: Y.Doc | null;
  awareness?: awarenessProtocol.Awareness | null;
  xmlFragment?: Y.XmlFragment | null;
  isCollaborative?: boolean;
  readOnly?: boolean;
  onlineUsers?: Map<number, any>;
  userColor?: string;
  userRole?: 'owner' | 'editor' | 'reviewer' | 'reader' | null;
  userName?: string;
  onCommentClick?: () => void;
}


export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className = "",
  ydoc,
  awareness,
  xmlFragment,
  isCollaborative = false,
  readOnly = false,
  onlineUsers,
  userColor,
  userRole,
  userName,
  onCommentClick
}: RichTextEditorProps) {
  
  // Autosave state management
  const [saveStatus, setSaveStatus] = useState<'saved' | 'typing' | 'saving'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure extensions based on collaborative mode
  const extensions = useMemo(() => {
    const baseExtensions = [];
    
    if (isCollaborative && ydoc && awareness && xmlFragment) {
      // Use Yjs collaboration extension for proper sync
      baseExtensions.push(
        YjsCollaboration.configure({
          ydoc,
          awareness,
          xmlFragment: 'prosemirror',
          user: {
            name: userName || 'Anonymous',
            color: userColor || '#000000'
          }
        })
      );
      // Add StarterKit - Yjs extension handles history
      baseExtensions.push(StarterKit);
    } else {
      // Non-collaborative mode - use regular StarterKit with history
      baseExtensions.push(StarterKit);
    }
    
    // Add additional formatting extensions
    baseExtensions.push(
      UnderlineExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      })
    );
    
    return baseExtensions;
  }, [isCollaborative, ydoc, awareness, xmlFragment, userName, userColor]);

  const editor = useEditor({
    extensions,
    content: isCollaborative ? undefined : content, // Don't set initial content in collaborative mode
    editable: !readOnly && userRole !== 'reader',
    onUpdate: ({ editor }) => {
      // IMMEDIATELY save data - no debouncing for data persistence
      onChange(editor.getHTML());
      
      // Set typing status immediately (UI feedback)
      setSaveStatus('typing');
      
      // Clear existing timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // After 500ms of no typing, change to saving (cosmetic only)
      typingTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saving');
        
        // After another 300ms, mark as saved (cosmetic only)
        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus('saved');
          setLastSaved(new Date());
        }, 300);
      }, 500);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-custom max-w-none focus:outline-none min-h-[200px] p-4',
        'data-testid': 'editor-content-area'
      },
    },
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Update content for non-collaborative mode
  useEffect(() => {
    if (!editor || isCollaborative) return;
    
    // Only update content if it's different and we're not in collaborative mode
    const currentContent = editor.getHTML();
    if (content !== currentContent) {
      editor.commands.setContent(content);
    }
  }, [content, editor, isCollaborative]);

  if (!editor) {
    return null;
  }

  // Calculate number of active users for display
  const activeUserCount = onlineUsers ? onlineUsers.size : 0;

  return (
    <div className={`border border-border rounded-lg ${className}`} data-testid="rich-text-editor">
      {/* Status Bar */}
      {isCollaborative && (
        <div className="bg-muted/50 px-3 py-2 flex items-center justify-between text-sm border-b border-border">
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-1.5">
              <Circle className={`h-2 w-2 fill-current ${isCollaborative ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-muted-foreground">
                {isCollaborative ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            {/* Active Users */}
            {activeUserCount > 0 && (
              <div className="flex items-center space-x-1.5" data-testid="active-users-count">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{activeUserCount} online</span>
              </div>
            )}
            
            {/* User Role */}
            {userRole && (
              <Badge variant="secondary" className="capitalize">
                {userRole === 'owner' && <Edit3 className="h-3 w-3 mr-1" />}
                {userRole === 'reader' && <Eye className="h-3 w-3 mr-1" />}
                {userRole}
              </Badge>
            )}
          </div>
          
          {/* Comment Button */}
          {onCommentClick && userRole !== 'reader' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCommentClick}
              data-testid="button-add-comment"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comment
            </Button>
          )}
        </div>
      )}
      
      {/* Toolbar */}
      <div className="border-b border-border p-2 flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center space-x-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-h1"
          >
            H1
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-h2"
          >
            H2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-h3"
          >
            H3
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editor.isActive('paragraph') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-paragraph"
          >
            <Type className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-code-block"
          >
            <Code2 className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-align-left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-align-center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-align-right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-bullet-list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-ordered-list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={readOnly || userRole === 'reader'}
            data-testid="button-horizontal-rule"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || readOnly || userRole === 'reader'}
            data-testid="button-undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || readOnly || userRole === 'reader'}
            data-testid="button-redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Autosave Indicator */}
        {!isCollaborative && (
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground" data-testid="autosave-indicator">
            {saveStatus === 'typing' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Typing...</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && lastSaved && (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Editor Content with Live Cursors Overlay */}
      <div className="relative">
        {/* Live Cursors Overlay */}
        {isCollaborative && onlineUsers && onlineUsers.size > 0 && (
          <div className="absolute inset-0 pointer-events-none z-10" data-testid="live-cursors-overlay">
            {Array.from(onlineUsers.values()).map((userState, index) => {
              if (!userState?.user || !userState.cursor) return null;
              const cursor = userState.cursor;
              const cursorColor = userState.user.color || '#808080';
              
              return (
                <div
                  key={`cursor-${index}`}
                  className="absolute"
                  style={{
                    left: '0',
                    top: '0',
                    transform: `translateY(${cursor.from * 0.5}px)`,
                  }}
                  data-testid={`cursor-user-${userState.user.id}`}
                >
                  <div
                    className="w-0.5 h-5 animate-pulse"
                    style={{ backgroundColor: cursorColor }}
                  />
                  <div
                    className="absolute -top-6 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                    style={{ backgroundColor: cursorColor }}
                  >
                    {userState.user.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Editor Content */}
        <EditorContent 
          editor={editor} 
          className={`min-h-[200px] ${readOnly || userRole === 'reader' ? 'opacity-75' : ''}`}
          data-testid="editor-content"
        />
        
        {/* Read-only Overlay Message */}
        {(readOnly || userRole === 'reader') && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>View Only</span>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}