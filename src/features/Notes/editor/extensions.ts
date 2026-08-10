import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import type { Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// The note schema (E-054). This list IS the security and scope boundary for the
// feature: Tiptap parses through the schema, so anything not registered here is
// dropped rather than rendered. Nothing in the note render path uses
// dangerouslySetInnerHTML, and no HTML round-trip exists — stored JSON in, schema
// out. Keep this file small and reviewable; that is the point of it.
//
// Deliberately ABSENT: Image. Leaving the node unregistered enforces the
// no-inline-images scope at the schema level — a pasted <img> is dropped on
// parse, so it can never become a broken render or an unreferenced upload.
// Adding it later is purely additive. Attachments cover files (ownerType "note").

// http/https/mailto only, so `javascript:` and `data:` URLs cannot be authored.
// Same posture as the hardened AI markdown renderer (NIC-1756).
export const ALLOWED_LINK_PROTOCOLS = ['http', 'https', 'mailto'] as const;

// Autolink runs on typed text, which never passes through the toolbar's own
// validation, so it gets the same allowlist rather than trusting linkify's
// broader default.
export const isAllowedLinkProtocol = (url: string): boolean =>
  ALLOWED_LINK_PROTOCOLS.some(protocol => url.toLowerCase().startsWith(`${protocol}:`));

// Ctrl/Cmd-click on a link opens it. Re-checked here rather than trusted from
// the DOM: the href is attacker-controlled content, and this is the one place
// the app turns a stored value into a navigation.
export const openLinkFromEvent = (event: MouseEvent): boolean => {
  if (!event.ctrlKey && !event.metaKey) return false;

  const anchor = (event.target as HTMLElement | null)?.closest('a');
  const href = anchor?.getAttribute('href');
  if (!href || !isAllowedLinkProtocol(href)) return false;

  window.open(href, '_blank', 'noopener,noreferrer');
  return true;
};

export type NoteEditorExtensionOptions = {
  placeholder: string;
};

export const createNoteExtensions = ({ placeholder }: NoteEditorExtensionOptions): Extensions => [
  StarterKit.configure({
    // Link ships INSIDE StarterKit in Tiptap v3 — configuring a separate
    // @tiptap/extension-link alongside it registers the mark twice and warns.
    link: {
      protocols: [...ALLOWED_LINK_PROTOCOLS],
      // defaultValidate already enforces `protocols`; the extra guard rejects
      // the protocol-relative and scheme-less forms that slip past a naive
      // startsWith check.
      isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && !url.startsWith('//'),
      shouldAutoLink: isAllowedLinkProtocol,
      // rel="noopener noreferrer nofollow" + target="_blank" are Tiptap's
      // defaults. Not overriding them is what keeps them — passing rel: null
      // would strip them.
      //
      // Ctrl/Cmd-click follows the link; a plain click places the caret so the
      // text stays editable. Opening on a plain click would make it impossible
      // to put the cursor inside a link to fix a typo.
      openOnClick: 'whenNotEditable',
    },
  }),
  TableKit,
  // Not nestable — flat checklists are the product ask; nesting adds an
  // indent/outdent interaction this editor doesn't otherwise expose.
  TaskItem.configure({ nested: false }),
  TaskList,
  Placeholder.configure({ placeholder }),
];
