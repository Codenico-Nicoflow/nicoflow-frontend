import { FileText, HelpCircle, Shield, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppUser } from '@/lib/store';
import { USER_STATUS } from '@/lib/types';

const FOOTER_LINKS = [
  { label: 'Terms of Service', icon: Shield, to: '/terms-of-service' },
  { label: 'Privacy Policy', icon: FileText, to: '/privacy-policy' },
  { label: 'Help & Information', icon: HelpCircle, to: '/help-information' },
];

const Settings = () => {
  const user = useAppUser();
  const isFree = user?.status !== USER_STATUS.PREMIUM;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
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
            <p className="text-xs text-muted-foreground">{isFree ? 'Free plan' : 'Pro plan'}</p>
          </div>
        </CardContent>
      </Card>

      {isFree && (
        <Card className="border-primary/20 bg-accent">
          <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-accent-foreground">Upgrade to PRO</h3>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Get a 1-month free trial and unlock unlimited areas, projects, AI, and more.
            </p>
            <Button className="mt-1">Upgrade</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About &amp; legal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {FOOTER_LINKS.map(item => (
            <Button key={item.to} variant="ghost" className="justify-start" asChild>
              <Link to={item.to}>
                <item.icon className="mr-2 h-4 w-4 text-primary" />
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
