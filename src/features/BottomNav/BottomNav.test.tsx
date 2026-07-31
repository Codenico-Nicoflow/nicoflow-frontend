import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { NAV_DESTINATIONS, OVERFLOW_DESTINATIONS, PRIMARY_DESTINATIONS } from '@/features/Rail/data';
import { makeUser } from '@/mocks/handlers';

import { BottomNav } from './index';

const proStore = () =>
  createMockStore({ auth: { user: makeUser({ status: 'premium' }), token: 't', isLoading: false } });

const openMore = async () => {
  await userEvent.click(screen.getByTestId('bottomnav-more'));
  return screen.findByTestId('bottomnav-more-sheet');
};

describe('BottomNav', () => {
  it('splits the destinations into four primary cells and an overflow group', () => {
    expect(PRIMARY_DESTINATIONS).toHaveLength(4);
    expect(PRIMARY_DESTINATIONS.map(d => d.id)).toEqual(['inbox', 'today', 'areas', 'calendar']);
    expect(OVERFLOW_DESTINATIONS.map(d => d.id)).toEqual(['focus', 'ai']);
    expect(PRIMARY_DESTINATIONS.length + OVERFLOW_DESTINATIONS.length).toBe(NAV_DESTINATIONS.length);
  });

  it('renders the four primary destinations plus a More trigger', () => {
    renderComponent(<BottomNav />, { initialRoute: '/quick-access/today' });

    for (const dest of PRIMARY_DESTINATIONS) {
      expect(screen.getByTestId(`bottomnav-${dest.id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('bottomnav-more')).toBeInTheDocument();
    for (const dest of OVERFLOW_DESTINATIONS) {
      expect(screen.queryByTestId(`bottomnav-${dest.id}`)).not.toBeInTheDocument();
    }
  });

  it('reveals Focus and AI when More is opened', async () => {
    renderComponent(<BottomNav />, { initialRoute: '/quick-access/today' });

    await openMore();

    expect(screen.getByTestId('bottomnav-focus')).toHaveAttribute('href', '/quick-access/focus');
    expect(screen.getByTestId('bottomnav-ai')).toHaveAttribute('href', '/ai');
  });

  it('exposes the trigger expanded state', async () => {
    renderComponent(<BottomNav />, { initialRoute: '/quick-access/today' });
    const trigger = screen.getByTestId('bottomnav-more');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await openMore();

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the sheet on Escape', async () => {
    renderComponent(<BottomNav />, { initialRoute: '/quick-access/today' });
    await openMore();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByTestId('bottomnav-more-sheet')).not.toBeInTheDocument());
  });

  it('closes the sheet after navigating to an overflow destination', async () => {
    renderComponent(<BottomNav />, { initialRoute: '/quick-access/today' });
    await openMore();

    await userEvent.click(screen.getByTestId('bottomnav-ai'));

    await waitFor(() => expect(screen.queryByTestId('bottomnav-more-sheet')).not.toBeInTheDocument());
  });

  it('moves focus into the sheet while it is open', async () => {
    renderComponent(<BottomNav />, { initialRoute: '/quick-access/today' });

    const sheet = await openMore();

    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));
  });

  describe('active state', () => {
    it('marks the matching primary cell active', () => {
      renderComponent(<BottomNav />, { initialRoute: '/areas' });

      expect(screen.getByTestId('bottomnav-areas')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId('bottomnav-inbox')).not.toHaveAttribute('aria-current');
    });

    it.each(['/ai', '/quick-access/focus'])('shows the More trigger as active on %s', route => {
      renderComponent(<BottomNav />, { initialRoute: route });

      expect(screen.getByTestId('bottomnav-more')).toHaveClass('text-primary');
    });

    it('leaves the More trigger inactive on a primary route', () => {
      renderComponent(<BottomNav />, { initialRoute: '/areas' });

      expect(screen.getByTestId('bottomnav-more')).not.toHaveClass('text-primary');
    });

    it('carries a non-colour channel on the active cell', () => {
      renderComponent(<BottomNav />, { initialRoute: '/areas' });

      // Colour alone would fail WCAG 1.4.1, so the active cell also gets a
      // filled pill behind its icon.
      const pill = (id: string) => screen.getByTestId(id).querySelector<HTMLElement>('.bg-primary\\/15');
      expect(pill('bottomnav-areas')).toBeInTheDocument();
      expect(pill('bottomnav-inbox')).not.toBeInTheDocument();
    });
  });

  describe('pro gating', () => {
    it('locks Calendar for a free user', () => {
      renderComponent(<BottomNav />, { initialRoute: '/areas' });

      expect(screen.getByTestId('bottomnav-calendar-lock')).toBeInTheDocument();
    });

    it('drops the lock for a pro user', () => {
      renderComponent(<BottomNav />, { initialRoute: '/areas', store: proStore() });

      expect(screen.queryByTestId('bottomnav-calendar-lock')).not.toBeInTheDocument();
    });
  });

  it('clears the home indicator with a safe-area inset', () => {
    renderComponent(<BottomNav />, { initialRoute: '/areas' });

    expect(screen.getByRole('navigation')).toHaveClass('pb-[env(safe-area-inset-bottom)]');
  });
});
