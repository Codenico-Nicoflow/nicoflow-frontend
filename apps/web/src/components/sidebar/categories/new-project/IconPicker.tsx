import React, { useState } from 'react';

import { AnimatePresence,motion } from 'framer-motion';
import { Check,Palette } from 'lucide-react';

import { ICON_IDS, type IconId } from '@my-monorepo/utils';

import { LazyIcon } from '@/components/LazyIcon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value?: IconId;
  onChange: (iconId: IconId) => void;
  className?: string;
}

const IconPicker: React.FC<IconPickerProps> = ({ value = 'folder', onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleIconSelect = (iconId: IconId) => {
    onChange(iconId);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 sm:h-12 w-14 justify-start text-left font-normal border-2 focus:border-primary transition-colors',
            className
          )}
        >
          <div className="flex items-center gap-3">
            <LazyIcon iconId={value} className="h-4 w-4" />
            {!value && <span className="text-sm sm:text-base">Choose an icon</span>}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Select Project Icon</h3>
          </div>

          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {ICON_IDS.map(iconId => (
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
                        <Check className="h-2 w-2" />
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
