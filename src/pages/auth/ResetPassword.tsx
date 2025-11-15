import SignForm from '@/features/SignForm/SignForm';
import { ResetPasswordInputs } from '@/lib/types';

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
