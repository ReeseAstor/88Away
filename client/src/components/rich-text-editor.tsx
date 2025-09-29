import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { YjsCollaboration } from './yjs-collaboration-extension';
import { 
  Bold, 
  Italic, 
  Underline, 
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
  MessageSquare
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
      // Add StarterKit but disable history since Yjs handles undo/redo
      baseExtensions.push(
        StarterKit.configure({
          history: false
        })
      );
    } else {
      // Non-collaborative mode - use regular StarterKit with history
      baseExtensions.push(StarterKit);
    }
    
    return baseExtensions;
  }, [isCollaborative, ydoc, awareness, xmlFragment, userName, userColor]);

  const editor = useEditor({
    extensions,
    content: isCollaborative ? undefined : content, // Don't set initial content in collaborative mode
    editable: !readOnly && userRole !== 'reader',
    onUpdate: ({ editor }) => {
      // Always notify parent of changes
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-custom max-w-none focus:outline-none min-h-[200px] p-4',
        'data-testid': 'editor-content-area'
      },
    },
  });

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
      <div className="border-b border-border p-2 flex items-center space-x-1 flex-wrap">
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
          ref={editorRef}
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