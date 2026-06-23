import { afterEach, describe, expect, it } from 'vitest';

import i18n, { SUPPORTED_LANGUAGES } from '.';

// Tests run with i18n already initialised (the singleton imports synchronously).
// Always restore English afterwards so other suites that assert on English copy
// (the toast tests, component tests) aren't affected by a left-over language.
afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('i18n configuration', () => {
  it('supports exactly en, he and ru', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'he', 'ru']);
  });

  it('falls back to English', () => {
    expect(i18n.options.fallbackLng).toContain('en');
  });

  it('resolves a known key in all three languages', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common:actions.cancel')).toBe('Cancel');

    await i18n.changeLanguage('he');
    expect(i18n.t('common:actions.cancel')).toBe('ביטול');

    await i18n.changeLanguage('ru');
    expect(i18n.t('common:actions.cancel')).toBe('Отмена');
  });

  it('resolves an error-namespace key (used by toasts) per language', async () => {
    await i18n.changeLanguage('he');
    expect(i18n.t('errors:PLAN_LIMIT_EXCEEDED')).not.toBe('PLAN_LIMIT_EXCEEDED');
    expect(i18n.t('errors:PLAN_LIMIT_EXCEEDED').length).toBeGreaterThan(0);
  });

  it('reports rtl direction for Hebrew and ltr for en/ru', () => {
    expect(i18n.dir('he')).toBe('rtl');
    expect(i18n.dir('en')).toBe('ltr');
    expect(i18n.dir('ru')).toBe('ltr');
  });

  it('syncs <html> dir and lang on language change', async () => {
    await i18n.changeLanguage('he');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');

    await i18n.changeLanguage('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('falls back to English for a missing translation', async () => {
    // A namespace value present in en is the fallback when a language omits it.
    await i18n.changeLanguage('en');
    const enValue = i18n.t('common:appName');
    expect(enValue).toBe('Nicoflow');
  });
});
