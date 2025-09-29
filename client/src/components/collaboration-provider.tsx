import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CollaborationContextType {
  ydoc: Y.Doc | null;
  awareness: awarenessProtocol.Awareness | null;
  isConnected: boolean;
  onlineUsers: Map<number, any>;
  sendComment: (type: string, data: any) => void;
  userColor: string;
  userRole: 'owner' | 'editor' | 'reviewer' | 'reader' | null;
  xmlFragment: Y.XmlFragment | null;
}

const CollaborationContext = createContext<CollaborationContextType>({
  ydoc: null,
  awareness: null,
  isConnected: false,
  onlineUsers: new Map(),
  sendComment: () => {},
  userColor: '',
  userRole: null,
  xmlFragment: null,
});

export const useCollaboration = () => useContext(CollaborationContext);

interface CollaborationProviderProps {
  documentId: string;
  projectId: string;
  children: React.ReactNode;
}

export function CollaborationProvider({ documentId, projectId, children }: CollaborationProviderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<number, any>>(new Map());
  const [userColor, setUserColor] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'reviewer' | 'reader' | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
  const xmlFragmentRef = useRef<Y.XmlFragment | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback((message: Uint8Array | string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (typeof message === 'string') {
        wsRef.current.send(message);
      } else {
        wsRef.current.send(message);
      }
    }
  }, []);

  const sendComment = useCallback((type: string, data: any) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 2); // Custom message type
    encoding.writeVarString(encoder, JSON.stringify({ type, ...data }));
    sendMessage(encoding.toUint8Array(encoder));
  }, [sendMessage]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      // Try to parse as JSON first (for custom messages)
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'connected':
            setIsConnected(true);
            setUserColor(message.color || '');
            setUserRole(message.role || null);
            reconnectAttemptsRef.current = 0;
            toast({
              title: "Connected",
              description: "Real-time collaboration is active",
            });
            break;
            
          case 'error':
            console.error('Collaboration error:', message.message);
            toast({
              title: "Collaboration Error",
              description: message.message,
              variant: "destructive",
            });
            break;
            
          case 'permission-denied':
            toast({
              title: "Permission Denied",
              description: message.message,
              variant: "destructive",
            });
            break;
            
          case 'comment-added':
          case 'comment-updated':
            // These will be handled by the comment components
            window.dispatchEvent(new CustomEvent('collaboration-comment', { detail: message }));
            break;
            
          case 'pong':
            // Ping response received
            break;
        }
      } else {
        // Binary message (Yjs sync or awareness)
        const data = new Uint8Array(event.data);
        const decoder = decoding.createDecoder(data);
        const messageType = decoding.readVarUint(decoder);
        
        if (!ydocRef.current || !awarenessRef.current) {
          console.warn('Received message before initialization');
          return;
        }
        
        switch (messageType) {
          case 0: // Sync message
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, 0); // messageType: sync
            const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, ydocRef.current, null);
            
            if (encoding.length(encoder) > 1) {
              sendMessage(encoding.toUint8Array(encoder));
            }
            
            // Sync complete - check if we received sync step 2
            if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
              setIsConnected(true);
            }
            break;
            
          case 1: // Awareness message
            awarenessProtocol.applyAwarenessUpdate(awarenessRef.current, data, null);
            break;
        }
      }
    } catch (error) {
      console.error('Error handling collaboration message:', error);
    }
  }, [toast, sendMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/collaboration?documentId=${documentId}&projectId=${projectId}`);
    
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      
      // Send initial sync request
      if (ydocRef.current) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0); // messageType: sync
        syncProtocol.writeSyncStep1(encoder, ydocRef.current);
        ws.send(encoding.toUint8Array(encoder));
      }
      
      // Start ping interval to keep connection alive
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        sendComment('ping', {});
      }, 30000); // Ping every 30 seconds
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttemptsRef.current < 5) {
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current++;
        
        toast({
          title: "Connection Lost",
          description: `Reconnecting in ${timeout / 1000} seconds...`,
        });
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, timeout);
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to establish real-time collaboration. Working offline.",
          variant: "destructive",
        });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [documentId, projectId, handleMessage, sendComment, toast]);

  useEffect(() => {
    if (!user) return;

    // Initialize Yjs document with XmlFragment
    const ydoc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(ydoc);
    const xmlFragment = ydoc.getXmlFragment('prosemirror');
    
    ydocRef.current = ydoc;
    awarenessRef.current = awareness;
    xmlFragmentRef.current = xmlFragment;

    // Set local user info in awareness
    awareness.setLocalStateField('user', {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      color: userColor,
    });

    // Listen for awareness changes
    awareness.on('change', () => {
      const states = awareness.getStates();
      setOnlineUsers(new Map(states));
    });

    // Listen for document updates
    ydoc.on('update', (update: Uint8Array) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0); // messageType: sync
        syncProtocol.writeUpdate(encoder, update);
        wsRef.current.send(encoding.toUint8Array(encoder));
      }
    });

    // Listen for awareness updates  
    awareness.on('update', ({ added, updated, removed }: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 1); // messageType: awareness
        const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed]);
        encoding.writeVarUint8Array(encoder, awarenessUpdate);
        wsRef.current.send(encoding.toUint8Array(encoder));
      }
    });

    // Connect to WebSocket
    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      ydoc.destroy();
      awareness.destroy();
    };
  }, [user, documentId, projectId, connect]);

  const value: CollaborationContextType = {
    ydoc: ydocRef.current,
    awareness: awarenessRef.current,
    isConnected,
    onlineUsers,
    sendComment,
    userColor,
    userRole,
    xmlFragment: xmlFragmentRef.current,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}