import { motion } from 'framer-motion';
import { FileText, HelpCircle, LogOut, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

const CollapsedFooter = ({ handleLogout, isLoading }: { handleLogout: () => void; isLoading: boolean }) => {
  return (
    <motion.div
      className="p-2 border-t border-border/50 bg-gradient-to-br from-background to-muted/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="space-y-2">
        <div className="space-y-1">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 p-0 hover:bg-transparent transition-colors hover:text-primary"
              asChild
            >
              <Link to="/terms-of-service">
                <Shield className="w-4 h-4" />
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
              <Link to="/privacy-policy">
                <FileText className="w-4 h-4" />
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
              <Link to="/help-information">
                <HelpCircle className="w-4 h-4" />
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
              <LogOut className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollapsedFooter;
