import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { type FieldErrors, useForm, type UseFormReturn } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ForgotPasswordIcon, ResetPasswordIcon } from '@/assets/svgs';
import type { ResetPasswordRequest } from '@/lib/store';
import {
  useForgotPasswordMutation,
  useLoginMutation,
  useRegisterMutation,
  useResetPasswordMutation,
} from '@/lib/store';
import type { ForgotPasswordFormData, LoginFormData, RegisterFormData, ResetPasswordFormData } from '@/lib/utils';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  showErrorToast,
  showSuccessToast,
  ToastMessages,
} from '@/lib/utils';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

import BottomText from './BottomText';
import RememberMe from './RememberMe';
import SocialButtons from './SocialButtons';

interface SignFormProps {
  title: string;
  description: string;
  type: 'login' | 'register' | 'forgot-password' | 'reset-password';
  inputs: {
    label: string;
    name: string;
    type: string;
    placeholder: string;
    required: boolean;
  }[];
  showRemember?: boolean;
  buttonText: string;
}

const SignForm = ({ title, description, type, inputs, showRemember = false, buttonText }: SignFormProps) => {
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [forgotPassword, { isLoading: isForgotPasswordLoading }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetPasswordLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const defaultValues = inputs.reduce<Record<string, unknown>>((acc, input) => {
    acc[input.name] = '';
    return acc;
  }, {});

  const form = useForm<LoginFormData | RegisterFormData | ForgotPasswordFormData | ResetPasswordFormData>({
    defaultValues: {
      ...defaultValues,
      remember: false,
    },
    // @ts-expect-error ... TODO: fix this
    resolver: zodResolver(
      // @ts-expect-error ... TODO: fix this
      type === 'login'
        ? loginSchema
        : type === 'register'
          ? registerSchema
          : type === 'forgot-password'
            ? forgotPasswordSchema
            : resetPasswordSchema
    ),
  });

  const onSubmit = async (data: LoginFormData | RegisterFormData | ForgotPasswordFormData | ResetPasswordFormData) => {
    try {
      if (type === 'login') {
        await login(data as LoginFormData).unwrap();
        showSuccessToast(ToastMessages.SIGN_IN_SUCCESSFULLY, toast);
        navigate('/');
      } else if (type === 'register') {
        await register(data as RegisterFormData).unwrap();
        showSuccessToast(ToastMessages.SIGN_UP_SUCCESSFULLY, toast);
        navigate('/');
      } else if (type === 'forgot-password') {
        await forgotPassword(data as ForgotPasswordFormData).unwrap();
        showSuccessToast('Password reset email sent successfully', toast);
        navigate('/sign-in');
      } else if (type === 'reset-password') {
        await resetPassword({ ...data, token: token as string } as ResetPasswordRequest).unwrap();
        showSuccessToast('Password reset successfully', toast);
        navigate('/sign-in');
      }
    } catch (error) {
      console.error(error);
      showErrorToast(error, toast);
    }
  };

  const onError = (
    errors: FieldErrors<LoginFormData | RegisterFormData | ForgotPasswordFormData | ResetPasswordFormData>
  ) => {
    console.log('Validation errors:', errors);
  };

  return (
    <Card className="max-w-xl w-full">
      <CardHeader className="flex flex-col items-center justify-center">
        {type === 'forgot-password' && <ForgotPasswordIcon />}
        {type === 'reset-password' && <ResetPasswordIcon />}
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground text-center max-w-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {/* @ts-expect-error ... TODO: fix this */}
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6 w-full flex flex-col items-center">
            {inputs.map(input => (
              <FormField
                key={input.name}
                // @ts-expect-error ... TODO: fix this
                control={form.control}
                name={
                  input.name as keyof (
                    | LoginFormData
                    | RegisterFormData
                    | ForgotPasswordFormData
                    | ResetPasswordFormData
                  )
                }
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{input.label}</FormLabel>
                    <FormControl>
                      <Input className="w-80" type={input.type} placeholder={input.placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {/* @ts-expect-error ... TODO: fix this */}
            {showRemember && <RememberMe form={form as UseFormReturn<LoginFormData>} />}
            <Button
              type="submit"
              size="xl"
              disabled={isLoginLoading || isRegisterLoading || isForgotPasswordLoading || isResetPasswordLoading}
            >
              {isLoginLoading || isRegisterLoading || isForgotPasswordLoading || isResetPasswordLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                buttonText
              )}
            </Button>
          </form>
        </Form>
        {(type === 'login' || type === 'register') && <BottomText type={type} />}
        {(type === 'login' || type === 'register') && <SocialButtons />}
      </CardContent>
    </Card>
  );
};

export default SignForm;
