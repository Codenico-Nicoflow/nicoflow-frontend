import { ResetPasswordInputs } from '@my-monorepo/types';

import SignForm from '@/components/sign-form/SignForm';

export default function ResetPassword() {
  return (
    <SignForm
      title="Reset Password?"
      description="Please provide a new preferably strong password."
      type="reset-password"
      inputs={ResetPasswordInputs}
      buttonText="Reset"
    />
  );
}
