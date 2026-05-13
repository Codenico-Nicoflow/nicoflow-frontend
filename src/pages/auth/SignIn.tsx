import { SignForm } from '@/features/SignForm';
import { LoginInputs } from '@/lib/types';

export default function SignIn() {
  return (
    <SignForm
      title="Sign In"
      description="Sign in to your account"
      type="login"
      inputs={LoginInputs}
      showRemember
      buttonText="Sign In"
    />
  );
}
