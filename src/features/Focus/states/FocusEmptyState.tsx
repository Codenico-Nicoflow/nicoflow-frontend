import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';

interface FocusEmptyStateProps {
  onClearChips: () => void;
}

// Reached only with a time budget set but nothing fitting it — encouraging, never
// a dead end: offer to widen the window instead of leaving a blank screen.
const FocusEmptyState = ({ onClearChips }: FocusEmptyStateProps) => {
  const { t } = useTranslation('task');

  return (
    <EmptyState
      icon={Sparkles}
      title={t('focus.empty.title')}
      description={t('focus.empty.description')}
      data-testid="focus-empty"
      action={
        <Button variant="outline" onClick={onClearChips} data-testid="focus-empty-clear">
          {t('focus.empty.changeTime')}
        </Button>
      }
    />
  );
};

export default FocusEmptyState;
