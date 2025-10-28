import { LoginInputs } from '@my-monorepo/types';

import SignForm from '@/components/sign-form/SignForm';

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
