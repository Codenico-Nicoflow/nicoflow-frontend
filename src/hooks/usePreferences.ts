import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { SupportedLanguage } from '@/lib/i18n';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';
import type { IUser } from '@/lib/types';

// Single place that changes the user's language/theme.
//
// Logged out: local-only (i18next + next-themes persist to localStorage), so
// the switcher still works on the public/auth pages without hitting the API.
//
// Logged in: the change is optimistic — applied locally first for an instant
// response, then PATCHed to the profile. If the PATCH fails we REVERT the local
// change and toast, so the UI never shows a state that won't survive a refresh.
// (It would not: the persisted `user` still holds the old value, and
// PreferencesSync re-applies "server wins" on reload, clobbering the local-only
// choice. Reverting keeps device and account consistent.)
export const usePreferences = () => {
  const { i18n, t } = useTranslation('errors');
  const { theme, setTheme } = useTheme();
  const user = useAppUser();
  const [updateProfile] = useUpdateProfileMutation();

  const language = (i18n.resolvedLanguage ?? 'en') as SupportedLanguage;

  const changeLanguage = (next: SupportedLanguage) => {
    const previous = language;
    if (next === previous) return;
    void i18n.changeLanguage(next);
    if (!user) return; // logged out → local-only, nothing to sync or revert.
    void updateProfile({ language: next })
      .unwrap()
      .catch(() => {
        void i18n.changeLanguage(previous); // revert: server is the source of truth.
        toast.error(t('PREFERENCES_UPDATE_FAILED'));
      });
  };

  const changeTheme = (next: IUser['theme']) => {
    const previous = theme;
    if (next === previous) return;
    setTheme(next);
    if (!user) return;
    void updateProfile({ theme: next })
      .unwrap()
      .catch(() => {
        if (previous) setTheme(previous); // revert to the prior theme.
        toast.error(t('PREFERENCES_UPDATE_FAILED'));
      });
  };

  // "System" follows the OS preference. It's applied locally only — the profile
  // stores a concrete 'light'|'dark' (per the contract), so we don't PATCH a
  // 'system' value; the user's last explicit choice remains their saved theme.
  const setSystemTheme = () => setTheme('system');

  return { language, theme, changeLanguage, changeTheme, setSystemTheme };
};
