import { Navigate, useLocation, useRoutes } from 'react-router-dom';

import { AuthLayout, PrivateLayout } from '@/layout';
import { useAppUser } from '@/lib/store';
import {
  AIPage,
  AreasBoard,
  Calendar,
  ErrorPage,
  Habits,
  HelpAndInformation,
  NoteView,
  PrivacyPolicy,
  Settings,
  TermsOfService,
} from '@/pages';
import { ForgotPassword, ResetPassword, SignIn, SignUp, VerifyEmail } from '@/pages/auth';
import { ProjectView } from '@/pages/project';
import { Bucket, Focus, NextSevenDays, Today, Tomorrow } from '@/pages/quick-access';

const PrivateRoutes = () => {
  const location = useLocation();
  const user = useAppUser();

  return user ? <PrivateLayout /> : <Navigate to="/sign-in" state={{ from: location }} replace />;
};

const AppRoutes = () => {
  const routes = [
    {
      path: '/',
      element: <PrivateRoutes />,
      children: [
        { index: true, element: <Navigate to="/quick-access/today" replace /> },
        { path: '/quick-access/bucket', element: <Bucket /> },
        { path: '/quick-access/focus', element: <Focus /> },
        { path: '/quick-access/next-7-days', element: <NextSevenDays /> },
        { path: '/quick-access/today', element: <Today /> },
        { path: '/quick-access/tomorrow', element: <Tomorrow /> },
        { path: '/areas', element: <AreasBoard /> },
        { path: '/calendar', element: <Calendar /> },
        { path: '/habits', element: <Habits /> },
        { path: '/ai', element: <AIPage /> },
        { path: '/ai/:id', element: <AIPage /> },
        { path: '/projects/:projectId', element: <ProjectView /> },
        { path: '/notes/:noteId', element: <NoteView /> },
        { path: '/settings', element: <Settings /> },
        { path: '/help-information', element: <HelpAndInformation /> },
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
        { path: 'verify-email', element: <VerifyEmail /> },
      ],
    },

    // Publicly accessible — no auth required
    { path: '/privacy-policy', element: <PrivacyPolicy /> },
    { path: '/terms-of-service', element: <TermsOfService /> },

    {
      path: '*',
      element: <ErrorPage />,
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
