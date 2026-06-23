import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePreferences } from '@/hooks/usePreferences';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

// Native language names, shown in each language's own script so a user always
// recognises their own. Keys match SUPPORTED_LANGUAGES; the `common.language.*`
// i18n keys carry the same native strings for use elsewhere (e.g. settings).
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  he: 'עברית',
  ru: 'Русский',
};

export function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const { language: active, changeLanguage } = usePreferences();

  // changeLanguage applies the choice locally (the lib/i18n languageChanged
  // listener persists to localStorage and flips <html dir> for RTL) and, when
  // logged in, PATCHes the profile so it syncs across devices.

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('language.label')}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('language.label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map(lng => (
          <DropdownMenuItem
            key={lng}
            onClick={() => changeLanguage(lng)}
            disabled={lng === active}
            data-testid={`language-option-${lng}`}
          >
            {LANGUAGE_LABELS[lng]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
