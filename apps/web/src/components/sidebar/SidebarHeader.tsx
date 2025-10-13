import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAppUser } from '@my-monorepo/store';
import { USER_STATUS } from '@my-monorepo/types';
import { capitalize } from '@my-monorepo/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { SidebarHeader as ShadCnSidebarHeader } from '../ui/sidebar';

const SidebarHeader = ({ className }: { className?: string & React.ComponentProps<typeof ShadCnSidebarHeader> }) => {
  const user = useAppUser();
  const navigate = useNavigate();

  const hasPremiumPlan = user?.status === USER_STATUS.PREMIUM;

  console.log(user);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ShadCnSidebarHeader className={cn('p-4 border-b border-border/50', className)}>
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.div
          whileTap={{ scale: 0.95, rotate: -5, opacity: 0.5 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Avatar
            className={cn('ring-2 ring-primary/20 ring-offset-2 ring-offset-background cursor-pointer w-12 h-12')}
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={user?.imageUrl} alt={user?.username || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
              {user?.username ? getInitials(user.username) : 'U'}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="flex-1 min-w-0 cursor-default">
          <motion.h3
            className="font-semibold text-foreground truncate"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {capitalize(user?.username || 'User')}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="text-sm text-muted-foreground truncate"
          >
            {user?.email || 'Email'}
          </motion.p>
          <motion.div
            className="flex items-center gap-2 mt-1"
            whileHover={{ scale: 1.04, rotate: -2 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Badge
              variant="default"
              className={cn(
                'text-xs px-2 py-0.5',
                hasPremiumPlan && 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
              )}
            >
              {hasPremiumPlan && <Crown className="w-3 h-3 mr-1" />}
              {hasPremiumPlan ? 'Premium User' : 'Regular User'}
            </Badge>
          </motion.div>
        </div>
      </motion.div>
    </ShadCnSidebarHeader>
  );
};

export default SidebarHeader;
