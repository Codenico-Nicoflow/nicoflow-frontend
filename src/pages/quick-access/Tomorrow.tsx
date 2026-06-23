import { useTranslation } from 'react-i18next';

import PageStub from '@/components/PageStub/PageStub';

const Tomorrow = () => {
  const { t } = useTranslation('nav');
  return <PageStub title={t('tomorrow')} />;
};

export default Tomorrow;
