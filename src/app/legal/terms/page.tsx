import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | CallMaker24',
  description: 'CallMaker24 Terms of Service — the agreement governing your use of our platform.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">CallMaker24</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link>
            <Link href="/support" className="text-gray-600 hover:text-gray-900">Support</Link>
          </nav>
        </div>
      </header>

      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: February 18, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

            {/* Introduction */}
            <section>
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the CallMaker24 platform
                and services (the &ldquo;Service&rdquo;) provided by Mtsryde Holdings LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
                or &ldquo;our&rdquo;). By creating an account or using the Service, you agree to be bound by these Terms.
                If you do not agree, do not use the Service.
              </p>
            </section>

            {/* 1. Acceptance of Terms */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using CallMaker24, you confirm that you:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Are at least 18 years of age.</li>
                <li>Have the legal authority to enter into these Terms on behalf of yourself or the entity you represent.</li>
                <li>Agree to comply with all applicable local, state, national, and international laws and regulations.</li>
              </ul>
            </section>

            {/* 2. Service Description */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Description</h2>
              <p>CallMaker24 is an all-in-one business communication and marketing platform that includes:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Email marketing campaigns and automation.</li>
                <li>SMS messaging and text campaign management.</li>
                <li>IVR (Interactive Voice Response) call center system.</li>
                <li>AI-powered chatbot for customer engagement.</li>
                <li>Social media management (Facebook, Instagram).</li>
                <li>Customer loyalty and rewards programs.</li>
                <li>Customer Relationship Management (CRM).</li>
                <li>Shopify, Stripe, and third-party integrations.</li>
              </ul>
              <p className="mt-3">
                We reserve the right to modify, suspend, or discontinue any feature of the Service at any time
                with reasonable notice.
              </p>
            </section>

            {/* 3. Accounts & Registration */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Accounts &amp; Registration</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide accurate and complete registration information.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>You are responsible for all activities under your account.</li>
                <li>Notify us immediately of any unauthorized access to your account.</li>
                <li>We may suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            {/* 4. SMS Marketing Consent */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. SMS Marketing Consent</h2>
              <p>By using our SMS features, you agree to the following:</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
                <ul className="list-disc pl-6 space-y-1 text-amber-800">
                  <li>You may receive marketing text messages and SMS communications from CallMaker24.</li>
                  <li>Message frequency varies based on your activity and campaigns.</li>
                  <li>Message and data rates may apply from your wireless carrier.</li>
                  <li>Reply <strong>STOP</strong> to unsubscribe from SMS messages at any time.</li>
                  <li>Reply <strong>HELP</strong> for assistance.</li>
                  <li>SMS consent is not a condition of purchasing any service.</li>
                </ul>
              </div>
              <p className="mt-3">
                When sending SMS messages to your own customers through our platform, you are responsible for
                obtaining proper consent in compliance with the Telephone Consumer Protection Act (TCPA),
                CAN-SPAM Act, and all other applicable telecommunications regulations.
              </p>
            </section>

            {/* 5. Subscription & Billing */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Subscription &amp; Billing</h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.1 Plans &amp; Pricing</h3>
              <p>We offer tiered subscription plans (Starter, Elite, Pro, Enterprise) with monthly and annual billing options. 
                Current pricing is available on our subscription page. We reserve the right to change pricing with 30 days&apos; notice.</p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.2 Free Trial</h3>
              <p>New accounts may receive a 30-day free trial. After the trial period, you must subscribe to a paid plan to continue using premium features.</p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.3 Payment Processing</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Stripe:</strong> For direct signup users, payments are processed securely through Stripe.</li>
                <li><strong>Shopify Billing:</strong> For merchants who install CallMaker24 through the Shopify App Store, billing is handled exclusively through Shopify&apos;s Billing API, as required by Shopify.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.4 Refund Policy</h3>
              <p>
                Subscription fees are non-refundable except as required by applicable law. If you cancel your subscription,
                you will retain access to paid features until the end of your current billing period.
                Annual subscriptions cancelled within the first 14 days may be eligible for a prorated refund.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">5.5 Cancellation</h3>
              <p>
                You may cancel your subscription at any time from your account settings. Cancellation takes effect
                at the end of the current billing period. Your account will be downgraded to the free tier.
              </p>
            </section>

            {/* 6. Shopify App Store */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Shopify App Store Terms</h2>
              <p>If you access CallMaker24 through the Shopify App Store:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Your use is also subject to the <a href="https://www.shopify.com/legal/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Shopify Terms of Service</a>.</li>
                <li>All billing is processed through Shopify&apos;s Billing API. Stripe checkout is not available for Shopify merchants.</li>
                <li>Uninstalling the app will cancel your subscription and trigger data deletion within 48 hours.</li>
                <li>We access only the Shopify store data for which you grant permissions during app installation.</li>
                <li>You may revoke data access at any time by uninstalling the app from your Shopify admin.</li>
              </ul>
            </section>

            {/* 7. User Responsibilities */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Use the Service in compliance with all applicable laws and regulations.</li>
                <li>Obtain proper consent before sending marketing communications to your customers.</li>
                <li>Not upload or transmit harmful, illegal, or infringing content.</li>
                <li>Not attempt to reverse-engineer, hack, or interfere with the Service.</li>
                <li>Not use the Service for spam, phishing, or other abusive communications.</li>
                <li>Comply with the CAN-SPAM Act, TCPA, GDPR, and other applicable regulations when using our communication tools.</li>
                <li>Maintain accurate customer opt-in/opt-out records for SMS and email campaigns.</li>
              </ul>
            </section>

            {/* 8. Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">8.1 Our Property</h3>
              <p>
                The Service, including its design, features, code, documentation, logos, and trademarks, is owned by
                Mtsryde Holdings LLC and protected by intellectual property laws. You may not copy, modify, distribute,
                or create derivative works without our prior written consent.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">8.2 Your Content</h3>
              <p>
                You retain ownership of all content you upload to the Service (customer lists, campaigns, templates, etc.).
                You grant us a limited, non-exclusive license to use your content solely for the purpose of operating
                and improving the Service.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="uppercase text-sm font-semibold text-gray-900 mb-2">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>
                    THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
                    WHETHER EXPRESS, IMPLIED, OR STATUTORY.
                  </li>
                  <li>
                    WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
                  </li>
                  <li>
                    IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS
                    PRECEDING THE CLAIM.
                  </li>
                  <li>
                    WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                    INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
                  </li>
                </ul>
              </div>
            </section>

            {/* 10. Indemnification */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Mtsryde Holdings LLC, its officers, directors,
                employees, and agents from any claims, damages, losses, liabilities, costs, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Your use of or inability to use the Service.</li>
                <li>Your violation of these Terms.</li>
                <li>Your violation of any applicable law or regulation.</li>
                <li>Your infringement of any third-party rights.</li>
                <li>Any content you upload, transmit, or distribute through the Service.</li>
              </ul>
            </section>

            {/* 11. Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Privacy</h2>
              <p>
                Your use of the Service is also governed by our{' '}
                <Link href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>,
                which describes how we collect, use, and protect your personal information.
                Our{' '}
                <Link href="/data-deletion" className="text-blue-600 hover:underline">Data Deletion</Link>{' '}
                page explains how to request deletion of your data.
              </p>
            </section>

            {/* 12. Termination */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Termination</h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">12.1 By You</h3>
              <p>You may terminate your account at any time by cancelling your subscription and deleting your account from Settings.</p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">12.2 By Us</h3>
              <p>We may suspend or terminate your account immediately, without prior notice, if:</p>
              <ul className="list-disc pl-6 space-y-1 mt-1">
                <li>You violate these Terms or any applicable law.</li>
                <li>Your use poses a security risk to the platform or other users.</li>
                <li>Your account is used for fraudulent or abusive activity.</li>
                <li>You fail to pay subscription fees when due.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">12.3 Effect of Termination</h3>
              <p>
                Upon termination, your right to use the Service ceases immediately. We will retain your data
                for 30 days to allow for data export, after which it will be permanently deleted, except as
                required by law.
              </p>
            </section>

            {/* 13. Dispute Resolution */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Dispute Resolution</h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">13.1 Informal Resolution</h3>
              <p>
                Before initiating any formal proceeding, you agree to first contact us at{' '}
                <a href="mailto:support@callmaker24.com" className="text-blue-600 hover:underline">support@callmaker24.com</a>{' '}
                to attempt to resolve the dispute informally within 30 days.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">13.2 Arbitration</h3>
              <p>
                Any dispute not resolved informally shall be settled by binding arbitration in accordance with
                the rules of the American Arbitration Association. The arbitration shall take place in
                Minneapolis, Minnesota.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">13.3 Class Action Waiver</h3>
              <p>
                You agree that any dispute resolution will be conducted on an individual basis and not as a
                class action, collective action, or representative proceeding.
              </p>
            </section>

            {/* 14. Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the State of Minnesota,
                United States, without regard to conflict of law principles. Any legal action not subject to
                arbitration shall be brought in the state or federal courts located in Hennepin County, Minnesota.
              </p>
            </section>

            {/* 15. API Usage */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. API Usage</h2>
              <p>If you use our API:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>API access is subject to rate limits based on your subscription plan.</li>
                <li>You must keep API keys confidential and not share them publicly.</li>
                <li>Excessive or abusive API usage may result in throttling or suspension.</li>
                <li>We may modify API endpoints with reasonable notice.</li>
              </ul>
            </section>

            {/* 16. Modifications */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Modifications to Terms</h2>
              <p>
                We may update these Terms at any time. Material changes will be communicated via email or
                in-app notification at least 30 days before taking effect. Your continued use of the Service
                after the effective date constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* 17. Severability */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">17. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions
                will continue in full force and effect.
              </p>
            </section>

            {/* 18. Entire Agreement */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">18. Entire Agreement</h2>
              <p>
                These Terms, together with the Privacy Policy and any other agreements referenced herein,
                constitute the entire agreement between you and Mtsryde Holdings LLC regarding the Service.
              </p>
            </section>

            {/* 19. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">19. Contact Information</h2>
              <p>For questions or concerns about these Terms:</p>
              <div className="mt-3 bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Mtsryde Holdings LLC (CallMaker24)</p>
                <ul className="mt-2 space-y-1">
                  <li>Email: <a href="mailto:support@callmaker24.com" className="text-blue-600 hover:underline">support@callmaker24.com</a></li>
                  <li>Phone: <a href="tel:+16125408684" className="text-blue-600 hover:underline">612-540-8684</a></li>
                  <li>Website: <a href="https://callmaker24.com" className="text-blue-600 hover:underline">callmaker24.com</a></li>
                </ul>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Mtsryde Holdings LLC. All rights reserved.</p>
          <nav className="flex gap-6 mt-4 sm:mt-0">
            <Link href="/legal/privacy" className="hover:text-gray-700">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-gray-700">Terms of Service</Link>
            <Link href="/data-deletion" className="hover:text-gray-700">Data Deletion</Link>
            <Link href="/support" className="hover:text-gray-700">Support</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
