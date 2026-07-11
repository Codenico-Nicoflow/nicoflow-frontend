import * as React from 'react';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export interface ExpandableTextProps {
  children: string;
  maxLength?: number;
  className?: string;
  buttonClassName?: string;
  'data-testid'?: string;
}

const ExpandableText = ({
  children,
  maxLength = 150,
  className,
  buttonClassName,
  'data-testid': testId,
}: ExpandableTextProps) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const shouldTruncate = children.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? children : `${children.slice(0, maxLength)}...`;

  return (
    <div data-testid={testId || 'expandable-text'} className="space-y-2">
      <motion.p
        data-testid={testId ? `${testId}-text` : 'expandable-text-text'}
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
          data-testid={testId ? `${testId}-button` : 'expandable-text-button'}
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn('text-xs text-primary hover:underline', buttonClassName)}
        >
          {isExpanded ? t('actions.showLess') : t('actions.showMore')}
        </button>
      )}
    </div>
  );
};

export { ExpandableText };
