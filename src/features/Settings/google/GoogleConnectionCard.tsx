import { useState } from 'react';

import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDisconnectGoogleMutation, useGetGoogleConnectionQuery, useLazyGetGoogleAuthUrlQuery } from '@/lib/store';
import { ToastMessages } from '@/lib/utils';

import { CalendarPicker } from './CalendarPicker';

/**
 * Google Calendar connection in Settings (NIC-1870).
 *
 * Silent failure is the worst outcome for this integration — a calendar quietly
 * missing meetings is more dangerous than one that admits it is broken — so
 * every state of the connection is visible here, never inferred.
 */
export const GoogleConnectionCard = () => {
  const { t } = useTranslation('common');
  const { data: connection, isLoading, isError } = useGetGoogleConnectionQuery();
  const [requestAuthUrl, { isFetching: isConnecting }] = useLazyGetGoogleAuthUrlQuery();
  const [disconnect, { isLoading: isDisconnecting }] = useDisconnectGoogleMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConnect = async () => {
    try {
      const { authUrl } = await requestAuthUrl('/settings').unwrap();
      // A full navigation, not a popup: Google blocks its consent screen in
      // many popup contexts, and the callback redirects the browser back here.
      window.location.assign(authUrl);
    } catch {
      toast.error(ToastMessages.UNEXPECTED_ERROR);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect().unwrap();
      setConfirmOpen(false);
      toast.success(t('pages.settings.google.disconnected'));
    } catch {
      toast.error(ToastMessages.UNEXPECTED_ERROR);
    }
  };

  return (
    <Card data-testid="google-connection-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
          {t('pages.settings.google.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">{t('pages.settings.google.help')}</p>

        {isLoading ? (
          <Skeleton className="h-9 w-full" data-testid="google-connection-loading" />
        ) : connection ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground">{t('pages.settings.google.connectedAs')}</span>
                {/* The account email, never the token — there is no field on
                    ConnectionView that could carry one. */}
                <span className="truncate text-sm font-medium" data-testid="google-connection-email">
                  {connection.googleAccountEmail}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={isDisconnecting}
                data-testid="google-disconnect-button"
              >
                {t('pages.settings.google.disconnect')}
              </Button>
            </div>

            {/* A recorded failure is surfaced rather than left to be discovered
                as silently missing meetings. */}
            {connection.lastError && (
              <p
                className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
                data-testid="google-last-error"
              >
                {t('pages.settings.google.lastErrorHint')}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium">{t('pages.settings.google.calendarsTitle')}</span>
              <p className="text-xs text-muted-foreground">{t('pages.settings.google.calendarsHelp')}</p>
              <CalendarPicker />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {/* A load failure and "not connected" both land here: from the
                user's side the action is identical, and the alternative is an
                error they cannot act on. */}
            <Button
              size="sm"
              className="self-start"
              onClick={() => void handleConnect()}
              disabled={isConnecting}
              data-testid="google-connect-button"
            >
              {t('pages.settings.google.connect')}
            </Button>
            {isError && (
              <p className="text-xs text-muted-foreground" data-testid="google-connection-error">
                {t('pages.settings.google.connectionUnavailable')}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* The confirmation states that the grant is revoked WITH Google, because
          that is the part a user cannot undo from here and would not otherwise
          expect from a button labelled "disconnect". */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('pages.settings.google.disconnectTitle')}
        description={t('pages.settings.google.disconnectDescription')}
        confirmLabel={t('pages.settings.google.disconnect')}
        variant="danger"
        destructive
        isLoading={isDisconnecting}
        onConfirm={handleDisconnect}
        data-testid="google-disconnect-confirm"
      />
    </Card>
  );
};
