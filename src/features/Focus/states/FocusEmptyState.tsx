import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components';
import { Button } from '@/components/ui/button';

interface FocusEmptyStateProps {
  /** True when a time/energy budget is set — the empty is "over budget", not "no tasks". */
  hasBudget: boolean;
  onClearChips: () => void;
}

// Encouraging, never a dead end: over-budget empties offer to widen the net;
// a truly empty backlog celebrates instead of nagging.
const FocusEmptyState = ({ hasBudget, onClearChips }: FocusEmptyStateProps) => {
  const { t } = useTranslation('task');

  return (
    <EmptyState
      icon={Sparkles}
      title={hasBudget ? t('focus.empty.overBudgetTitle') : t('focus.empty.title')}
      description={hasBudget ? t('focus.empty.overBudgetDescription') : t('focus.empty.description')}
      data-testid="focus-empty"
      action={
        hasBudget ? (
          <Button variant="outline" onClick={onClearChips} data-testid="focus-empty-clear">
            {t('focus.empty.showEverything')}
          </Button>
        ) : undefined
      }
    />
  );
};

export default FocusEmptyState;
