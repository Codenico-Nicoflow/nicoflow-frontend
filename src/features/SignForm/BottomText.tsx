import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function BottomText({ type }: { type: 'login' | 'register' }) {
  const { t } = useTranslation('auth');

  return (
    <div className="flex justify-center items-center w-full mt-4">
      {type === 'login' ? (
        <>
          <p className="text-sm text-muted-foreground me-1">{t('signIn.noAccount')} </p>
          <Link className="text-sm text-primary hover:underline hover:text-primary/80" to="/sign-up">
            {t('signIn.signUpLink')}
          </Link>
        </>
      ) : type === 'register' ? (
        <>
          <p className="text-sm text-muted-foreground me-1">{t('signUp.haveAccount')} </p>
          <Link className="text-sm text-primary hover:underline hover:text-primary/80" to="/sign-in">
            {t('signUp.signInLink')}
          </Link>
        </>
      ) : null}
    </div>
  );
}
