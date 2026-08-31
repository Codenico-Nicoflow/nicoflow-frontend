import { useState } from 'react';

import type { IRecurrenceRule } from '@nicoflow/shared/types';
import { FREE_PLAN_RULE_LIMIT } from '@nicoflow/shared/types';
import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog, ListPager } from '@/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsPro } from '@/hooks';
import {
  useDeleteRecurrenceRuleMutation,
  useGetRecurrenceRulesQuery,
  usePauseRecurrenceRuleMutation,
} from '@/lib/store';
import { showErrorToast } from '@/lib/utils';

import { RecurrenceRuleRow } from './RecurrenceRuleRow';

const RULES_PER_PAGE = 5;

// Where the 3-rule free limit becomes legible and occurrence history is
// reachable. Deliberately a Settings card, not a NAV_DESTINATIONS slot —
// recurrence is a property of tasks, not a fourth pillar of the app.
export const RecurrenceCard = () => {
  const { t } = useTranslation('recurrence');
  const { data, isLoading } = useGetRecurrenceRulesQuery({});
  const isPro = useIsPro();
  const [pauseRule, { isLoading: isPausing }] = usePauseRecurrenceRuleMutation();
  const [deleteRule, { isLoading: isDeleting }] = useDeleteRecurrenceRuleMutation();

  const [pendingDelete, setPendingDelete] = useState<IRecurrenceRule | null>(null);
  const [pendingPause, setPendingPause] = useState<IRecurrenceRule | null>(null);
  const [page, setPage] = useState(1);

  const rules = data?.items ?? [];
  const isMutating = isPausing || isDeleting;
  const pageCount = Math.max(1, Math.ceil(rules.length / RULES_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const pagedRules = rules.slice((safePage - 1) * RULES_PER_PAGE, safePage * RULES_PER_PAGE);

  // The list arrives newest-first (server ORDER BY created_at DESC), but a
  // graceful downgrade keeps the OLDEST N rules editable — so the read-only
  // set is whatever falls outside the last FREE_PLAN_RULE_LIMIT entries here,
  // mirroring the backend's IsWithinFreeLimit ranking exactly.
  const readOnlyRuleIds = isPro ? new Set<string>() : new Set(rules.slice(FREE_PLAN_RULE_LIMIT).map(r => r.id));

  const handlePauseToggle = (rule: IRecurrenceRule) => {
    if (!rule.paused) {
      // Pausing cancels the current live occurrence — confirm before proceeding.
      setPendingPause(rule);
      return;
    }
    void doPauseToggle(rule);
  };

  const doPauseToggle = async (rule: IRecurrenceRule) => {
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
            {pagedRules.map(rule => (
              <RecurrenceRuleRow
                key={rule.id}
                rule={rule}
                onPauseToggle={handlePauseToggle}
                onDelete={setPendingDelete}
                isMutating={isMutating}
                // Deleting an over-cap rule is always allowed (it only shrinks
                // the set); resuming one isn't, since that's un-pausing a rule
                // the free plan wouldn't let the user create today. Renaming/
                // rescheduling isn't reachable from this row at all — that's
                // TaskDialog's job, which reads the same rule via
                // useGetRecurrenceRuleQuery and hits the server-side gate.
                readOnly={readOnlyRuleIds.has(rule.id)}
              />
            ))}
            <ListPager page={safePage} pageCount={pageCount} onPageChange={setPage} data-testid="recurrence-pager" />
            {readOnlyRuleIds.size > 0 ? (
              <p className="text-xs text-muted-foreground" data-testid="recurrence-readonly-hint">
                {t('settings.readOnlyHint', { limit: FREE_PLAN_RULE_LIMIT })}
              </p>
            ) : (
              !isPro &&
              rules.length >= FREE_PLAN_RULE_LIMIT && (
                <p className="text-xs text-muted-foreground" data-testid="recurrence-limit-hint">
                  {t('settings.limitReached', { limit: FREE_PLAN_RULE_LIMIT })}
                </p>
              )
            )}
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingPause !== null}
        onOpenChange={open => !open && setPendingPause(null)}
        title={t('pauseConfirm.title')}
        description={t('pauseConfirm.description')}
        confirmLabel={t('pauseConfirm.confirmLabel')}
        cancelLabel={t('pauseConfirm.cancelLabel')}
        variant="info"
        isLoading={isPausing}
        onConfirm={async () => {
          if (!pendingPause) return;
          await doPauseToggle(pendingPause);
          setPendingPause(null);
        }}
        data-testid="recurrence-pause-confirm"
      />
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
