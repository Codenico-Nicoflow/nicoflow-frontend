import { useNavigate } from 'react-router-dom';

import { useSidebar } from '@/components/ui/sidebar';
import { useAppUser, useLogoutMutation } from '@/lib/store';

import CollapsedFooter from '../CollapsedFooter';
import OpenedFooter from '../OpenedFooter';

const SidebarFooter = () => {
  const user = useAppUser();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();
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

  if (isCollapsed) {
    return <CollapsedFooter handleLogout={handleLogout} isLoading={isLoading} />;
  }

  if (!user) return null;

  return <OpenedFooter user={user} handleLogout={handleLogout} isLoading={isLoading} />;
};

export default SidebarFooter;
