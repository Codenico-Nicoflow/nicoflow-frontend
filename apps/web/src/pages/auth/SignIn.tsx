import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

const SignIn = () => {
  return <ClerkSignIn signUpUrl="/sign-up" />;
};

export default SignIn;
