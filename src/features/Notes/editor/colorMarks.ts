import { Mark } from '@tiptap/core';

import { isNoteColorToken, type NoteColorToken } from './colorTokens';

// Two independent marks, textColor and highlight — a note can have both on the
// same run of text (AC2), same as bold + italic can coexist. Each stores a
// TOKEN NAME as its `color` attr — never a computed color — resolved to a real
// hex via a CSS custom property in src/index.css (rendered on the DOM as
// `data-token`, an internal styling hook unrelated to the stored attr name).
// A garbage/unknown value is coerced to null rather than trusted through to a
// class or inline style — the allowlist is enforced at the parse boundary,
// same defensive posture as the link mark's protocol allowlist.
//
// Mark name ("textColor"/"highlight") and the attr key ("color") are dictated
// by the backend's content validator (nicoflow-api content.go) — renaming
// either without updating the backend allowlist breaks every save.
const parseToken = (value: string | null): NoteColorToken | null => (isNoteColorToken(value) ? value : null);

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textColor: {
      setNoteTextColor: (token: NoteColorToken) => ReturnType;
      unsetNoteTextColor: () => ReturnType;
    };
    highlight: {
      setNoteHighlight: (token: NoteColorToken) => ReturnType;
      unsetNoteHighlight: () => ReturnType;
    };
  }
}

export const NoteTextColor = Mark.create({
  name: 'textColor',

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => parseToken(element.getAttribute('data-token')),
        renderHTML: attributes => {
          const token = parseToken(attributes.color as string | null);
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
          commands.setMark(this.name, { color: token }),
      unsetNoteTextColor:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

export const NoteHighlight = Mark.create({
  name: 'highlight',

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => parseToken(element.getAttribute('data-token')),
        renderHTML: attributes => {
          const token = parseToken(attributes.color as string | null);
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
          commands.setMark(this.name, { color: token }),
      unsetNoteHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
