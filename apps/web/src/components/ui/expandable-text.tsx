import * as React from 'react';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export interface ExpandableTextProps {
  children: string;
  maxLength?: number;
  className?: string;
  buttonClassName?: string;
}

const ExpandableText = ({ children, maxLength = 150, className, buttonClassName }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const shouldTruncate = children.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? children : `${children.slice(0, maxLength)}...`;

  return (
    <div className="space-y-2">
      <motion.p
        className={cn(
          'text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words',
          shouldTruncate && !isExpanded && 'cursor-pointer hover:text-primary transition-colors',
          className
        )}
        onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
        initial={false}
        animate={{ height: 'auto' }}
        transition={{ duration: 0.2 }}
      >
        {displayText}
      </motion.p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn('text-xs text-primary hover:underline', buttonClassName)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export { ExpandableText };
