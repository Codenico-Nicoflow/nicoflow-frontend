import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';

import i18n from '@/lib/i18n';
import { mockUser } from '@/mocks/handlers';

import { AIMessage } from './components/AIMessage';
import { AIDisabledBanner, QuotaIndicator, QuotaWall } from './components/QuotaIndicator';
import type { QuotaStatus } from './quota';
import { deriveQuota } from './quota';

const authedStore = () => createMockStore({ auth: { user: mockUser, token: 'tok', isLoading: false } });

const freeExhausted = deriveQuota({ used: 5, limit: 5, scope: 'lifetime', month: null }) as QuotaStatus;
const proUnder = deriveQuota({ used: 12, limit: 500, scope: 'month', month: '2026-07' }) as QuotaStatus;

// Other suites assert on English copy, so always hand the singleton back.
afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('AI feature translations', () => {
  describe.each([
    ['he', 'rtl'],
    ['ru', 'ltr'],
  ])('%s', (lang, dir) => {
    it(`renders quota copy translated with ${dir} document direction`, async () => {
      await i18n.changeLanguage(lang);
      renderComponent(<QuotaIndicator quota={proUnder} />, { store: authedStore() });

      expect(document.documentElement.dir).toBe(dir);
      // Counts still interpolate, but the surrounding copy must not be English.
      const label = screen.getByTestId('ai-quota-label').textContent ?? '';
      expect(label).toContain('12');
      expect(label).toContain('500');
      expect(label).not.toContain('this month');
    });

    it('renders the upgrade wall translated', async () => {
      await i18n.changeLanguage(lang);
      renderComponent(<QuotaWall quota={freeExhausted} />, { store: authedStore() });

      expect(screen.getByTestId('ai-quota-upgrade-cta')).toBeInTheDocument();
      expect(screen.queryByText("You've used all your free messages")).not.toBeInTheDocument();
    });

    it('renders the feature-disabled banner translated', async () => {
      await i18n.changeLanguage(lang);
      renderComponent(<AIDisabledBanner />, { store: authedStore() });

      expect(screen.getByTestId('ai-disabled-banner')).toBeInTheDocument();
      expect(screen.queryByText('The AI assistant is unavailable')).not.toBeInTheDocument();
    });

    it('announces the streaming state translated', async () => {
      await i18n.changeLanguage(lang);
      renderComponent(<AIMessage role="assistant" content="x" streaming />, { store: authedStore() });

      expect(screen.queryByText('Generating a response')).not.toBeInTheDocument();
      expect(screen.getByText(i18n.t('ai:chat.streamingStatus'))).toBeInTheDocument();
    });

    it('maps an error code to translated copy on a failed turn', async () => {
      await i18n.changeLanguage(lang);
      renderComponent(
        <AIMessage role="user" content="x" status="error" errorCode="AI_LIMIT_REACHED" onRetry={vi.fn()} />,
        {
          store: authedStore(),
        }
      );

      expect(screen.getByTestId('ai-message-error')).toHaveTextContent(i18n.t('ai:chat.error.limitReached'));
    });
  });

  it('mirrors the assistant bubble to the inline start under RTL', async () => {
    await i18n.changeLanguage('he');
    renderComponent(<AIMessage role="assistant" content="שלום" />, { store: authedStore() });

    // Logical properties (items-start / ms-*) do the mirroring, so the class set
    // must stay logical — a physical `ml-`/`left-` would break RTL silently.
    expect(screen.getByTestId('ai-message-assistant')).toHaveClass('items-start');
  });
});
