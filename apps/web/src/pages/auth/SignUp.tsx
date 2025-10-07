import SignForm from '@/components/sign-form/SignForm';

export default function SignUp() {
  const inputs = [
    {
      label: 'Username',
      name: 'username',
      type: 'text',
      placeholder: 'Enter your username',
      required: true,
    },
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
      title="Sign Up"
      description="Sign up to create an account"
      type="register"
      inputs={inputs}
      buttonText="Sign Up"
    />
  );
}
