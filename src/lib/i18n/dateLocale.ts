import type { Locale } from 'date-fns/locale';
import { enUS, he, ru } from 'date-fns/locale';

import type { SupportedLanguage } from './index';

// Maps an app language to its date-fns locale, used by the date picker and any
// date `format()` call so month/weekday names follow the active language.
const DATE_LOCALES = { en: enUS, he, ru } satisfies Record<SupportedLanguage, Locale>;

export const getDateLocale = (lng: string): Locale => DATE_LOCALES[lng as SupportedLanguage] ?? enUS;
