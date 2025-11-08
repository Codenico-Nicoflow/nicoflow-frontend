import { ForgotPasswordInputs } from '@my-monorepo/types';

import SignForm from '@/components/sign-form/SignForm';

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
