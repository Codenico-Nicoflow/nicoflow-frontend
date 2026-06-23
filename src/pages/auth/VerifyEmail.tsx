import { useEffect, useRef, useState } from 'react';

import { ArrowLeft, CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SignForm } from '@/features/SignForm';
import { useVerifyEmailMutation } from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

type VerifyStatus = 'verifying' | 'success' | 'error';

// How long the success screen stays up before auto-redirecting to sign-in.
const REDIRECT_DELAY_MS = 3000;

export default function VerifyEmail() {
  const { t } = useTranslation('auth');
  const [verifyEmail] = useVerifyEmailMutation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerifyStatus>(token ? 'verifying' : 'error');
  // Guard against double-firing: React 18/19 StrictMode invokes effects twice in
  // dev, and a re-render must not replay the (single-use) verification token.
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        await verifyEmail({ token }).unwrap();
        setStatus('success');
        showSuccessToast(ToastMessages.EMAIL_VERIFIED_SUCCESSFULLY, toast);
      } catch (err) {
        setStatus('error');
        showErrorToast(err, toast);
      }
    })();
  }, [token, verifyEmail]);

  // Once verified, show the confirmation screen briefly, then auto-redirect to
  // sign-in. Kept separate from the verify effect so the success UI actually
  // renders (an immediate navigate would unmount it within a frame). The button
  // lets the user skip the wait; the timer is cleared on unmount.
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => navigate('/sign-in', { replace: true }), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  if (status === 'verifying') {
    return (
      <SignForm
        title={t('verifyEmail.verifying')}
        description={t('verifyEmail.verifyingDesc')}
        icon={<Loader2 className="h-6 w-6 text-primary animate-spin" />}
      >
        <div className="flex flex-col items-center gap-4 pt-2">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
      </SignForm>
    );
  }

  if (status === 'success') {
    return (
      <SignForm
        title={t('verifyEmail.verified')}
        description={t('verifyEmail.verifiedDesc')}
        icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
      >
        <div className="flex flex-col items-center gap-4 pt-2">
          <Button asChild className="w-full">
            <Link to="/sign-in">{t('verifyEmail.continueToSignIn')}</Link>
          </Button>
        </div>
      </SignForm>
    );
  }

  // status === 'error' — missing/invalid/expired token.
  return (
    <SignForm
      title={token ? t('verifyEmail.verificationFailed') : t('verifyEmail.invalidLink')}
      description={token ? t('verifyEmail.verificationFailedDesc') : t('verifyEmail.invalidLinkDesc')}
      icon={token ? <XCircle className="h-6 w-6 text-destructive" /> : <MailCheck className="h-6 w-6 text-primary" />}
    >
      <div className="flex flex-col items-center gap-4 pt-2">
        <Link
          to="/sign-in"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('verifyEmail.backToSignIn')}
        </Link>
      </div>
    </SignForm>
  );
}
