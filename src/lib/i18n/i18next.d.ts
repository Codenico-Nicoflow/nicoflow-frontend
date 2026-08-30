import type { Resources } from '@nicoflow/shared/i18n';

import type { recurrenceExtensionsEn } from './recurrenceExtensions';

// Make t('...') fully type-safe and autocompleted: keys are derived from the EN
// resource shape (the source-of-record), so a typo'd or missing key is a
// type-check error — not a silent runtime miss. This is what lets the string
// extraction be self-verifying and keeps us within the no-`any` rule.
//
// The `recurrence` namespace is extended with local keys (new backend tools,
// editScope flow) that aren't yet in the published @nicoflow/shared package.
// When the shared package is updated and picks them up, remove the merge here.
type ExtendedRecurrence = Resources['en']['recurrence'] & typeof recurrenceExtensionsEn;

type ExtendedResources = {
  [Locale in keyof Resources]: Omit<Resources[Locale], 'recurrence'> & {
    recurrence: ExtendedRecurrence;
  };
};

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: ExtendedResources;
    returnNull: false;
  }
}
