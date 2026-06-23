import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '@/lib/i18n';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';
import type { IUser } from '@/lib/types';

// Single place that changes the user's language/theme. It always applies the
// change locally (i18next + next-themes, which persist to localStorage), and —
// when the user is authenticated — also PATCHes the profile so the choice syncs
// across devices ("server wins" applies it back on the next login). Logged out,
// it's local-only, so the language switcher still works on the public/auth pages
// without hitting the API.
export const usePreferences = () => {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useAppUser();
  const [updateProfile] = useUpdateProfileMutation();

  const language = (i18n.resolvedLanguage ?? 'en') as SupportedLanguage;

  const changeLanguage = (next: SupportedLanguage) => {
    void i18n.changeLanguage(next);
    if (user) void updateProfile({ language: next });
  };

  const changeTheme = (next: IUser['theme']) => {
    setTheme(next);
    if (user) void updateProfile({ theme: next });
  };

  // "System" follows the OS preference. It's applied locally only — the profile
  // stores a concrete 'light'|'dark' (per the contract), so we don't PATCH a
  // 'system' value; the user's last explicit choice remains their saved theme.
  const setSystemTheme = () => setTheme('system');

  return { language, theme, changeLanguage, changeTheme, setSystemTheme };
};
