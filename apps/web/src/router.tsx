import { useRoutes, Navigate, useLocation } from 'react-router-dom';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PrivateLayout from './components/layout/PrivateLayout';
import AuthLayout from './components/layout/AuthLayout';
import Inbox from './pages/tasks/Inbox';
import NextSevenDays from './pages/tasks/NextSevenDays';
import Today from './pages/tasks/Today';
import Tomorrow from './pages/tasks/Tomorrow';
import ProjectView from './pages/project/ProjectView';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import HelpAndInformation from './pages/HelpAndInformation';
import Profile from './pages/Profile';
import { useAppUser } from '@my-monorepo/store';
import ErrorPage from './pages/ErrorPage';

const PrivateRoutes = () => {
  const location = useLocation();
  const user = useAppUser();

  return user ? <PrivateLayout /> : <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
};

const AppRoutes = () => {
  const routes = [
    {
      path: '/',
      element: <PrivateRoutes />,
      children: [
        { index: true, element: <Navigate to="/tasks/inbox" replace /> },
        { path: '/tasks/inbox', element: <Inbox /> },
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
      path: '/auth',
      element: <AuthLayout />,
      children: [
        { path: 'sign-in', element: <SignIn /> },
        { path: 'sign-up', element: <SignUp /> },
        { path: 'forgot-password', element: <ForgotPassword /> },
        { path: 'reset-password', element: <ResetPassword /> },
      ],
    },
    {
      path: '/sign-in',
      element: <Navigate to="/auth/sign-in" replace />,
    },
    {
      path: '/sign-up',
      element: <Navigate to="/auth/sign-up" replace />,
    },
    {
      path: '/forgot-password',
      element: <Navigate to="/auth/forgot-password" replace />,
    },
    {
      path: '/reset-password',
      element: <Navigate to="/auth/reset-password" replace />,
    },

    {
      path: '*',
      element: <ErrorPage />,
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
