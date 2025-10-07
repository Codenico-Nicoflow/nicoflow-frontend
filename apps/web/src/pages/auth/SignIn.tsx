import SignForm from '@/components/sign-form/SignForm';

export default function SignIn() {
  const inputs = [
    {
      label: 'Email',
      name: 'email',
      type: 'email',
      placeholder: 'Enter your email',
      required: true,
    },
    {
      label: 'Password',
      name: 'password',
      type: 'password',
      placeholder: 'Enter your password',
      required: true,
    },
  ];

  return (
    <SignForm
      title="Sign In"
      description="Sign in to your account"
      type="login"
      inputs={inputs}
      showRemember
      buttonText="Sign In"
    />
  );
}
