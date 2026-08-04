// The ProseMirror/Tiptap document shape, as it travels over the wire (E-053).
// Deliberately structural rather than an enum of node types: the server's
// flattenDoc walker reads only {type, content[], text}, so a new node type added
// on the client needs no server change. Typing `type` as a closed union here
// would make the client the stricter of the two and break that property.
//
// Attribute values are JSON, so they get a real recursive JSON type instead of
// `any` — a node's attrs can nest objects/arrays (e.g. a table cell's colwidth).
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// A mark is inline formatting applied to a text leaf (bold, link, code).
export interface TiptapMark {
  type: string;
  attrs?: Record<string, JsonValue>;
}

// One node in the document tree. Branch nodes carry `content`; text leaves carry
// `text` (+ optional `marks`). Both are optional because the same shape covers
// every level, including the empty-doc default {"type":"doc","content":[]}.
export interface TiptapDoc {
  type: string;
  content?: TiptapDoc[];
  text?: string;
  attrs?: Record<string, JsonValue>;
  marks?: TiptapMark[];
}

// The server's default for a note created without content. NOT_NULL in the DB,
// so the client never branches on null-vs-empty — it branches on nothing.
export const EMPTY_TIPTAP_DOC: TiptapDoc = { type: 'doc', content: [] };

// A doc with no children renders as a literally empty ProseMirror: no paragraph
// to place a cursor in, so the placeholder never attaches and every toolbar
// command is a no-op on an empty selection. Every new note starts at exactly
// that value, so seed one empty paragraph for the editor to work against. The
// wire shape is untouched — this normalizes on the way IN only.
export const withEditableBody = (doc: TiptapDoc): TiptapDoc =>
  doc.content && doc.content.length > 0 ? doc : { ...doc, content: [{ type: 'paragraph' }] };
