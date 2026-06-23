import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BottomText, SignForm, SocialButtons } from '@/features/SignForm';
import { useRegisterMutation } from '@/lib/store';
import { type RegisterFormData, registerSchema, showErrorToast } from '@/lib/utils';

type StrengthKey = 'weak' | 'fair' | 'strong';

const getPasswordStrength = (password: string): { score: number; key: StrengthKey | null; color: string } => {
  if (!password) return { score: 0, key: null, color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  if (score <= 2) return { score, key: 'weak', color: 'bg-destructive' };
  if (score === 3) return { score, key: 'fair', color: 'bg-warning' };
  return { score, key: 'strong', color: 'bg-success' };
};

export default function SignUp() {
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  // Email of a just-registered account. Register no longer logs the user in —
  // they must verify first — so on success we show a "check your email" panel.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [register, { isLoading }] = useRegisterMutation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { username: '', email: '', password: '' },
  });

  const passwordValue = form.watch('password');
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data).unwrap();
      setRegisteredEmail(data.email);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  if (registeredEmail) {
    return (
      <SignForm
        title={t('signUp.checkEmail')}
        description={`${t('signUp.checkEmailBody')}`}
        icon={<MailCheck className="h-6 w-6 text-primary" />}
      >
        <div className="flex flex-col items-center gap-4 pt-2">
          <Button asChild className="w-full">
            <Link to="/sign-in">{t('signUp.goToSignIn')}</Link>
          </Button>
        </div>
      </SignForm>
    );
  }

  return (
    <SignForm title={t('signUp.title')} description={t('signUp.subtitle')}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('signUp.usernameLabel')}</FormLabel>
                <FormControl>
                  <Input type="text" placeholder={t('signUp.usernamePlaceholder')} autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('signUp.emailLabel')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
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
                <FormLabel>{t('signUp.passwordLabel')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
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
                {passwordValue && (
                  <div className="space-y-1 pt-1" aria-live="polite">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-muted'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('signUp.passwordStrengthLabel')}{' '}
                      {strength.key ? t(`signUp.passwordStrength.${strength.key}`) : ''}
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('signUp.creatingAccount')}
              </>
            ) : (
              t('signUp.submit')
            )}
          </Button>
        </form>
      </Form>

      <BottomText type="register" />
      <SocialButtons />
    </SignForm>
  );
}
