import { Navigate, useLocation, useRoutes } from 'react-router-dom';

import { useAppUser } from '@my-monorepo/store';

import AuthLayout from './components/layout/AuthLayout';
import PrivateLayout from './components/layout/PrivateLayout';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ErrorPage from './pages/ErrorPage';
import HelpAndInformation from './pages/HelpAndInformation';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import ProjectView from './pages/project/ProjectView';
import Bucket from './pages/tasks/Bucket';
import NextSevenDays from './pages/tasks/NextSevenDays';
import Today from './pages/tasks/Today';
import Tomorrow from './pages/tasks/Tomorrow';
import TermsOfService from './pages/TermsOfService';

const PrivateRoutes = () => {
  const location = useLocation();
  const user = useAppUser();

  // You can add loading logic here if needed
  // For now, we'll assume auth state is managed elsewhere

  return user ? <PrivateLayout /> : <Navigate to="/sign-in" state={{ from: location }} replace />;
};

const AppRoutes = () => {
  const routes = [
    {
      path: '/',
      element: <PrivateRoutes />,
      children: [
        { index: true, element: <Navigate to="/tasks/bucket" replace /> },
        { path: '/tasks/bucket', element: <Bucket /> },
        { path: '/tasks/next-7-days', element: <NextSevenDays /> },
        { path: '/tasks/today', element: <Today /> },
        { path: '/tasks/tomorrow', element: <Tomorrow /> },
        { path: '/projects/new', element: <div>New Project</div> },
        { path: '/projects/:projectId', element: <ProjectView /> },
        { path: '/terms-of-service', element: <TermsOfService /> },
        { path: '/privacy-policy', element: <PrivacyPolicy /> },
        { path: '/help-information', element: <HelpAndInformation /> },
        { path: '/profile', element: <Profile /> },
      ],
    },
    {
      path: '/',
      element: <AuthLayout />,
      children: [
        { path: 'sign-in', element: <SignIn /> },
        { path: 'sign-up', element: <SignUp /> },
        { path: 'forgot-password', element: <ForgotPassword /> },
        { path: 'reset-password', element: <ResetPassword /> },
      ],
    },

    {
      path: '*',
      element: <ErrorPage />,
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
