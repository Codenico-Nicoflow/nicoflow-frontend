import { useEffect } from 'react';

import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

import AuthLayout from '@/components/layout/AuthLayout';

const ForgotPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to sign-in as Clerk handles forgot password flow there
    navigate('/sign-in');
  }, [navigate]);

  return (
    <AuthLayout>
      <SignIn routing="path" path="/sign-in" />
    </AuthLayout>
  );
};

export default ForgotPassword;
