import { useTranslation } from 'react-i18next';

import PageStub from '@/components/PageStub/PageStub';

const Profile = () => {
  const { t } = useTranslation();
  return <PageStub title={t('pages.profile.title')} />;
};

export default Profile;
