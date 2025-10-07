import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const ProCard = () => {
  return (
    <motion.div
    className="mb-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
        <CardContent className="px-3">
          <div className="flex items-center gap-2 mb-2 justify-center cursor-default select-none">
            <Star className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold text-purple-900 text-sm">Upgrade to PRO</h3>
          </div>
          <p className="text-xs text-purple-700 mb-3 text-center select-none">
            Get 1 month free trial and unlock all the features of the pro plan.
          </p>
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium"
            size="sm"
            onClick={() => {
              // TODO: navigate to pro subscription page
            }}
          >
            Upgrade
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProCard;
