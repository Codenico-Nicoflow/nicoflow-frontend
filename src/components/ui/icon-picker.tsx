import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';

import { LazyIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { ICON_IDS, type IconId } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value?: IconId;
  onChange: (iconId: IconId) => void;
  className?: string;
  'data-testid'?: string;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, 'data-testid': testId }) => {
  const handleIconSelect = (iconId: IconId) => {
    onChange(iconId);
  };

  return (
    <div data-testid={testId || 'icon-picker'} className="space-y-4">
      <div data-testid={testId ? `${testId}-header` : 'icon-picker-header'} className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Select Category Icon</h3>
      </div>

      <div
        data-testid={testId ? `${testId}-grid` : 'icon-picker-grid'}
        className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto"
      >
        <AnimatePresence>
          {ICON_IDS.map((iconId: IconId) => (
            <motion.div
              key={iconId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant={value === iconId ? 'default' : 'ghost'}
                size="sm"
                className={cn('h-10 w-10 p-0 relative', value === iconId && 'bg-primary text-primary-foreground')}
                onClick={() => handleIconSelect(iconId)}
              >
                <LazyIcon iconId={iconId} className="h-4 w-4" />
                {value === iconId && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary-foreground text-primary rounded-full p-0.5"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IconPicker;
