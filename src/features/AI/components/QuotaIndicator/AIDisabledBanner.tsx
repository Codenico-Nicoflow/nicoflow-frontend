import { PowerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';

// Shown when the assistant itself is off (AI_UNAVAILABLE — kill switch or no
// provider key configured). This is a feature-disabled state, not an error: no
// retry button, because retrying cannot fix a server-side switch. The page keeps
// rendering around it rather than crashing.
export const AIDisabledBanner = () => {
  const { t } = useTranslation('ai');

  return (
    <div className="flex h-full items-center justify-center p-6" role="status" data-testid="ai-disabled-banner">
      <EmptyState
        icon={PowerOff}
        title={t('disabled.title')}
        description={t('disabled.description')}
        data-testid="ai-disabled-empty"
      />
    </div>
  );
};
