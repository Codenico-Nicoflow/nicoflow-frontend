import { RegisterInputs } from '@my-monorepo/types';

import SignForm from '@/components/sign-form/SignForm';

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
