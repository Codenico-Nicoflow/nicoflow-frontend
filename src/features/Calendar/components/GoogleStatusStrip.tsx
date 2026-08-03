import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import type { GoogleStatus } from '@/lib/store';
import { cn } from '@/lib/utils';

interface GoogleStatusStripProps {
  status: GoogleStatus;
  onDismiss: () => void;
}

/**
 * Tells the user when the Google overlay is incomplete (NIC-1870).
 *
 * Exists because silent failure is the worst outcome here: a calendar quietly
 * missing meetings is more dangerous than one that admits it is broken. An
 * empty overlay alone is ambiguous — this strip is what separates "you are
 * free" from "we could not fetch".
 *
 * Dismissible, but the dismissal is recorded per status, so waving away a
 * transient outage does not also silence a dead connection.
 */
const GoogleStatusStrip = ({ status, onDismiss }: GoogleStatusStripProps) => {
  const { t } = useTranslation('task');

  if (status === 'ok') return null;

  const isDisconnected = status === 'disconnected';

  return (
    <div
      // Polite, not assertive: this is context about a secondary layer, and an
      // assertive announcement would interrupt someone reading their tasks.
      role="status"
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs',
        isDisconnected ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40'
      )}
      data-testid="google-status-strip"
      data-status={status}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />

      <span className="flex-1 text-muted-foreground">
        {isDisconnected ? t('calendar.googleDisconnected') : t('calendar.googleUnavailable')}
      </span>

      {/* Only the dead-connection case gets an action — a transient outage has
          nothing for the user to do, and offering a button would imply
          otherwise. */}
      {isDisconnected && (
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to="/settings" data-testid="google-status-reconnect">
            {t('calendar.googleReconnect')}
          </Link>
        </Button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('calendar.googleDismiss')}
        className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="google-status-dismiss"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
};

export default GoogleStatusStrip;
