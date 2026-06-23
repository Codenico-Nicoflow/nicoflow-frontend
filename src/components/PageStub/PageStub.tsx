import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PageStubProps {
  title: string;
}

const PageStub = ({ title }: PageStubProps) => {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Construction className="h-10 w-10" />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm">{t('comingSoon')}</p>
    </div>
  );
};

export default PageStub;
