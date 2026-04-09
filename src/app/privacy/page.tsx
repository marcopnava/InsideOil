import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg py-20 px-6">
      <div className="max-w-[680px] mx-auto">
        <Link href="/" className="text-[12px] text-muted hover:text-text no-underline mb-8 block">&larr; Back to home</Link>
        <h1 className="text-[32px] font-bold text-text mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-muted mb-10">Last updated: April 8, 2026</p>

        <div className="space-y-8 text-[14px] text-text2 leading-relaxed">
          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">1. Data Controller</h2>
            <p>InsideOil (&quot;we&quot;, &quot;us&quot;) operates insideoil.it. For questions about this policy, contact us at <strong>info@insideoil.it</strong>.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> name, email address, hashed password</li>
              <li><strong>Payment data:</strong> processed by Stripe; we store only your Stripe customer ID</li>
              <li><strong>Usage data:</strong> pages visited, features used, timestamps</li>
              <li><strong>Technical data:</strong> IP address, browser type, device info</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">3. Legal Basis (GDPR Art. 6)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contract performance:</strong> to provide the services you subscribed to</li>
              <li><strong>Legitimate interest:</strong> analytics, security, fraud prevention</li>
              <li><strong>Consent:</strong> marketing emails (opt-in only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">4. How We Use Your Data</h2>
            <p>We use your data to: provide and improve the platform, process payments, send transactional emails, detect fraud, and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">5. Data Sharing</h2>
            <p>We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe:</strong> payment processing</li>
              <li><strong>Vercel:</strong> hosting and analytics</li>
              <li><strong>Law enforcement:</strong> when legally required</li>
            </ul>
            <p className="mt-2">We do not sell your personal data.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We use analytics cookies only with your consent. You can manage preferences via the cookie banner.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">7. Your Rights (GDPR)</h2>
            <p>You have the right to: access, rectify, delete, port your data, object to processing, and withdraw consent. Contact <strong>info@insideoil.it</strong> to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">8. Data Retention</h2>
            <p>We retain account data for the duration of your account. After deletion, data is purged within 30 days. Payment records are retained for 10 years per fiscal obligations.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">9. Security</h2>
            <p>Passwords are hashed with bcrypt. All data is transmitted over HTTPS. Payment data is handled by PCI-DSS compliant Stripe.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">10. Changes</h2>
            <p>We may update this policy. Significant changes will be notified via email or in-app notice.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
