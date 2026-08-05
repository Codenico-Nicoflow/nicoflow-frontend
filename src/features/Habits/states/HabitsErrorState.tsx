import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';

// Errors say what happened and how to fix it. They do not apologise, and they
// are never vague about the state the user is now in.
export const HabitsErrorState = ({ onRetry }: { onRetry?: () => void }) => {
  const { t } = useTranslation('habits');

  return (
    <EmptyState
      icon={AlertTriangle}
      title={t('error.title')}
      description={t('error.description')}
      data-testid="habits-error"
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry} data-testid="habits-error-retry">
            {t('error.retry')}
          </Button>
        ) : undefined
      }
    />
  );
};
