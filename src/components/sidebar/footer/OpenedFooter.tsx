import { motion } from 'framer-motion';
import { FileText, HelpCircle, LogOut, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import CustomDialog from '@/components/ui/custom-dialog';
import { useCustomDialog } from '@/hooks/useCustomDialog';
import { useIsMobile } from '@/hooks/useMobile';
import { type IUser, USER_STATUS } from '@/lib/types';
import { cn } from '@/lib/utils';

import ProCard from './ProCard';

const FOOTER_ITEMS = [
  {
    label: 'Terms of Service',
    icon: Shield,
    path: '/terms-of-service',
  },
  {
    label: 'Privacy Policy',
    icon: FileText,
    path: '/privacy-policy',
  },
  {
    label: 'Help & Information',
    icon: HelpCircle,
    path: '/help-information',
  },
];

const OpenedFooter = ({
  user,
  handleLogout,
  isLoading,
}: {
  user: IUser;
  handleLogout: () => void;
  isLoading: boolean;
}) => {
  const { openDialog, dialogProps, closeDialog } = useCustomDialog();
  const isMobile = useIsMobile();

  return (
    <motion.div
      className="p-4 border-t border-border/50 bg-gradient-to-br from-background to-muted/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <CustomDialog {...dialogProps} />
      {user?.status === USER_STATUS.REGULAR && !isMobile && <ProCard />}

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        {FOOTER_ITEMS.map(item => (
          <motion.div key={item.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start hover:bg-accent/50 hover:text-accent-foreground transition-colors"
              asChild
            >
              <Link to={item.path} className="flex items-center text-muted-foreground transition-colors">
                <item.icon className="w-4 h-4 mr-2 text-primary" />
                <span>{item.label}</span>
              </Link>
            </Button>
          </motion.div>
        ))}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start transition-colors',
              'hover:bg-destructive/10 text-destructive hover:text-destructive'
            )}
            onClick={() =>
              openDialog({
                title: 'Logout',
                description: 'Are you sure you want to logout?',
                acceptButton: {
                  text: 'Logout',
                  onClick: handleLogout,
                },
                cancelButton: {
                  text: 'Cancel',
                  onClick: closeDialog,
                },
              })
            }
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>{isLoading ? 'Logging out...' : 'Log out'}</span>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default OpenedFooter;
