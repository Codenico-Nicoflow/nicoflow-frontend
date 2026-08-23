import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export interface ListPagerProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  'data-testid'?: string;
}

// Prev/next pager for settings-style lists that fetch everything up front
// (no server-side offset/limit yet). Hidden entirely at pageCount <= 1 so a
// short list never grows a dead control.
export const ListPager = ({ page, pageCount, onPageChange, 'data-testid': testId = 'list-pager' }: ListPagerProps) => {
  const { t } = useTranslation('common');

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2" data-testid={testId}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        data-testid={`${testId}-prev`}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('pagination.previous')}
      </Button>
      <span className="text-xs text-muted-foreground" data-testid={`${testId}-status`}>
        {t('pagination.pageOf', { page, total: pageCount })}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        data-testid={`${testId}-next`}
      >
        {t('pagination.next')}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
