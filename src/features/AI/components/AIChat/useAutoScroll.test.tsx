import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAutoScroll } from './useAutoScroll';

// Give a jsdom element scroll geometry (jsdom reports 0 for all of it) + a
// spy-able scrollTo (jsdom doesn't implement it).
const setGeometry = (el: HTMLElement, { scrollHeight, clientHeight, scrollTop }: Record<string, number>) => {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(el, 'scrollTop', { configurable: true, writable: true, value: scrollTop });
};

// Renders the hook attached to a real DOM node and hands the live API back so a
// test can drive the element and read pinned/scroll behaviour.
type Api = ReturnType<typeof useAutoScroll<HTMLDivElement>>;

const mount = () => {
  let api!: Api;
  const Host = () => {
    api = useAutoScroll<HTMLDivElement>();
    return <div ref={api.ref} data-testid="scroll" />;
  };
  const { getByTestId } = render(<Host />);
  const el = getByTestId('scroll');
  el.scrollTo = vi.fn() as unknown as HTMLElement['scrollTo'];
  return { el, get: () => api };
};

describe('useAutoScroll', () => {
  it('starts pinned', () => {
    const { get } = mount();
    expect(get().pinned).toBe(true);
  });

  it('unpins when scrolled away from the bottom, re-pins at the bottom', async () => {
    const { el, get } = mount();

    setGeometry(el, { scrollHeight: 1000, clientHeight: 400, scrollTop: 200 }); // 400px up
    el.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(get().pinned).toBe(false));

    setGeometry(el, { scrollHeight: 1000, clientHeight: 400, scrollTop: 600 }); // at bottom
    el.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(get().pinned).toBe(true));
  });

  it('scrollToBottom follows only while pinned', async () => {
    const { el, get } = mount();
    setGeometry(el, { scrollHeight: 1000, clientHeight: 400, scrollTop: 600 });

    get().scrollToBottom();
    expect(el.scrollTo).toHaveBeenCalled();

    setGeometry(el, { scrollHeight: 1000, clientHeight: 400, scrollTop: 100 });
    el.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(get().pinned).toBe(false));

    (el.scrollTo as ReturnType<typeof vi.fn>).mockClear();
    get().scrollToBottom();
    expect(el.scrollTo).not.toHaveBeenCalled();
  });

  it('jumpToLatest re-pins and scrolls down even when unpinned', async () => {
    const { el, get } = mount();
    setGeometry(el, { scrollHeight: 1000, clientHeight: 400, scrollTop: 0 });
    el.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(get().pinned).toBe(false));

    get().jumpToLatest();
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    await waitFor(() => expect(get().pinned).toBe(true));
  });
});
