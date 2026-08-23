import { Node } from '@tiptap/core';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CALLOUT_ICON_COMPONENTS } from './calloutIconComponents';
import { isNoteCalloutIcon, NOTE_CALLOUT_ICONS, type NoteCalloutIcon } from './calloutIcons';
import { isNoteColorToken, NOTE_COLOR_TOKENS, type NoteColorToken } from './colorTokens';

// Reuses NIC-1968's highlight palette for the background tint — one set of 8
// color tokens for the whole feature rather than a second one just for
// callouts. Icon is a separate small fixed set (calloutIcons.ts): neither
// attribute accepts a free-form value, same allowlist-at-the-boundary posture
// as the color marks.
const DEFAULT_ICON: NoteCalloutIcon = 'info';
const DEFAULT_COLOR: NoteColorToken = 'blue';

const parseIcon = (value: string | null): NoteCalloutIcon => (isNoteCalloutIcon(value) ? value : DEFAULT_ICON);
const parseColor = (value: string | null): NoteColorToken => (isNoteColorToken(value) ? value : DEFAULT_COLOR);

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteCallout: {
      setNoteCallout: (attrs?: { icon?: NoteCalloutIcon; colorToken?: NoteColorToken }) => ReturnType;
      updateNoteCalloutAttrs: (attrs: { icon?: NoteCalloutIcon; colorToken?: NoteColorToken }) => ReturnType;
    };
  }
}

const CalloutView = ({ node, updateAttributes }: NodeViewProps) => {
  const icon = parseIcon(node.attrs.icon as string | null);
  const colorToken = parseColor(node.attrs.colorToken as string | null);
  const Icon = CALLOUT_ICON_COMPONENTS[icon];

  return (
    <NodeViewWrapper
      data-note-callout=""
      data-token={colorToken}
      data-testid="note-callout"
      className="my-2 flex gap-2 rounded-md border border-border p-3"
    >
      <button
        type="button"
        contentEditable={false}
        aria-label="Callout icon"
        data-testid="note-callout-icon-trigger"
        className="shrink-0"
        onClick={() => {
          const currentIndex = NOTE_CALLOUT_ICONS.indexOf(icon);
          const next = NOTE_CALLOUT_ICONS[(currentIndex + 1) % NOTE_CALLOUT_ICONS.length];
          updateAttributes({ icon: next });
        }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
      <NodeViewContent className="min-w-0 flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            contentEditable={false}
            aria-label="Callout color"
            data-testid="note-callout-color-trigger"
            className="border-border h-4 w-4 shrink-0 self-start rounded-full border"
            style={{ backgroundColor: `var(--note-highlight-${colorToken})` }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto p-2">
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Callout color">
            {NOTE_COLOR_TOKENS.map(swatchToken => (
              <button
                key={swatchToken}
                type="button"
                contentEditable={false}
                aria-label={swatchToken}
                aria-pressed={colorToken === swatchToken}
                onClick={() => updateAttributes({ colorToken: swatchToken })}
                data-testid={`note-callout-color-${swatchToken}`}
                style={{ backgroundColor: `var(--note-highlight-${swatchToken})` }}
                className={cn(
                  'border-border h-6 w-6 rounded-full border',
                  colorToken === swatchToken && 'ring-ring ring-offset-background ring-2 ring-offset-1'
                )}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </NodeViewWrapper>
  );
};

export const NoteCallout = Node.create({
  // Node type name is dictated by the backend's content allowlist
  // (nicoflow-api content.go `allowedNodes`) — must stay "callout".
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      icon: {
        default: DEFAULT_ICON,
        parseHTML: element => parseIcon(element.getAttribute('data-icon')),
        renderHTML: attributes => ({ 'data-icon': parseIcon(attributes.icon as string | null) }),
      },
      colorToken: {
        default: DEFAULT_COLOR,
        parseHTML: element => parseColor(element.getAttribute('data-token')),
        renderHTML: attributes => ({ 'data-token': parseColor(attributes.colorToken as string | null) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-note-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-note-callout': '' }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      setNoteCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { icon: attrs.icon ?? DEFAULT_ICON, colorToken: attrs.colorToken ?? DEFAULT_COLOR },
            content: [{ type: 'paragraph' }],
          }),
      updateNoteCalloutAttrs:
        attrs =>
        ({ commands }) =>
          commands.updateAttributes(this.name, attrs),
    };
  },
});
