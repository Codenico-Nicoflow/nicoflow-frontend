import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAppUser } from '@/lib/store';

export default function TermsOfService() {
  const user = useAppUser();
  const backTo = user ? '/' : '/sign-in';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: January 1, 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Nicoflow, you agree to be bound by these Terms of Service. If you do not agree to
              these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nicoflow is a task management platform. You agree to use the service only for lawful purposes and in
              accordance with these terms. You are responsible for maintaining the security of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must provide accurate and complete information when creating an account. You are responsible for all
              activity that occurs under your account. You must notify us immediately of any unauthorized use of your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nicoflow and its original content, features, and functionality are owned by Nicoflow and are protected by
              international copyright, trademark, and other intellectual property laws. Your content remains yours — we
              do not claim ownership over tasks, projects, or notes you create.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account at any time if you violate these terms. You may also delete your
              account at any time from your profile settings. Upon termination, your data will be deleted within 30
              days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nicoflow is provided "as is" without warranties of any kind. We are not liable for any indirect,
              incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify you of significant changes via
              email or a notice in the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, contact us at{' '}
              <span className="text-primary">legal@nicoflow.app</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
