import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { SupportedLanguage } from '@/lib/i18n';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';
import type { IUser } from '@/lib/types';

// Changes language/theme. Logged out: local-only. Logged in: the server is the
// source of truth, so the change is applied only after the PATCH succeeds.
export const usePreferences = () => {
  const { i18n, t } = useTranslation('errors');
  const { theme, setTheme } = useTheme();
  const user = useAppUser();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const language = (i18n.resolvedLanguage ?? 'en') as SupportedLanguage;

  const changeLanguage = async (next: SupportedLanguage) => {
    if (!user) return void i18n.changeLanguage(next);
    try {
      await updateProfile({ language: next }).unwrap();
      await i18n.changeLanguage(next);
    } catch {
      toast.error(t('PREFERENCES_UPDATE_FAILED'));
    }
  };

  const changeTheme = async (next: IUser['theme']) => {
    if (!user) return setTheme(next);
    try {
      await updateProfile({ theme: next }).unwrap();
      setTheme(next);
    } catch {
      toast.error(t('PREFERENCES_UPDATE_FAILED'));
    }
  };

  // 'system' is local-only — the profile stores a concrete 'light'|'dark'.
  const setSystemTheme = () => setTheme('system');

  return { language, theme, changeLanguage, changeTheme, setSystemTheme, isUpdating };
};
