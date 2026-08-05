import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';

// An empty screen is an invitation to act, not a mood piece — so it names
// concrete examples rather than explaining what a habit is.
export const HabitsEmptyState = ({ onCreate }: { onCreate?: () => void }) => {
  const { t } = useTranslation('habits');

  return (
    <EmptyState
      icon={Repeat}
      title={t('empty.title')}
      description={t('empty.description')}
      data-testid="habits-empty"
      action={
        onCreate ? (
          <Button onClick={onCreate} data-testid="habits-empty-create">
            {t('create')}
          </Button>
        ) : undefined
      }
    />
  );
};
