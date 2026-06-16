import { LogOut, MonitorSmartphone, Settings, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CustomDialog } from '@/components/CustomDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomDialog } from '@/hooks/useCustomDialog';
import { useAppUser, useLogoutAllMutation, useLogoutMutation } from '@/lib/store';
import { ToastMessages } from '@/lib/utils';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const UserMenu = () => {
  const user = useAppUser();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const [logoutAll] = useLogoutAllMutation();
  const { openDialog, dialogProps } = useCustomDialog();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/sign-in');
    } catch {
      toast.error(ToastMessages.UNEXPECTED_ERROR);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll().unwrap();
      toast.success(ToastMessages.LOGGED_OUT_ALL_DEVICES_SUCCESSFULLY);
      navigate('/sign-in');
    } catch {
      toast.error(ToastMessages.UNEXPECTED_ERROR);
    }
  };

  const confirmLogout = () =>
    openDialog({
      title: 'Log out',
      description: 'Are you sure you want to log out of this device?',
      cancelButton: { text: 'Cancel', onClick: () => {} },
      acceptButton: { text: 'Log out', onClick: handleLogout },
    });

  const confirmLogoutAll = () =>
    openDialog({
      title: 'Log out of all devices',
      description: 'This signs you out everywhere. You will need to log in again on each device.',
      cancelButton: { text: 'Cancel', onClick: () => {} },
      acceptButton: { text: 'Log out everywhere', onClick: handleLogoutAll },
    });

  return (
    <>
      <CustomDialog {...dialogProps} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Account menu"
            data-testid="user-menu-trigger"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.imageUrl} alt={user.username || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground">
                {getInitials(user.username || user.email || 'U')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{user.username || user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={confirmLogout} variant="destructive" data-testid="user-menu-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
          <DropdownMenuItem onClick={confirmLogoutAll} variant="destructive" data-testid="user-menu-logout-all">
            <MonitorSmartphone className="mr-2 h-4 w-4" />
            Log out of all devices
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
