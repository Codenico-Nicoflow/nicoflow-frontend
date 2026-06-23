import { LogOut, MonitorSmartphone, Settings, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import i18n from '@/lib/i18n';
import { useAppUser, useLogoutAllMutation, useLogoutMutation } from '@/lib/store';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const UserMenu = () => {
  const { t } = useTranslation(['nav', 'common']);
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
      toast.error(i18n.t('errors:UNEXPECTED_ERROR'));
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll().unwrap();
      toast.success(i18n.t('errors:LOGGED_OUT_ALL_DEVICES_SUCCESSFULLY'));
      navigate('/sign-in');
    } catch {
      toast.error(i18n.t('errors:UNEXPECTED_ERROR'));
    }
  };

  const confirmLogout = () =>
    openDialog({
      title: t('nav:logout'),
      description: t('nav:logoutConfirm'),
      cancelButton: { text: t('common:actions.cancel'), onClick: () => {} },
      acceptButton: { text: t('nav:logout'), onClick: handleLogout },
    });

  const confirmLogoutAll = () =>
    openDialog({
      title: t('nav:logoutAll'),
      description: t('nav:logoutAllConfirm'),
      cancelButton: { text: t('common:actions.cancel'), onClick: () => {} },
      acceptButton: { text: t('nav:logoutAll'), onClick: handleLogoutAll },
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
            aria-label={t('nav:accountMenu')}
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
            <UserIcon className="me-2 h-4 w-4" />
            {t('nav:profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="me-2 h-4 w-4" />
            {t('nav:settings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={confirmLogout} variant="destructive" data-testid="user-menu-logout">
            <LogOut className="me-2 h-4 w-4" />
            {t('nav:logout')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={confirmLogoutAll} variant="destructive" data-testid="user-menu-logout-all">
            <MonitorSmartphone className="me-2 h-4 w-4" />
            {t('nav:logoutAll')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
