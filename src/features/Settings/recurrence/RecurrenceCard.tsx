import { useState } from 'react';

import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDeleteRecurrenceRuleMutation,
  useGetRecurrenceRulesQuery,
  usePauseRecurrenceRuleMutation,
} from '@/lib/store';
import type { IRecurrenceRule } from '@/lib/types';
import { FREE_PLAN_RULE_LIMIT } from '@/lib/types';
import { showErrorToast } from '@/lib/utils';

import { RecurrenceRuleRow } from './RecurrenceRuleRow';

// Where the 3-rule free limit becomes legible and occurrence history is
// reachable. Deliberately a Settings card, not a NAV_DESTINATIONS slot —
// recurrence is a property of tasks, not a fourth pillar of the app.
export const RecurrenceCard = () => {
  const { t } = useTranslation('recurrence');
  const { data, isLoading } = useGetRecurrenceRulesQuery({});
  const [pauseRule, { isLoading: isPausing }] = usePauseRecurrenceRuleMutation();
  const [deleteRule, { isLoading: isDeleting }] = useDeleteRecurrenceRuleMutation();

  const [pendingDelete, setPendingDelete] = useState<IRecurrenceRule | null>(null);

  const rules = data?.items ?? [];
  const isMutating = isPausing || isDeleting;

  const handlePauseToggle = async (rule: IRecurrenceRule) => {
    try {
      await pauseRule({ id: rule.id, paused: !rule.paused }).unwrap();
      toast.success(rule.paused ? t('toast.resumed') : t('toast.paused'));
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteRule(pendingDelete.id).unwrap();
      toast.success(t('toast.deleted'));
      setPendingDelete(null);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <Card data-testid="recurrence-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" />
          {t('settings.title')}
        </CardTitle>
        <CardDescription>{t('settings.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2" data-testid="recurrence-loading">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : rules.length === 0 ? (
          <div className="py-6 text-center" data-testid="recurrence-empty">
            <p className="text-sm text-muted-foreground">{t('settings.empty')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('settings.emptyHint')}</p>
          </div>
        ) : (
          <>
            {rules.map(rule => (
              <RecurrenceRuleRow
                key={rule.id}
                rule={rule}
                onPauseToggle={handlePauseToggle}
                onDelete={setPendingDelete}
                isMutating={isMutating}
              />
            ))}
            {rules.length >= FREE_PLAN_RULE_LIMIT && (
              <p className="text-xs text-muted-foreground" data-testid="recurrence-limit-hint">
                {t('settings.limitReached', { limit: FREE_PLAN_RULE_LIMIT })}
              </p>
            )}
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={t('settings.deleteTitle')}
        description={t('settings.deleteDescription')}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </Card>
  );
};
