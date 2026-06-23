import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
  const { i18n, t } = useTranslation('errors');
  const { theme, setTheme } = useTheme();
  const user = useAppUser();
  const [updateProfile] = useUpdateProfileMutation();

  const language = (i18n.resolvedLanguage ?? 'en') as SupportedLanguage;

  // The local change is applied first and intentionally NOT rolled back on a
  // failed sync — it's the user's explicit choice and reverting mid-session is
  // jarring. But a silent failure used to let the device and the account drift
  // apart (next login's "server wins" would quietly undo it), so on failure we
  // surface a toast instead of swallowing it. "server wins" still reconciles on
  // the next successful save or login.
  const syncProfile = async (patch: Parameters<typeof updateProfile>[0]) => {
    if (!user) return; // logged out → local-only, nothing to sync.
    try {
      await updateProfile(patch).unwrap();
    } catch {
      toast.error(t('PREFERENCES_SYNC_FAILED'));
    }
  };

  const changeLanguage = (next: SupportedLanguage) => {
    void i18n.changeLanguage(next);
    void syncProfile({ language: next });
  };

  const changeTheme = (next: IUser['theme']) => {
    setTheme(next);
    void syncProfile({ theme: next });
  };

  // "System" follows the OS preference. It's applied locally only — the profile
  // stores a concrete 'light'|'dark' (per the contract), so we don't PATCH a
  // 'system' value; the user's last explicit choice remains their saved theme.
  const setSystemTheme = () => setTheme('system');

  return { language, theme, changeLanguage, changeTheme, setSystemTheme };
};
