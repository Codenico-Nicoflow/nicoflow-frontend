import { SignForm } from '@/features/SignForm';
import { RegisterInputs } from '@/lib/types';

export default function SignUp() {
  return (
    <SignForm
      title="Sign Up"
      description="Sign up to create an account"
      type="register"
      inputs={RegisterInputs}
      buttonText="Sign Up"
    />
  );
}
