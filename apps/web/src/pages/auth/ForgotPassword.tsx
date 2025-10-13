import SignForm from '@/components/sign-form/SignForm';

const inputs = [
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
];

export default function ForgotPassword() {
  return (
    <SignForm
      title="Forgot Password?"
      description="Don't worry! It happens. Please enter the address associated with your account."
      type="forgot-password"
      inputs={inputs}
      buttonText="Send"
    />
  );
}
