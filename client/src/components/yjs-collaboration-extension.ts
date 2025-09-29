import { Extension } from '@tiptap/core';
import { ySyncPlugin, yUndoPlugin, yCursorPlugin } from 'y-prosemirror';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

export interface YjsCollaborationOptions {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  xmlFragment?: string;
  user?: {
    name: string;
    color: string;
  };
}

export const YjsCollaboration = Extension.create<YjsCollaborationOptions>({
  name: 'yjsCollaboration',

  addOptions() {
    return {
      ydoc: new Y.Doc(),
      awareness: null as any,
      xmlFragment: 'default',
      user: {
        name: 'Anonymous',
        color: '#30bced'
      }
    };
  },

  onCreate() {
    // Set the user in awareness if provided
    if (this.options.awareness && this.options.user) {
      this.options.awareness.setLocalStateField('user', {
        name: this.options.user.name,
        color: this.options.user.color,
      });
    }
  },

  addProseMirrorPlugins() {
    const fragment = this.options.xmlFragment || 'default';
    const yXmlFragment = this.options.ydoc.getXmlFragment(fragment);

    const plugins = [
      // Main sync plugin that keeps ProseMirror and Yjs in sync
      ySyncPlugin(yXmlFragment, {
        // Optional: Add mapping for custom node types
        permanentUserData: null,
        onFirstRender: () => {
          // Called when the editor is first rendered with the Yjs content
          console.log('Yjs content synced to editor');
        }
      }),
    ];

    // Add undo plugin if we want collaborative undo/redo
    plugins.push(
      yUndoPlugin()
    );

    // Add cursor plugin if awareness is provided
    if (this.options.awareness) {
      plugins.push(
        yCursorPlugin(this.options.awareness, {
          cursorBuilder: (user: any) => {
            const cursor = document.createElement('span');
            cursor.classList.add('collaboration-cursor');
            cursor.style.borderColor = user.color;
            
            const label = document.createElement('div');
            label.classList.add('collaboration-cursor-label');
            label.style.backgroundColor = user.color;
            label.insertBefore(document.createTextNode(user.name), null);
            cursor.insertBefore(label, null);
            
            return cursor;
          },
          selectionBuilder: (user: any) => {
            const selection = document.createElement('span');
            selection.classList.add('collaboration-selection');
            selection.style.backgroundColor = user.color + '30'; // Add transparency
            return selection;
          },
          getSelection: (state: any) => state.selection
        })
      );
    }

    return plugins;
  },
});

// Helper function to get the Yjs XmlFragment from the editor
export function getYjsXmlFragment(ydoc: Y.Doc, fragmentName: string = 'default'): Y.XmlFragment {
  return ydoc.getXmlFragment(fragmentName);
}

// Helper function to get current document state as Yjs update
export function getYjsUpdate(ydoc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(ydoc);
}

// Helper function to apply Yjs update to document
export function applyYjsUpdate(ydoc: Y.Doc, update: Uint8Array): void {
  Y.applyUpdate(ydoc, update);
}