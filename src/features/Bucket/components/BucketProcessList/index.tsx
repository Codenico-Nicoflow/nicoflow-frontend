import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import type { ProcessingOption, ProcessingResult } from '@/lib/types';

interface BucketProcessListProps {
  processingOptions: readonly ProcessingOption[];
  selectedType: ProcessingResult | null;
  setSelectedType: (type: ProcessingResult) => void;
}

export const BucketProcessList = ({ processingOptions, selectedType, setSelectedType }: BucketProcessListProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Process as:</label>
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
              <Badge variant="secondary" className="ml-2 text-[10px] px-1">
                Soon
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
