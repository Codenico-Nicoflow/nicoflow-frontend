import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';
import { ACCOUNT_FIRST_NAME_INPUT, ACCOUNT_LAST_NAME_INPUT, ACCOUNT_SAVE_BUTTON } from '@/lib/test_ids';
import { type ProfileFormData, profileSchema, showErrorToast, showSuccessToast, ToastMessages } from '@/lib/utils';

// Settings › Account. Edits firstName/lastName via PATCH /users/me. email and
// username are login credentials — shown read-only, never editable here.
export const AccountCard = () => {
  const { t } = useTranslation('common');
  const user = useAppUser();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    values: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data).unwrap();
      showSuccessToast(ToastMessages.ACCOUNT_UPDATED, toast);
      form.reset(data);
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.settings.accountSection')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.firstNameLabel')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" data-testid={ACCOUNT_FIRST_NAME_INPUT} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.lastNameLabel')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" data-testid={ACCOUNT_LAST_NAME_INPUT} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ReadOnlyField
              label={t('pages.settings.emailLabel')}
              value={user?.email ?? ''}
              hint={t('pages.settings.readOnlyHint')}
            />
            <ReadOnlyField
              label={t('pages.settings.usernameLabel')}
              value={user?.username ?? ''}
              hint={t('pages.settings.readOnlyHint')}
            />

            <Button
              type="submit"
              data-testid={ACCOUNT_SAVE_BUTTON}
              className="self-start"
              disabled={isLoading || !form.formState.isDirty}
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('pages.settings.savingButton')}
                </>
              ) : (
                t('pages.settings.saveButton')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const ReadOnlyField = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-muted-foreground">{label}</Label>
    <Input value={value} readOnly disabled aria-label={`${label} (${hint})`} />
    <p className="text-xs text-muted-foreground">{hint}</p>
  </div>
);
