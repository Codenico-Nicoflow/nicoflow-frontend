import { Loader2 } from 'lucide-react';
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
  const { language, theme, changeLanguage, changeTheme, setSystemTheme, isUpdating } = usePreferences();

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
          <Label htmlFor="settings-language" className="flex items-center gap-2">
            {t('pages.settings.languageLabel')}
            {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </Label>
          <Select
            value={language}
            disabled={isUpdating}
            onValueChange={value => void changeLanguage(value as SupportedLanguage)}
          >
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
          <Label htmlFor="settings-theme" className="flex items-center gap-2">
            {t('pages.settings.themeLabel')}
            {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </Label>
          <Select value={theme} disabled={isUpdating} onValueChange={onThemeChange}>
            <SelectTrigger id="settings-theme" data-testid="settings-theme-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light" data-testid="settings-theme-light">
                {t('theme.light')}
              </SelectItem>
              <SelectItem value="dark" data-testid="settings-theme-dark">
                {t('theme.dark')}
              </SelectItem>
              <SelectItem value="system" data-testid="settings-theme-system">
                {t('theme.system')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
