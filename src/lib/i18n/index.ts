import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { he } from './locales/he';
import { ru } from './locales/ru';

export const SUPPORTED_LANGUAGES = ['en', 'he', 'ru'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// The single localStorage key for the chosen language — mirrors the
// `next-themes` convention (`storageKey="nicoflow-theme"`) so language and theme
// preferences sit side by side. The detector reads/writes this; nothing else
// should touch it directly.
export const LANGUAGE_STORAGE_KEY = 'nicoflow-lang';

// Namespaces: split keys per domain so each locale file stays readable. `common`
// is the default so callers can `t('actions.cancel')` without a prefix, while
// feature copy is reached via `useTranslation('area')` etc.
export const NAMESPACES = [
  'common',
  'auth',
  'area',
  'project',
  'task',
  'bucket',
  'nav',
  'errors',
  'notification',
] as const;

// Keep <html lang>/<html dir> in sync with the active language. i18next.dir()
// returns 'rtl' for Hebrew and 'ltr' otherwise, which is exactly what the RTL
// layout (logical Tailwind props) keys off. Run on every change AND once on init
// so the very first paint is already correct.
const applyDocumentDirection = (lng: string) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, he, ru },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'en',
    ns: NAMESPACES,
    defaultNS: 'common',
    // Resources are bundled statically (small app, no async backend loader), so
    // i18next is ready synchronously — no Suspense fallback is ever actually
    // shown, but we keep react-i18next's default and wrap in <Suspense> anyway.
    returnNull: false,
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', applyDocumentDirection);
applyDocumentDirection(i18n.resolvedLanguage ?? 'en');

export default i18n;
