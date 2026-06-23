import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAppUser } from '@/lib/store';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const user = useAppUser();
  const backTo = user ? '/' : '/sign-in';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('actions.back')}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">{t('pages.privacyPolicy.title')}</h1>
        <p className="text-sm text-muted-foreground mb-10">{t('pages.privacyPolicy.lastUpdated')}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-3">{t('pages.privacyPolicy.s1Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us, such as your name, email address, and password when you
              create an account. We also collect information about how you use Nicoflow, including tasks, projects, and
              areas you create.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('pages.privacyPolicy.s2Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect to provide, maintain, and improve Nicoflow, to process transactions, to
              send you technical notices, and to respond to your comments and questions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('pages.privacyPolicy.s3Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely on our servers. We use industry-standard encryption to protect your
              information in transit and at rest. We retain your data for as long as your account is active or as needed
              to provide you services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('pages.privacyPolicy.s4Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to outside parties. We may share
              your information with trusted third parties who assist us in operating our platform, as long as those
              parties agree to keep this information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('pages.privacyPolicy.s5Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to maintain your session and remember your preferences.
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('pages.privacyPolicy.s6Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal data at any time. You may also request a
              copy of the data we hold about you. To exercise these rights, contact us at{' '}
              <span className="text-primary">privacy@nicoflow.app</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">{t('pages.privacyPolicy.s7Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <span className="text-primary">privacy@nicoflow.app</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
