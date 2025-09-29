import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { WebSocket } from 'ws';
import { storage } from './storage';
import type { User, DocumentCollaborationState, CollaborationPresence } from '@shared/schema';

interface DocumentRoom {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Map<string, CollaborationClient>;
  lastSaved: Date;
  saveTimer?: NodeJS.Timeout;
}

interface CollaborationClient {
  ws: WebSocket;
  userId: string;
  user: User;
  documentId: string;
  projectId: string;
  role: 'owner' | 'editor' | 'reviewer' | 'reader';
  color: string;
  cursorPos?: { line: number; column: number };
}

export class CollaborationService {
  private static instance: CollaborationService;
  private rooms: Map<string, DocumentRoom> = new Map();
  private clients: Map<WebSocket, CollaborationClient> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Clean up stale presence every minute
    this.cleanupInterval = setInterval(() => {
      storage.cleanupStalePresence().catch(console.error);
    }, 60000);
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  public async handleConnection(ws: WebSocket, user: User, documentId: string, projectId: string) {
    try {
      // Get user's role in the project
      const project = await storage.getProject(projectId);
      if (!project) {
        ws.send(JSON.stringify({ type: 'error', message: 'Project not found' }));
        ws.close();
        return;
      }

      let role: CollaborationClient['role'] = 'reader';
      if (project.ownerId === user.id) {
        role = 'owner';
      } else {
        const userRole = await storage.getUserRole(projectId, user.id);
        if (userRole) {
          role = userRole as CollaborationClient['role'];
        }
      }

      // Get or create room for this document
      let room = this.rooms.get(documentId);
      if (!room) {
        room = await this.createRoom(documentId);
        this.rooms.set(documentId, room);
      }

      // Create client instance
      const client: CollaborationClient = {
        ws,
        userId: user.id,
        user,
        documentId,
        projectId,
        role,
        color: this.generateUserColor(user.id),
      };

      this.clients.set(ws, client);
      room.clients.set(user.id, client);

      // Update presence
      await storage.updatePresence(projectId, user.id, documentId, 'online', undefined, client.color);

      // Set up awareness
      room.awareness.setLocalStateField('user', {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        color: client.color,
        role,
      });

      // Send initial sync
      const syncEncoder = encoding.createEncoder();
      encoding.writeVarUint(syncEncoder, 0); // messageType: sync
      syncProtocol.writeSyncStep1(syncEncoder, room.doc);
      ws.send(encoding.toUint8Array(syncEncoder));

      // Send awareness states
      const awarenessStates = room.awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 1); // messageType: awareness
        const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(awarenessStates.keys()));
        encoding.writeVarUint8Array(encoder, awarenessUpdate);
        ws.send(encoding.toUint8Array(encoder));
      }

      // Set up message handling
      ws.on('message', async (data: Buffer) => {
        await this.handleMessage(client, data);
      });

      ws.on('close', async () => {
        await this.handleDisconnect(client);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(client).catch(console.error);
      });

      // Send connection success
      ws.send(JSON.stringify({
        type: 'connected',
        documentId,
        role,
        color: client.color,
      }));

    } catch (error) {
      console.error('Error handling WebSocket connection:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to establish connection' }));
      ws.close();
    }
  }

  private async handleMessage(client: CollaborationClient, data: Buffer) {
    const room = this.rooms.get(client.documentId);
    if (!room) return;

    try {
      const message = new Uint8Array(data);
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case 0: // Sync message
          if (client.role === 'owner' || client.role === 'editor') {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, 0); // messageType: sync
            
            const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, room.doc, null);
            
            if (encoding.length(encoder) > 1) {
              client.ws.send(encoding.toUint8Array(encoder));
            }

            // Broadcast document changes to all clients
            if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
              this.broadcastUpdate(room, client, message);
              this.scheduleRoomSave(client.documentId);
            }
          } else {
            client.ws.send(JSON.stringify({
              type: 'permission-denied',
              message: 'You do not have permission to edit this document',
            }));
          }
          break;

        case 1: // Awareness message
          awarenessProtocol.applyAwarenessUpdate(room.awareness, message, client);
          
          // Broadcast awareness to all other clients
          room.clients.forEach((otherClient) => {
            if (otherClient.userId !== client.userId) {
              otherClient.ws.send(message);
            }
          });

          // Update cursor position if included
          const awareness = room.awareness.getLocalState();
          if (awareness?.cursor) {
            client.cursorPos = awareness.cursor;
            storage.updatePresence(
              client.projectId,
              client.userId,
              client.documentId,
              'online',
              client.cursorPos,
              client.color
            ).catch(console.error);
          }
          break;

        case 2: // Custom message (comments, etc)
          const customMessage = JSON.parse(decoding.readVarString(decoder));
          await this.handleCustomMessage(client, customMessage);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
      }));
    }
  }

  private async handleCustomMessage(client: CollaborationClient, message: any) {
    const room = this.rooms.get(client.documentId);
    if (!room) return;

    switch (message.type) {
      case 'comment-add':
        if (client.role !== 'reader') {
          const comment = await storage.createComment(
            client.documentId,
            client.userId,
            message.content,
            message.range
          );
          
          // Broadcast to all clients
          this.broadcastToRoom(room, {
            type: 'comment-added',
            comment,
          });
        } else {
          client.ws.send(JSON.stringify({
            type: 'permission-denied',
            message: 'You do not have permission to add comments',
          }));
        }
        break;

      case 'comment-resolve':
        if (client.role !== 'reader') {
          const resolved = await storage.resolveComment(message.commentId);
          
          // Broadcast to all clients
          this.broadcastToRoom(room, {
            type: 'comment-updated',
            comment: resolved,
          });
        }
        break;

      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  private async handleDisconnect(client: CollaborationClient) {
    const room = this.rooms.get(client.documentId);
    if (room) {
      room.clients.delete(client.userId);
      
      // Save document state before disconnect
      if (client.role === 'owner' || client.role === 'editor') {
        await this.saveRoom(client.documentId);
      }

      // Clean up room if empty
      if (room.clients.size === 0) {
        if (room.saveTimer) {
          clearTimeout(room.saveTimer);
        }
        await this.saveRoom(client.documentId);
        this.rooms.delete(client.documentId);
      }

      // Remove awareness - set local state to null
      room.awareness.setLocalState(null);
    }

    // Update presence to offline
    await storage.updatePresence(
      client.projectId,
      client.userId,
      null,
      'offline'
    ).catch(console.error);

    this.clients.delete(client.ws);
  }

  private async createRoom(documentId: string): Promise<DocumentRoom> {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    // Load existing state from database
    const state = await storage.getCollaborationState(documentId);
    if (state && state.ydocState) {
      const stateArray = new Uint8Array(Buffer.from(state.ydocState, 'base64'));
      Y.applyUpdate(doc, stateArray);
    } else {
      // Initialize XmlFragment for new documents
      const xmlFragment = doc.getXmlFragment('prosemirror');
      // Optionally initialize with empty ProseMirror content
    }

    return {
      doc,
      awareness,
      clients: new Map(),
      lastSaved: new Date(),
    };
  }

  private scheduleRoomSave(documentId: string) {
    const room = this.rooms.get(documentId);
    if (!room) return;

    // Clear existing timer
    if (room.saveTimer) {
      clearTimeout(room.saveTimer);
    }

    // Save after 5 seconds of inactivity
    room.saveTimer = setTimeout(() => {
      this.saveRoom(documentId).catch(console.error);
    }, 5000);
  }

  private async saveRoom(documentId: string) {
    const room = this.rooms.get(documentId);
    if (!room) return;

    try {
      const stateArray = Y.encodeStateAsUpdate(room.doc);
      const stateBase64 = Buffer.from(stateArray).toString('base64');
      
      await storage.saveCollaborationState(documentId, stateBase64);
      room.lastSaved = new Date();

      // Also update document content and word count
      // Get the XmlFragment and convert to HTML for storage
      const xmlFragment = room.doc.getXmlFragment('prosemirror');
      // For now, we'll store the raw Yjs state and let the client handle rendering
      // This preserves the structured document format
      const content = ''; // Content will be reconstructed from Yjs state
      const wordCount = 0; // Word count will be calculated client-side

      const document = await storage.getDocument(documentId);
      if (document) {
        await storage.updateDocument(
          documentId,
          { content },
          document.authorId
        );
      }
    } catch (error) {
      console.error('Error saving room state:', error);
    }
  }

  private broadcastUpdate(room: DocumentRoom, sender: CollaborationClient, update: Uint8Array) {
    room.clients.forEach((client) => {
      if (client.userId !== sender.userId) {
        client.ws.send(update);
      }
    });
  }

  private broadcastToRoom(room: DocumentRoom, message: any) {
    const messageStr = JSON.stringify(message);
    room.clients.forEach((client) => {
      client.ws.send(messageStr);
    });
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#48C9B0', '#F8B739', '#6C5CE7', '#A29BFE', '#FD79A8',
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  public async getDocumentCollaborationState(documentId: string): Promise<string | null> {
    const state = await storage.getCollaborationState(documentId);
    return state?.ydocState || null;
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Save all rooms before shutdown
    this.rooms.forEach((_, documentId) => {
      this.saveRoom(documentId).catch(console.error);
    });
    
    // Close all connections
    this.clients.forEach((client) => {
      client.ws.close();
    });
    
    this.rooms.clear();
    this.clients.clear();
  }
}