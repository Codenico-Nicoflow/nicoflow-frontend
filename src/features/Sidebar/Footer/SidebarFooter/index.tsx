import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useSidebar } from '@/components/ui/sidebar';
import { useAppUser, useLogoutAllMutation, useLogoutMutation } from '@/lib/store';
import { ToastMessages } from '@/lib/utils';

import CollapsedFooter from '../CollapsedFooter';
import OpenedFooter from '../OpenedFooter';

const SidebarFooter = () => {
  const user = useAppUser();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();
  const [logoutAll, { isLoading: isLoadingAll }] = useLogoutAllMutation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll().unwrap();
      toast.success(ToastMessages.LOGGED_OUT_ALL_DEVICES_SUCCESSFULLY);
      navigate('/sign-in');
    } catch (error) {
      console.error('Logout-all failed:', error);
    }
  };

  if (isCollapsed) {
    return <CollapsedFooter handleLogout={handleLogout} isLoading={isLoading} />;
  }

  if (!user) return null;

  return (
    <OpenedFooter
      user={user}
      handleLogout={handleLogout}
      isLoading={isLoading}
      handleLogoutAll={handleLogoutAll}
      isLoadingAll={isLoadingAll}
    />
  );
};

export default SidebarFooter;
