import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg py-20 px-6">
      <div className="max-w-[680px] mx-auto">
        <Link href="/" className="text-[12px] text-muted hover:text-text no-underline mb-8 block">&larr; Back to home</Link>
        <h1 className="text-[32px] font-bold text-text mb-2">Terms of Service</h1>
        <p className="text-[13px] text-muted mb-10">Last updated: April 8, 2026</p>

        <div className="space-y-8 text-[14px] text-text2 leading-relaxed">
          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">1. Acceptance</h2>
            <p>By accessing insideoil.it (&quot;the Platform&quot;), you agree to these Terms. If you do not agree, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">2. Service Description</h2>
            <p>InsideOil provides crude oil market intelligence, including vessel tracking, commodity analysis, and algorithmic trading signals. The Platform is intended for informational purposes only.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">3. No Financial Advice</h2>
            <p><strong>InsideOil does not provide financial, investment, or trading advice.</strong> All signals, proposals, and analytics are for informational purposes only. You are solely responsible for your trading decisions. Past performance does not guarantee future results.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">4. Accounts</h2>
            <p>You must provide accurate information when registering. You are responsible for maintaining the security of your account credentials. One account per person.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">5. Subscriptions & Payments</h2>
            <p>Paid plans are billed monthly or annually via Stripe. You can cancel at any time; access continues until the end of the billing period. Refunds are handled on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">6. Acceptable Use</h2>
            <p>You agree not to: reverse-engineer the Platform, scrape data programmatically, share account credentials, use the Platform for any illegal purpose, or redistribute data without authorization.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">7. Data Accuracy</h2>
            <p>We source data from third-party providers (AIS, OpenSky, Yahoo Finance, etc.). While we strive for accuracy, we do not guarantee the completeness or timeliness of any data. Use at your own risk.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">8. Limitation of Liability</h2>
            <p>InsideOil shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform, including trading losses.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms, without prior notice.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">10. Governing Law</h2>
            <p>These Terms are governed by the laws of Italy. Any disputes shall be resolved in the courts of Italy.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-text mb-3">11. Contact</h2>
            <p>For questions about these Terms, contact us at <strong>legal@insideoil.it</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
