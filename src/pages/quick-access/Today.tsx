import { useTranslation } from 'react-i18next';

import PageStub from '@/components/PageStub/PageStub';

const Today = () => {
  const { t } = useTranslation('nav');
  return <PageStub title={t('today')} />;
};

export default Today;
