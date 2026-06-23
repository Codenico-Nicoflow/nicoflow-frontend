import { useTranslation } from 'react-i18next';

import PageStub from '@/components/PageStub/PageStub';

const Bucket = () => {
  const { t } = useTranslation('nav');
  return <PageStub title={t('bucket')} />;
};

export default Bucket;
