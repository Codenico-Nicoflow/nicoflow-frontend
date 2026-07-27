import type { ComponentProps } from 'react';
import type { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Hardened markdown config for assistant output — untrusted LLM text. This is a
// security surface, not styling; the requirements below are load-bearing (E-026 /
// E-027 Security table). Any change here is a security review item.
//
//   1. Raw HTML stays ESCAPED. react-markdown escapes HTML by default; we simply
//      never add `rehype-raw`. There is also no `dangerouslySetInnerHTML` in this
//      feature. A `<script>` in model output renders as visible text, not a node.
//   2. Images are BLOCKED. A markdown image fires a GET on render — the classic
//      LLM-chat exfiltration channel. `disallowedElements: ['img']` drops the
//      node; `unwrapDisallowed` keeps any alt/child text.
//   3. Links are SAFE. The `a` override forces `target=_blank` +
//      `rel=noopener noreferrer` so a link can't reach `window.opener` or leak the
//      referrer, and never auto-navigates (it's a plain anchor the user clicks).
//   4. Code blocks are plain `pre > code` — no syntax-highlight lib that injects
//      HTML.

// SafeLink renders every markdown anchor with the hardened attributes. href comes
// from the parsed markdown (a URL literal), never executed.
const SafeLink = ({ href, children, ...props }: ComponentProps<'a'>) => (
  <a {...props} href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

// markdownOptions is the single shared config consumed by AIMessage. Exported so
// the security tests assert against the exact object the app renders with.
export const markdownOptions: Readonly<Options> = {
  remarkPlugins: [remarkGfm],
  // No rehypePlugins — adding rehype-raw here would un-escape model HTML (XSS).
  disallowedElements: ['img'],
  unwrapDisallowed: true,
  components: { a: SafeLink },
};
