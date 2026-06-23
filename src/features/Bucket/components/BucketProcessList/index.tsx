import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import type { ProcessingOption, ProcessingResult } from '@/lib/types';

interface BucketProcessListProps {
  processingOptions: readonly ProcessingOption[];
  selectedType: ProcessingResult | null;
  setSelectedType: (type: ProcessingResult) => void;
}

export const BucketProcessList = ({ processingOptions, selectedType, setSelectedType }: BucketProcessListProps) => {
  const { t } = useTranslation('bucket');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('processDialog.processAs')}</label>
      <div className="flex flex-wrap gap-2">
        {processingOptions.map(option => (
          <Button
            key={option.value}
            type="button"
            variant={selectedType === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => option.enabled && setSelectedType(option.value)}
            disabled={!option.enabled}
            className="relative"
          >
            {option.label}
            {!option.enabled && (
              <Badge variant="secondary" className="ms-2 text-[10px] px-1">
                {t('processDialog.soon')}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
