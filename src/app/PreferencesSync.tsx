import { useEffect, useRef } from 'react';

import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

import { useAppUser } from '@/lib/store';

// Applies a logged-in user's saved language + theme on login / session-restore —
// "server wins". When the persisted user appears (or changes), push their
// preferences into i18next and next-themes so the app reflects the account, not
// just whatever the browser last had in localStorage. Both libraries already
// persist to localStorage themselves, so this also keeps the local copy in sync.
//
// Logged out, this does nothing — the app keeps the localStorage/browser default
// and the auth screens stay English (their own decision, not driven here).
export const PreferencesSync = () => {
  const user = useAppUser();
  const { i18n } = useTranslation();
  const { setTheme } = useTheme();

  // Track what we last applied so we only act when the saved value actually
  // changes — never fight a deliberate in-session switch the user just made
  // (those update the user object too, so this stays consistent).
  const appliedLang = useRef<string | null>(null);
  const appliedTheme = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      appliedLang.current = null;
      appliedTheme.current = null;
      return;
    }

    if (user.language && user.language !== appliedLang.current) {
      appliedLang.current = user.language;
      if (i18n.resolvedLanguage !== user.language) {
        void i18n.changeLanguage(user.language);
      }
    }

    if (user.theme && user.theme !== appliedTheme.current) {
      appliedTheme.current = user.theme;
      setTheme(user.theme);
    }
  }, [user, i18n, setTheme]);

  return null;
};
