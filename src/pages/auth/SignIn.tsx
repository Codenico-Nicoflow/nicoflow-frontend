import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, MailWarning } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BottomText, RememberMe, SignForm, SocialButtons } from '@/features/SignForm';
import { useAppDispatch, useLoginMutation, useResendVerificationMutation } from '@/lib/store';
import { setToken, setUser } from '@/lib/store/slices/auth/authSlice';
import {
  getApiErrorCode,
  type LoginFormData,
  loginSchema,
  showErrorToast,
  showSuccessToast,
  ToastMessages,
} from '@/lib/utils';

export default function SignIn() {
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  // The email of an account that logged in but isn't verified yet. When set, we
  // show the resend panel instead of a generic error toast.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { identifier: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setUnverifiedEmail(null);
    try {
      const result = await login(data).unwrap();
      dispatch(setToken(result.token));
      dispatch(setUser(result.user));
      showSuccessToast(ToastMessages.SIGN_IN_SUCCESSFULLY, toast);
      navigate(from, { replace: true });
    } catch (error) {
      if (getApiErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.identifier);
        return;
      }
      showErrorToast(error, toast);
    }
  };

  const onResend = async () => {
    if (!unverifiedEmail) return;
    try {
      await resendVerification({ email: unverifiedEmail }).unwrap();
      showSuccessToast(ToastMessages.VERIFICATION_EMAIL_SENT, toast);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <SignForm title={t('signIn.title')} description={t('signIn.subtitle')}>
      {unverifiedEmail && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-start gap-2">
            <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm text-muted-foreground">{t('signIn.unverifiedBanner')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onResend} disabled={isResending}>
            {isResending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('signIn.sending')}
              </>
            ) : (
              t('signIn.resendVerification')
            )}
          </Button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('signIn.identifierLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t('signIn.identifierPlaceholder')}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('signIn.passwordLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pe-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? t('form.hidePassword') : t('form.showPassword')}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <RememberMe form={form} />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('signIn.signingIn')}
              </>
            ) : (
              t('signIn.submit')
            )}
          </Button>
        </form>
      </Form>

      <BottomText type="login" />
      <SocialButtons />
    </SignForm>
  );
}
