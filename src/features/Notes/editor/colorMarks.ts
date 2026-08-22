import { Mark } from '@tiptap/core';

import { isNoteColorToken, type NoteColorToken } from './colorTokens';

// Two independent marks, textColor and highlight — a note can have both on the
// same run of text (AC2), same as bold + italic can coexist. Each stores a
// TOKEN NAME, never a computed color: `data-token` on the DOM, resolved to a
// real hex via a CSS custom property in src/index.css. A garbage/unknown
// token attribute is coerced to null rather than trusted through to a class or
// inline style — the allowlist is enforced at the parse boundary, same
// defensive posture as the link mark's protocol allowlist.
const parseToken = (value: string | null): NoteColorToken | null => (isNoteColorToken(value) ? value : null);

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteTextColor: {
      setNoteTextColor: (token: NoteColorToken) => ReturnType;
      unsetNoteTextColor: () => ReturnType;
    };
    noteHighlight: {
      setNoteHighlight: (token: NoteColorToken) => ReturnType;
      unsetNoteHighlight: () => ReturnType;
    };
  }
}

export const NoteTextColor = Mark.create({
  name: 'noteTextColor',

  addAttributes() {
    return {
      token: {
        default: null,
        parseHTML: element => parseToken(element.getAttribute('data-token')),
        renderHTML: attributes => {
          const token = parseToken(attributes.token as string | null);
          return token ? { 'data-token': token } : {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-note-text-color]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-note-text-color': '' }, 0];
  },

  addCommands() {
    return {
      setNoteTextColor:
        (token: NoteColorToken) =>
        ({ commands }) =>
          commands.setMark(this.name, { token }),
      unsetNoteTextColor:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

export const NoteHighlight = Mark.create({
  name: 'noteHighlight',

  addAttributes() {
    return {
      token: {
        default: null,
        parseHTML: element => parseToken(element.getAttribute('data-token')),
        renderHTML: attributes => {
          const token = parseToken(attributes.token as string | null);
          return token ? { 'data-token': token } : {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'mark[data-note-highlight]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', { ...HTMLAttributes, 'data-note-highlight': '' }, 0];
  },

  addCommands() {
    return {
      setNoteHighlight:
        (token: NoteColorToken) =>
        ({ commands }) =>
          commands.setMark(this.name, { token }),
      unsetNoteHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
