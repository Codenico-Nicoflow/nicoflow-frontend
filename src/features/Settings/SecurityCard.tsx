import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useChangePasswordMutation } from '@/lib/store';
import {
  type ChangePasswordFormData,
  changePasswordSchema,
  getApiErrorCode,
  showErrorToast,
  showSuccessToast,
  ToastMessages,
} from '@/lib/utils';

const EMPTY: ChangePasswordFormData = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Settings › Security. Changes the password via POST /auth/change-password.
// On success the backend rotates every refresh token and returns a fresh pair —
// the mutation persists it so this device stays signed in. A wrong current
// password comes back 401 and is surfaced as a field error, not a toast.
export const SecurityCard = () => {
  const { t } = useTranslation('common');
  const { t: tAuth } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    defaultValues: EMPTY,
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword(data).unwrap();
      showSuccessToast(ToastMessages.PASSWORD_CHANGED_SUCCESSFULLY, toast);
      form.reset(EMPTY);
    } catch (error) {
      if (getApiErrorCode(error) === 'UNAUTHORIZED') {
        form.setError('currentPassword', { message: t('pages.settings.currentPasswordIncorrect') });
        return;
      }
      showErrorToast(error, toast);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.settings.securitySection')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.currentPasswordLabel')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      show={showPassword}
                      onToggle={() => setShowPassword(v => !v)}
                      toggleLabel={showPassword ? tAuth('form.hidePassword') : tAuth('form.showPassword')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.newPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.confirmPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">{t('pages.settings.changePasswordHint')}</p>

            <Button type="submit" className="self-start" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('pages.settings.changingPasswordButton')}
                </>
              ) : (
                t('pages.settings.changePasswordButton')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  show: boolean;
  onToggle: () => void;
  toggleLabel: string;
};

const PasswordInput = ({ show, onToggle, toggleLabel, ...props }: PasswordInputProps) => (
  <div className="relative">
    <Input type={show ? 'text' : 'password'} className="pe-10" {...props} />
    <button
      type="button"
      onClick={onToggle}
      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      tabIndex={-1}
      aria-label={toggleLabel}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
);
