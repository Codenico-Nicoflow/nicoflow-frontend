import { FileText, HelpCircle, Shield, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountCard } from '@/features/Settings/AccountCard';
import { NotificationsCard } from '@/features/Settings/notifications/NotificationsCard';
import { PreferencesCard } from '@/features/Settings/PreferencesCard';
import { RecurrenceCard } from '@/features/Settings/recurrence/RecurrenceCard';
import { SecurityCard } from '@/features/Settings/SecurityCard';
import { useAppUser } from '@/lib/store';
import { USER_STATUS } from '@/lib/types';

const Settings = () => {
  const { t } = useTranslation();
  const user = useAppUser();
  const isFree = user?.status !== USER_STATUS.PREMIUM;

  const footerLinks = [
    { label: t('pages.settings.links.terms'), icon: Shield, to: '/terms-of-service' },
    { label: t('pages.settings.links.privacy'), icon: FileText, to: '/privacy-policy' },
    { label: t('pages.settings.links.help'), icon: HelpCircle, to: '/help-information' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('pages.settings.title')}</h1>

      <AccountCard />

      <SecurityCard />

      <PreferencesCard />

      <NotificationsCard />

      <RecurrenceCard />

      {isFree && (
        <Card className="border-primary/20 bg-accent">
          <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-accent-foreground">{t('pages.settings.upgradeTitle')}</h3>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">{t('pages.settings.upgradeDescription')}</p>
            <Button className="mt-1">{t('pages.settings.upgradeButton')}</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('pages.settings.aboutSection')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {footerLinks.map(item => (
            <Button key={item.to} variant="ghost" className="justify-start" asChild>
              <Link to={item.to}>
                <item.icon className="me-2 h-4 w-4 text-primary" />
                {item.label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
