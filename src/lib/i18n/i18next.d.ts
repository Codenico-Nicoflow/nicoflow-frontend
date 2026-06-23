import type { Resources } from './locales/en';

// Make t('...') fully type-safe and autocompleted: keys are derived from the EN
// resource shape (the source-of-record), so a typo'd or missing key is a
// type-check error — not a silent runtime miss. This is what lets the string
// extraction be self-verifying and keeps us within the no-`any` rule.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
    returnNull: false;
  }
}
