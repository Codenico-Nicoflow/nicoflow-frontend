import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToastMessages } from '@/lib/utils';

export const PLAN_LIMIT_ALERT_TESTID = 'plan-limit-alert';

interface PlanLimitAlertProps {
  /** Optional override for the alert body copy. */
  message?: string;
}

export const PlanLimitAlert = ({ message = ToastMessages.PLAN_LIMIT_EXCEEDED }: PlanLimitAlertProps) => (
  <Alert variant="destructive" data-testid={PLAN_LIMIT_ALERT_TESTID}>
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Plan limit reached</AlertTitle>
    <AlertDescription>
      <span>{message} </span>
      {/* TODO: point at billing page (E-030) */}
      <Link to="/profile" className="font-semibold underline underline-offset-2">
        Upgrade to Pro
      </Link>
    </AlertDescription>
  </Alert>
);
