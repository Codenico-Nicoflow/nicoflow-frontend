import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreferences } from '@/hooks/usePreferences';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  he: 'עברית',
  ru: 'Русский',
};

// Logged-in Preferences: Language + Theme selectors that apply immediately and
// persist to the user's profile (server-wins on next login). Mirrors the Topbar
// quick toggles but in a discoverable place. Both go through usePreferences, so
// the persistence/RTL behaviour is identical.
export const PreferencesCard = () => {
  const { t } = useTranslation('common');
  const { language, theme, changeLanguage, changeTheme, setSystemTheme } = usePreferences();

  const onThemeChange = (value: string) => {
    if (value === 'system') {
      setSystemTheme();
    } else if (value === 'light' || value === 'dark') {
      changeTheme(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.settings.preferencesSection')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="settings-language">{t('pages.settings.languageLabel')}</Label>
          <Select value={language} onValueChange={value => changeLanguage(value as SupportedLanguage)}>
            <SelectTrigger id="settings-language" data-testid="settings-language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(lng => (
                <SelectItem key={lng} value={lng} data-testid={`settings-language-${lng}`}>
                  {LANGUAGE_LABELS[lng]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="settings-theme">{t('pages.settings.themeLabel')}</Label>
          <Select value={theme} onValueChange={onThemeChange}>
            <SelectTrigger id="settings-theme" data-testid="settings-theme-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('theme.light')}</SelectItem>
              <SelectItem value="dark">{t('theme.dark')}</SelectItem>
              <SelectItem value="system">{t('theme.system')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
