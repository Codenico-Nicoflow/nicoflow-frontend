import enErrors from '@/lib/i18n/locales/en/errors.json';

// Toast message *keys*. Historically this object mapped each name to an English
// string; it now maps each name to itself (the i18n key in the `errors`
// namespace). Call sites keep using `ToastMessages.AREA_DELETED`, but the value
// is the key `'AREA_DELETED'`, which `showSuccessToast` / `showErrorToast`
// resolve to the active language via i18n. Source of the key set is the EN
// `errors.json` so the two can never drift.
type ErrorKey = keyof typeof enErrors;

export const ToastMessages = Object.fromEntries((Object.keys(enErrors) as ErrorKey[]).map(key => [key, key])) as {
  [K in ErrorKey]: K;
};
