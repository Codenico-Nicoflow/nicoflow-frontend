import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { AIToolName, ToolProposalStatus } from '@/features/AI/types';

import { toolInputToSummary } from './formatters';

export interface AIToolProposalProps {
  toolUseId: string;
  toolName: AIToolName;
  input: unknown;
  status: ToolProposalStatus;
  errorMessage?: string;
  // True when status === 'error' and the cause was a 409 CONFLICT — shows a
  // terminal "already resolved" state with no actionable buttons.
  alreadyResolved?: boolean;
  onConfirm: (toolUseId: string) => void;
  onReject: (toolUseId: string) => void;
  // Pre-fetched lookup maps supplied by the parent. Falls back to raw id when absent.
  taskTitles?: Record<string, string>;
  projectNames?: Record<string, string>;
}

export const AIToolProposal = ({
  toolUseId,
  toolName,
  input,
  status,
  errorMessage,
  alreadyResolved,
  onConfirm,
  onReject,
  taskTitles,
  projectNames,
}: AIToolProposalProps) => {
  const { t } = useTranslation('ai');
  const { headline, reason } = toolInputToSummary(toolName, input, taskTitles, projectNames);

  const isExecuting = status === 'executing';
  const isDone = status === 'done';
  const isRejected = status === 'rejected';
  const isError = status === 'error';

  const renderFooter = () => {
    if (isDone) {
      return (
        <Badge variant="secondary" className="gap-1.5" data-testid="tool-proposal-applied">
          <CheckCircle2 className="size-3.5" aria-hidden />
          {t('toolProposal.applied')}
        </Badge>
      );
    }

    if (isRejected) {
      return (
        <Badge variant="outline" className="gap-1.5" data-testid="tool-proposal-rejected">
          <XCircle className="size-3.5" aria-hidden />
          {t('toolProposal.rejected')}
        </Badge>
      );
    }

    if (isError && alreadyResolved) {
      return (
        <Badge variant="destructive" className="gap-1.5" data-testid="tool-proposal-already-resolved">
          {t('toolProposal.alreadyResolved')}
        </Badge>
      );
    }

    // pending_confirm, executing, or retriable error — show action buttons.
    return (
      <>
        {isError && errorMessage && (
          <p className="text-destructive text-xs" data-testid="tool-proposal-error-message">
            {errorMessage}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isExecuting}
            onClick={() => onConfirm(toolUseId)}
            data-testid="tool-proposal-confirm"
          >
            {isExecuting && <Loader2 className="me-1.5 size-3.5 animate-spin" aria-hidden />}
            {isExecuting ? t('toolProposal.executing') : t('toolProposal.confirm')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isExecuting}
            onClick={() => onReject(toolUseId)}
            data-testid="tool-proposal-reject"
          >
            {t('toolProposal.reject')}
          </Button>
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-[85%] py-4" data-testid="tool-proposal-card">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium" data-testid="tool-proposal-headline">
          {headline}
        </CardTitle>
      </CardHeader>

      {reason && (
        <CardContent className="py-2">
          <p className="text-muted-foreground text-sm" data-testid="tool-proposal-reason">
            {reason}
          </p>
        </CardContent>
      )}

      <CardFooter className="pt-2 [.border-t]:pt-0">{renderFooter()}</CardFooter>
    </Card>
  );
};
