import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

/**
 * The locked panel a free/downgraded user sees in place of the upload zone.
 * Existing attachments stay listed + downloadable + deletable above this; only
 * the *add* path is gated. Carries an Upgrade CTA to settings.
 */
export const ProGate = () => {
  const { t } = useTranslation('task');

  return (
    <div
      data-testid="attachment-pro-gate"
      className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 px-4 py-6 text-center"
    >
      <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{t('attachments.proGate')}</p>
      <Button asChild variant="secondary" size="sm" data-testid="attachment-upgrade-cta">
        <Link to="/settings">{t('attachments.upgrade')}</Link>
      </Button>
    </div>
  );
};
