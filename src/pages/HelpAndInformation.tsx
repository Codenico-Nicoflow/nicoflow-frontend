import { useTranslation } from 'react-i18next';

import PageStub from '@/components/PageStub/PageStub';

export default function HelpAndInformation() {
  const { t } = useTranslation();
  return <PageStub title={t('pages.helpAndInformation.title')} />;
}
