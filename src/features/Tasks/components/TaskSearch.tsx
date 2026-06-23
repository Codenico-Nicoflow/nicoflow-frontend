import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TaskSearch = ({ value, onChange, placeholder, className }: TaskSearchProps) => {
  const { t } = useTranslation('task');
  const resolvedPlaceholder = placeholder ?? t('search.placeholder');

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="ps-9 pe-9 h-10"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default TaskSearch;
