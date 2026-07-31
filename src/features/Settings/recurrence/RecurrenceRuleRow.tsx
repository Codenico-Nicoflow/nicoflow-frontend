import { MoreVertical, Pause, Play, Repeat, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useRecurrenceSummary } from '@/components/RecurrenceField/useRecurrenceSummary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetRecurrenceStatsQuery } from '@/lib/store';
import type { IRecurrenceRule } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RecurrenceRuleRowProps {
  rule: IRecurrenceRule;
  onPauseToggle: (rule: IRecurrenceRule) => void;
  onDelete: (rule: IRecurrenceRule) => void;
  isMutating: boolean;
}

export const RecurrenceRuleRow = ({ rule, onPauseToggle, onDelete, isMutating }: RecurrenceRuleRowProps) => {
  const { t } = useTranslation(['recurrence', 'common']);
  const renderSummary = useRecurrenceSummary();
  const { data: stats, isLoading: statsLoading } = useGetRecurrenceStatsQuery(rule.id);

  return (
    <div
      className={cn('rounded-lg border border-border p-3 space-y-2', rule.paused && 'opacity-60')}
      data-testid={`recurrence-rule-${rule.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="truncate font-medium text-foreground">{rule.title}</p>
            {rule.paused && (
              <Badge variant="secondary" className="text-xs">
                {t('recurrence:badge.paused')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{renderSummary(rule)}</p>
          <p className="text-xs text-muted-foreground">
            {t('recurrence:settings.nextLabel')}:{' '}
            {rule.nextOccurrence
              ? `${rule.nextOccurrence}${rule.scheduledTime ? ` · ${rule.scheduledTime}` : ''}`
              : t('recurrence:settings.nextNone')}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isMutating}
              aria-label={t('common:actions.more', { defaultValue: 'More' })}
              data-testid={`recurrence-actions-${rule.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPauseToggle(rule)}>
              {rule.paused ? <Play className="me-2 h-4 w-4" /> : <Pause className="me-2 h-4 w-4" />}
              {rule.paused ? t('recurrence:settings.resume') : t('recurrence:settings.pause')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(rule)} className="text-destructive">
              <Trash2 className="me-2 h-4 w-4" />
              {t('recurrence:settings.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Derived history. Skeleton while loading so the row doesn't jump. */}
      {statsLoading ? (
        <Skeleton className="h-4 w-40" data-testid={`recurrence-stats-loading-${rule.id}`} />
      ) : (
        stats && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              {t('recurrence:stats.done')}: {stats.done}
            </span>
            <span>
              {t('recurrence:stats.missed')}: {stats.missed}
            </span>
            <span>
              {t('recurrence:stats.streak')}: {t('recurrence:stats.streakValue', { count: stats.streak })}
            </span>
          </div>
        )
      )}
    </div>
  );
};
