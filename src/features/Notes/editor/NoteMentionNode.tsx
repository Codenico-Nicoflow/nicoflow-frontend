import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import type { IMentionResult } from '@nicoflow/shared/api';
import { Node } from '@tiptap/core';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper, ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import Suggestion from '@tiptap/suggestion';
import { AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useGetNoteQuery } from '@/lib/store';
import { noteApi, store } from '@/lib/store/store';
import { cn } from '@/lib/utils';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteMention: {
      setNoteMention: (attrs: { noteId: string; titleSnapshot: string }) => ReturnType;
    };
  }
}

interface MentionListProps {
  items: IMentionResult[];
  command: (item: IMentionResult) => void;
}

interface MentionListHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

// The @-mention dropdown (NIC-1972). A plain arrow-key + Enter list, same
// shape Tiptap's own mention examples use: onKeyDown is exposed via a ref so
// the Suggestion plugin can forward ArrowUp/ArrowDown/Enter/Escape into it
// without the plugin needing to know anything about React.
const MentionList = forwardRef<MentionListHandle, MentionListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div
        className="bg-popover text-popover-foreground border-border rounded-md border p-2 text-sm shadow-md"
        data-testid="note-mention-suggestion-empty"
      >
        No notes found
      </div>
    );
  }

  return (
    <div
      className="bg-popover text-popover-foreground border-border max-h-64 overflow-y-auto rounded-md border p-1 shadow-md"
      data-testid="note-mention-suggestion-list"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          data-testid={`note-mention-suggestion-item-${item.id}`}
          onClick={() => selectItem(index)}
          className={`hover:bg-accent w-full rounded-sm px-2 py-1 text-start text-sm ${
            index === selectedIndex ? 'bg-accent' : ''
          }`}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
});
MentionList.displayName = 'MentionList';

// Deliberately outside React: the Suggestion plugin's `items()` callback runs
// from ProseMirror's transaction pipeline, not a component render, so it
// needs an imperative fetch rather than a hook. Dispatching the same RTK
// Query endpoint the rest of the app uses (via the constructed store/noteApi
// singletons) keeps this on one cache/request pipeline instead of a second,
// parallel fetch mechanism just for the mention dropdown.
const fetchMentionResults = async (query: string, excludeNoteId?: string): Promise<IMentionResult[]> => {
  if (query.trim() === '') return [];
  try {
    return await store
      .dispatch(noteApi.endpoints.searchMentions.initiate({ q: query, excludeId: excludeNoteId }))
      .unwrap();
  } catch {
    return [];
  }
};

const NoteMentionView = ({ node }: NodeViewProps) => {
  const navigate = useNavigate();
  const noteId = node.attrs.noteId as string;
  const titleSnapshot = node.attrs.titleSnapshot as string;

  // Existence check (AC3): the mention stores a title snapshot from insert
  // time so it never needs a network round-trip just to render text, but a
  // live chip still has to know whether its target survived. Reuses the same
  // scalar the editor page itself fetches — no new endpoint for this.
  const { isError, isLoading } = useGetNoteQuery(noteId, { skip: !noteId });
  const isOrphaned = !isLoading && isError;

  return (
    <NodeViewWrapper
      as="span"
      data-note-mention-chip=""
      data-testid="note-mention"
      data-orphaned={isOrphaned}
      className={cn(
        'border-border bg-accent text-accent-foreground mx-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 align-baseline text-sm',
        isOrphaned && 'text-muted-foreground cursor-not-allowed opacity-60'
      )}
    >
      <AtSign className="h-3.5 w-3.5" aria-hidden="true" />
      {isOrphaned ? (
        <span data-testid="note-mention-label">{titleSnapshot}</span>
      ) : (
        <button
          type="button"
          contentEditable={false}
          data-testid="note-mention-label"
          className="underline-offset-2 hover:underline"
          onClick={() => navigate(`/notes/${noteId}`)}
        >
          {titleSnapshot}
        </button>
      )}
    </NodeViewWrapper>
  );
};

// Inline @note mention (NIC-1972): a note can link to another note from
// inside its prose. Soft-orphan on a deleted target (locked decision,
// NIC-1960): the chip never disappears and never throws — it just stops
// navigating and greys out.
export const createNoteMentionExtension = (options: { excludeNoteId?: string } = {}) =>
  Node.create({
    name: 'noteMention',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
      return {
        noteId: {
          default: null,
          parseHTML: element => element.getAttribute('data-note-id'),
          renderHTML: attributes => ({ 'data-note-id': attributes.noteId as string | null }),
        },
        titleSnapshot: {
          default: '',
          parseHTML: element => element.getAttribute('data-title-snapshot') ?? '',
          renderHTML: attributes => ({ 'data-title-snapshot': attributes.titleSnapshot as string }),
        },
      };
    },

    parseHTML() {
      return [{ tag: 'span[data-note-mention]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return ['span', { ...HTMLAttributes, 'data-note-mention': '' }];
    },

    addCommands() {
      return {
        setNoteMention:
          (attrs: { noteId: string; titleSnapshot: string }) =>
          ({ commands }) =>
            commands.insertContent({ type: this.name, attrs }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(NoteMentionView);
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '@',
          allowSpaces: false,
          items: ({ query }) => fetchMentionResults(query, options.excludeNoteId),
          debounce: 250,
          command: ({ editor, range, props }) => {
            const item = props as IMentionResult;
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNoteMention({ noteId: item.id, titleSnapshot: item.title })
              .run();
          },
          render: () => {
            let component: ReactRenderer<MentionListHandle, MentionListProps>;
            let unmount: (() => void) | null = null;

            return {
              onStart: (props: SuggestionProps<IMentionResult>) => {
                component = new ReactRenderer(MentionList, {
                  props: { items: props.items, command: props.command },
                  editor: props.editor,
                });
                unmount = props.mount?.(component.element) ?? null;
              },
              onUpdate: (props: SuggestionProps<IMentionResult>) => {
                component.updateProps({ items: props.items, command: props.command });
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === 'Escape') {
                  unmount?.();
                  component.destroy();
                  return true;
                }
                return component.ref?.onKeyDown(props) ?? false;
              },
              onExit: () => {
                unmount?.();
                component.destroy();
              },
            };
          },
        }),
      ];
    },
  });
