import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createMockStore, renderComponent } from '../../../__tests__/renderComponent';

import { RateLimitBanner } from '.';

describe('RateLimitBanner', () => {
  it('renders nothing when not rate-limited', () => {
    renderComponent(<RateLimitBanner />, { store: createMockStore({ rateLimit: { retryAt: null } }) });
    expect(screen.queryByTestId('rate-limit-banner')).not.toBeInTheDocument();
  });

  it('shows the countdown while rate-limited', () => {
    const store = createMockStore({ rateLimit: { retryAt: Date.now() + 5000 } });
    renderComponent(<RateLimitBanner />, { store });
    expect(screen.getByTestId('rate-limit-banner')).toBeInTheDocument();
  });

  it('auto-clears once the retry time passes', async () => {
    const store = createMockStore({ rateLimit: { retryAt: Date.now() + 900 } });
    renderComponent(<RateLimitBanner />, { store });

    expect(screen.getByTestId('rate-limit-banner')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('rate-limit-banner')).not.toBeInTheDocument(), { timeout: 2500 });
    expect(store.getState().rateLimit.retryAt).toBeNull();
  });
});
