import { motion } from 'framer-motion';
import { Crown, LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAppUser, useLogoutMutation } from '@my-monorepo/store';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const UserProfile = () => {
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserStatus = () => {
    // Mock user status - you can replace with real data
    return {
      role: 'Premium User',
      tasksCompleted: 42,
      streak: 7,
      level: 'Expert',
    };
  };

  const status = getUserStatus();

  // Collapsed version - show only avatar and essential icons
  if (isCollapsed) {
    return (
      <motion.div
        className="p-2 border-t border-border/50 bg-gradient-to-br from-background to-muted/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="space-y-2">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex justify-center"
          >
            <Avatar className="w-8 h-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={undefined} alt={user?.username || 'User'} /> {/* TODO: add user avatar */}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm">
                {user?.username ? getInitials(user.username) : 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="space-y-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 p-0 hover:bg-transparent transition-colors hover:text-primary"
                asChild
              >
                <Link to="/profile">
                  <User className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 p-0 hover:bg-transparent transition-colors hover:text-primary"
                asChild
              >
                <Link to="/settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 p-0 hover:bg-transparent text-destructive hover:text-destructive/50 transition-colors"
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOut className="w-4 h-4 " />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-4 border-t border-border/50 bg-gradient-to-br from-background to-muted/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* User Info Section */}
      <motion.div
        className="flex items-center gap-3 mb-4"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <Avatar className="w-12 h-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={undefined} alt={user?.username || 'User'} /> {/* TODO: add user avatar */}
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-lg">
              {user?.username ? getInitials(user.username) : 'U'}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="flex-1 min-w-0">
          <motion.h3
            className="font-semibold text-foreground truncate"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {user?.username || 'User'}
          </motion.h3>
          <motion.div
            className="flex items-center gap-2 mt-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              <Crown className="w-3 h-3 mr-1" />
              {status.role}
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="grid grid-cols-3 gap-2 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <motion.div
          className="text-center p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="text-lg font-bold text-foreground">{status.tasksCompleted}</div>
          <div className="text-xs text-muted-foreground">Tasks</div>
        </motion.div>
        <motion.div
          className="text-center p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="text-lg font-bold text-foreground">{status.streak}</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </motion.div>
        <motion.div
          className="text-center p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="text-lg font-bold text-foreground">{status.level}</div>
          <div className="text-xs text-muted-foreground">Level</div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start hover:bg-accent/50 transition-colors"
            asChild
          >
            <Link to="/profile">
              <User className="w-4 h-4 mr-2" />
              <span>View Profile</span>
            </Link>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start hover:bg-accent/50 transition-colors"
            asChild
          >
            <Link to="/settings">
              <Settings className="w-4 h-4 mr-2" />
              <span>Settings</span>
            </Link>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start transition-colors',
              'hover:bg-destructive/10 text-destructive hover:text-destructive'
            )}
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfile;
