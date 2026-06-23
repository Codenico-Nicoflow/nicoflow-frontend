import { useTranslation } from 'react-i18next';

import PageStub from '@/components/PageStub/PageStub';

const NextSevenDays = () => {
  const { t } = useTranslation('nav');
  return <PageStub title={t('nextSevenDays')} />;
};

export default NextSevenDays;
