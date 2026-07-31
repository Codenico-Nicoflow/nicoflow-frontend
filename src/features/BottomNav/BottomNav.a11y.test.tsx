import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import i18n from '@/lib/i18n';

import { BottomNav } from './index';

expect.extend(toHaveNoViolations);

// A phone cell is roughly 75px wide at the narrowest supported viewport. jsdom
// has no layout, so overflow is asserted on the label's character budget — the
// bug was page titles ("Расклад по времени") sitting in a nav slot.
const MAX_NAV_LABEL_CHARS = 12;
const NAV_LABEL_KEYS = ['inbox', 'timeSpread', 'areas', 'calendar', 'focus', 'ai', 'more'] as const;

describe('BottomNav accessibility', () => {
  it('has no violations in the collapsed bar', async () => {
    const { container } = renderComponent(<BottomNav />, { initialRoute: '/areas' });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with the overflow sheet open', async () => {
    const { baseElement } = renderComponent(<BottomNav />, { initialRoute: '/areas' });
    await userEvent.click(screen.getByTestId('bottomnav-more'));
    await screen.findByTestId('bottomnav-more-sheet');

    // The sheet portals outside the container, so audit the whole document.
    expect(await axe(baseElement)).toHaveNoViolations();
  });

  it('names the locked Calendar cell with its pro hint', () => {
    renderComponent(<BottomNav />, { initialRoute: '/areas' });

    expect(screen.getByTestId('bottomnav-calendar')).toHaveAccessibleName(/Calendar/);
  });

  describe.each(['en', 'he', 'ru'])('%s nav labels fit their cell', locale => {
    it.each(NAV_LABEL_KEYS)('%s', key => {
      const label = i18n.getFixedT(locale, 'nav')(key);

      expect(label.length).toBeLessThanOrEqual(MAX_NAV_LABEL_CHARS);
    });
  });
});
