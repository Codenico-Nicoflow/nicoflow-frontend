import { FileText, HelpCircle, Shield, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PreferencesCard } from '@/features/Settings/PreferencesCard';
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

      <Card>
        <CardHeader>
          <CardTitle>{t('pages.settings.accountSection')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.imageUrl} alt={user?.username || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 font-bold text-primary-foreground">
              {(user?.username || user?.email || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{user?.username || '—'}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {isFree ? t('pages.settings.freePlan') : t('pages.settings.proPlan')}
            </p>
          </div>
        </CardContent>
      </Card>

      <PreferencesCard />

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
