import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SignForm } from '@/features/SignForm';
import { useForgotPasswordMutation } from '@/lib/store';
import { type ForgotPasswordFormData, forgotPasswordSchema, showErrorToast } from '@/lib/utils';

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data).unwrap();
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  if (submitted) {
    return (
      <SignForm
        title="Check your inbox"
        description={`We sent a password reset link to ${submittedEmail}`}
        icon={<CheckCircle2 className="h-10 w-10 text-success" />}
      >
        <div className="flex flex-col items-center gap-4 pt-2">
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive it? Check your spam folder or try again.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
            Try another email
          </Button>
          <Link
            to="/sign-in"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </SignForm>
    );
  }

  return (
    <SignForm
      title="Forgot password?"
      description="Enter the email associated with your account and we'll send you a reset link."
      icon={<Mail className="h-6 w-6 text-primary" />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      </Form>

      <div className="flex justify-center mt-4">
        <Link
          to="/sign-in"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </SignForm>
  );
}
