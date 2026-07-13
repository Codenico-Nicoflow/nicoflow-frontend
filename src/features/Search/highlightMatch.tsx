import { Fragment, type ReactNode } from 'react';

// Splits `text` into segments, wrapping every case-insensitive occurrence of any
// query word in a <mark> so the matched part reads back to the user (type-ahead
// affordance). Mirrors the backend's prefix match: it highlights on word starts,
// but a plain substring hit anywhere is still marked — the goal is orientation,
// not exactness. Query words are escaped so regex metacharacters are literal.
export const highlightMatch = (text: string, query: string): ReactNode => {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(escapeRegExp);

  if (words.length === 0) return text;

  // Capture group → split keeps the delimiters; matched slices land at odd
  // indices, so parity (not a stateful .test) tells us what to mark. Empty
  // strings from split are kept so parity stays intact; they render nothing.
  const pattern = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-[0.2rem] bg-primary/15 text-foreground">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
