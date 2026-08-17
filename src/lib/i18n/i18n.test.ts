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

// Structural guards over the locale JSON itself. These catch the two ways a
// translation silently regresses: a key added to en but not he/ru (renders the
// English string to a Hebrew user), and a plural key missing Hebrew's `_two`
// form (count=2 falls back and leaks English mid-sentence).
describe('locale files', () => {
  const en = import.meta.glob<Record<string, unknown>>('../../../packages/shared/src/i18n/locales/en/*.json', {
    eager: true,
  });
  const he = import.meta.glob<Record<string, unknown>>('../../../packages/shared/src/i18n/locales/he/*.json', {
    eager: true,
  });
  const ru = import.meta.glob<Record<string, unknown>>('../../../packages/shared/src/i18n/locales/ru/*.json', {
    eager: true,
  });

  // Flatten a namespace object to dotted leaf paths.
  const leaves = (value: unknown, prefix = ''): string[] => {
    if (value === null || typeof value !== 'object') return [prefix];
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      leaves(v, prefix ? `${prefix}.${k}` : k)
    );
  };

  const namespaces = (mod: Record<string, Record<string, unknown>>) =>
    Object.fromEntries(
      Object.entries(mod).map(([path, m]) => [path.split('/').pop() ?? path, leaves(m['default'] ?? m).sort()])
    );

  const enNs = namespaces(en);

  it.each([
    ['he', he],
    ['ru', ru],
  ])('%s has every key en has, in every namespace', (_lang, mod) => {
    const target = namespaces(mod as Record<string, Record<string, unknown>>);
    for (const [ns, keys] of Object.entries(enNs)) {
      const missing = keys.filter(k => !(target[ns] ?? []).includes(k));
      expect({ namespace: ns, missing }).toEqual({ namespace: ns, missing: [] });
    }
  });

  // Hebrew's dual: any key with a `_one` form needs a matching `_two`, or count=2
  // resolves to the English fallback and produces a mixed-language string.
  it('he supplies a _two form for every plural key', () => {
    const heNs = namespaces(he);
    for (const [ns, keys] of Object.entries(heNs)) {
      const missingTwo = keys
        .filter(k => k.endsWith('_one'))
        .map(k => k.replace(/_one$/, '_two'))
        .filter(k => !keys.includes(k));
      expect({ namespace: ns, missingTwo }).toEqual({ namespace: ns, missingTwo: [] });
    }
  });
});
