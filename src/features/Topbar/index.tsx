import { Bell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { LanguageSwitcher, ModeToggle } from '@/components';
import { Button } from '@/components/ui/button';

import { UserMenu } from './components/UserMenu';

export const Topbar = () => {
  const { t } = useTranslation(['common', 'nav']);
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background px-3 sm:px-4">
      <button
        type="button"
        onClick={() => navigate('/quick-access/today')}
        className="flex items-center gap-2 font-semibold text-foreground"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          N
        </span>
        <span className="hidden sm:inline">{t('common:appName')}</span>
      </button>

      {/* Search / command-palette entry — palette itself is P2 */}
      <button
        type="button"
        aria-label={t('common:actions.search')}
        className="ms-2 flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-start">{t('common:actions.search')}</span>
        <kbd className="hidden rounded border bg-background px-1.5 text-xs sm:inline">⌘K</kbd>
      </button>

      <div className="ms-auto flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" aria-label={t('nav:notifications')}>
          <Bell className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <LanguageSwitcher />
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
};
