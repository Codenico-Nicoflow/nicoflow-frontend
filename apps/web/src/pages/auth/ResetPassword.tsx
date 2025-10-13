import SignForm from '@/components/sign-form/SignForm';

const inputs = [
  {
    label: 'New Password',
    name: 'newPassword',
    type: 'password',
    placeholder: 'Enter your new password',
    required: true,
  },
  {
    label: 'Confirm Password',
    name: 'confirmPassword',
    type: 'password',
    placeholder: 'Confirm your new password',
    required: true,
  },
];

export default function ResetPassword() {
  return (
    <SignForm
      title="Reset Password?"
      description="Please provide a new preferably strong password."
      type="reset-password"
      inputs={inputs}
      buttonText="Reset"
    />
  );
}
