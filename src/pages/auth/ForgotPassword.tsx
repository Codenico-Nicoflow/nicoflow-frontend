import { SignForm } from '@/features/SignForm';
import { ForgotPasswordInputs } from '@/lib/types';

export default function ForgotPassword() {
  return (
    <SignForm
      title="Forgot Password?"
      description="Don't worry! It happens. Please enter the address associated with your account."
      type="forgot-password"
      inputs={ForgotPasswordInputs}
      buttonText="Send"
    />
  );
}
