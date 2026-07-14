import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Switch } from '@/components/ui/switch';
import { useGetPreferencesQuery, useUpdatePreferencesMutation } from '@/lib/store';

// The one setting that belongs right next to the notifications it governs: whether
// the user gets the daily email digest. Reads the live preference, writes on toggle.
// While either the read or the write is in flight the switch is disabled, so the
// control never shows a value it isn't actually committing.
export const DigestToggle = () => {
  const { t } = useTranslation('notification');
  const { data: prefs, isLoading } = useGetPreferencesQuery();
  const [updatePreferences, { isLoading: isSaving }] = useUpdatePreferencesMutation();

  const enabled = prefs?.emailDigest ?? false;
  const busy = isLoading || isSaving;

  const onToggle = (next: boolean) => {
    updatePreferences({ emailDigest: next });
  };

  return (
    <div className="flex items-center gap-2.5 border-t border-border/60 px-3 py-2.5">
      <Mail aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
      <label htmlFor="digest-toggle" className="flex-1 cursor-pointer text-xs text-muted-foreground">
        {t('digest.label')}
      </label>
      <Switch
        id="digest-toggle"
        checked={enabled}
        disabled={busy}
        onCheckedChange={onToggle}
        aria-label={t('digest.label')}
        data-testid="digest-toggle"
      />
    </div>
  );
};
