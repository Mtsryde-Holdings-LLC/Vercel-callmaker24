import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CallMaker24",
  description:
    "CallMaker24 Privacy Policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            CallMaker24
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/legal/terms"
              className="text-gray-600 hover:text-gray-900"
            >
              Terms of Service
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-gray-900">
              Support
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last Updated: February 18, 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
            {/* Introduction */}
            <section>
              <p>
                CallMaker24 (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
                &ldquo;our&rdquo;), operated by Mtsryde Holdings LLC, is
                committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our platform at{" "}
                <a
                  href="https://callmaker24.com"
                  className="text-blue-600 hover:underline"
                >
                  callmaker24.com
                </a>{" "}
                (the &ldquo;Service&rdquo;), including our web application,
                APIs, integrations, and any related services.
              </p>
              <p className="mt-3">
                By accessing or using the Service, you agree to the collection
                and use of information in accordance with this Privacy Policy.
                If you do not agree, please do not use the Service.
              </p>
            </section>

            {/* 1. Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Information We Collect
              </h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                1.1 Information You Provide
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Account Information:</strong> Name, email address,
                  phone number, company name, and password when you register.
                </li>
                <li>
                  <strong>Billing Information:</strong> Payment card details
                  processed securely through Stripe or Shopify Billing. We do
                  not store full card numbers.
                </li>
                <li>
                  <strong>Business Data:</strong> Customer contact lists,
                  campaign content, templates, and communications you create
                  within the platform.
                </li>
                <li>
                  <strong>Support Requests:</strong> Information you provide
                  when contacting our support team.
                </li>
                <li>
                  <strong>Shopify Store Data:</strong> If you connect a Shopify
                  store, we access customer data, order history, and product
                  information as authorized by your Shopify permissions.
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                1.2 Information Collected Automatically
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Usage Data:</strong> Pages visited, features used,
                  clicks, session duration, and interaction patterns.
                </li>
                <li>
                  <strong>Device Information:</strong> Browser type, operating
                  system, device identifiers, and screen resolution.
                </li>
                <li>
                  <strong>Log Data:</strong> IP address, access times, referring
                  URLs, and error logs.
                </li>
                <li>
                  <strong>Cookies &amp; Tracking:</strong> We use cookies, local
                  storage, and similar technologies to maintain sessions and
                  improve the user experience (see Section 8).
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                1.3 Information from Third Parties
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>OAuth Providers:</strong> If you sign in via Google or
                  Facebook, we receive your name, email, and profile picture
                  from those services.
                </li>
                <li>
                  <strong>Shopify:</strong> Customer records, orders, and
                  product data from your connected Shopify store.
                </li>
                <li>
                  <strong>Twilio:</strong> Call and SMS delivery status,
                  duration, and metadata.
                </li>
              </ul>
            </section>

            {/* 2. How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  Provide, maintain, and improve the Service, including email
                  campaigns, SMS messaging, IVR call center, AI chatbot, social
                  media management, and loyalty programs.
                </li>
                <li>
                  Process subscriptions and billing through Stripe or Shopify
                  Billing API.
                </li>
                <li>
                  Send transactional communications (account verification,
                  password resets, billing receipts).
                </li>
                <li>
                  Send marketing communications where you have opted in (see
                  Section 3).
                </li>
                <li>Provide customer support and respond to inquiries.</li>
                <li>
                  Detect, prevent, and address fraud, abuse, and security
                  issues.
                </li>
                <li>
                  Analyze usage trends to improve our platform and develop new
                  features.
                </li>
                <li>
                  Comply with legal obligations and enforce our Terms of
                  Service.
                </li>
              </ul>
            </section>

            {/* 3. SMS & Marketing Communications */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. SMS &amp; Marketing Communications
              </h2>
              <p>By using CallMaker24, you may consent to receive:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  Marketing text messages and SMS communications from
                  CallMaker24.
                </li>
                <li>Service updates and operational notifications.</li>
                <li>Promotional offers and campaign-related messages.</li>
              </ul>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="font-semibold text-amber-900 mb-2">
                  Important SMS Information:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-amber-800">
                  <li>
                    Message frequency varies based on your activity and account
                    settings.
                  </li>
                  <li>
                    Message and data rates may apply from your wireless carrier.
                  </li>
                  <li>
                    Reply <strong>STOP</strong> to any message to unsubscribe
                    from SMS communications.
                  </li>
                  <li>
                    Reply <strong>HELP</strong> for customer support
                    information.
                  </li>
                  <li>
                    Carriers are not liable for delayed or undelivered messages.
                  </li>
                  <li>
                    We comply with the Telephone Consumer Protection Act (TCPA)
                    and all applicable regulations.
                  </li>
                </ul>
              </div>
            </section>

            {/* 4. Information Sharing & Disclosure */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Information Sharing &amp; Disclosure
              </h2>
              <p>
                <strong>We do not sell your personal information.</strong> We
                may share data in the following circumstances:
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                4.1 Service Providers
              </h3>
              <p>
                We share data with trusted third-party service providers who
                help us operate the platform:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  <strong>Stripe</strong> &mdash; Payment processing and
                  subscription billing.
                </li>
                <li>
                  <strong>Shopify</strong> &mdash; E-commerce integration and
                  billing for Shopify App Store merchants.
                </li>
                <li>
                  <strong>Twilio</strong> &mdash; SMS messaging, voice calls,
                  and IVR services.
                </li>
                <li>
                  <strong>OpenAI</strong> &mdash; AI chatbot and content
                  generation features.
                </li>
                <li>
                  <strong>Mailgun / SendGrid</strong> &mdash; Email delivery
                  services.
                </li>
                <li>
                  <strong>Vercel</strong> &mdash; Application hosting and CDN.
                </li>
                <li>
                  <strong>Sentry</strong> &mdash; Error monitoring and
                  performance tracking.
                </li>
                <li>
                  <strong>Amazon Web Services (AWS)</strong> &mdash; Cloud
                  infrastructure and AWS Connect call center.
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                4.2 Legal Requirements
              </h3>
              <p>
                We may disclose information if required by law, regulation,
                legal process, or governmental request.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                4.3 Business Transfers
              </h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your
                information may be transferred as part of that transaction.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                4.4 With Your Consent
              </h3>
              <p>
                We may share your information for other purposes with your
                explicit consent.
              </p>
            </section>

            {/* 5. Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Data Security
              </h2>
              <p>
                We implement industry-standard security measures to protect your
                information:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>All data transmitted via HTTPS/TLS encryption.</li>
                <li>
                  Passwords hashed with bcrypt (never stored in plaintext).
                </li>
                <li>
                  Multi-factor authentication (MFA) available for all accounts.
                </li>
                <li>
                  Database encryption at rest and role-based access controls.
                </li>
                <li>
                  API keys and credentials stored in encrypted environment
                  variables.
                </li>
                <li>Rate limiting to prevent brute-force and abuse attacks.</li>
                <li>Regular security audits and vulnerability assessments.</li>
                <li>
                  Webhook signature verification for all third-party
                  integrations.
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-500">
                While we strive to protect your data, no method of electronic
                transmission or storage is 100% secure. We cannot guarantee
                absolute security.
              </p>
            </section>

            {/* 6. Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Data Retention
              </h2>
              <p>
                We retain your personal information for as long as your account
                is active or as needed to provide the Service. Specifically:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  <strong>Account Data:</strong> Retained while your account is
                  active. Deleted within 30 days of account deletion request.
                </li>
                <li>
                  <strong>Campaign Data:</strong> Retained for 12 months after
                  last activity for analytics purposes, then archived or
                  deleted.
                </li>
                <li>
                  <strong>Billing Records:</strong> Retained for 7 years as
                  required by tax and financial regulations.
                </li>
                <li>
                  <strong>Server Logs:</strong> Retained for 90 days for
                  security and debugging purposes.
                </li>
                <li>
                  <strong>Shopify Data:</strong> Deleted within 48 hours of app
                  uninstallation or disconnection of your Shopify store.
                </li>
              </ul>
            </section>

            {/* 7. Your Rights & Choices */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Your Rights &amp; Choices
              </h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                7.1 Access &amp; Portability
              </h3>
              <p>
                You can access and download your personal data from your account
                settings, or by contacting us at{" "}
                <a
                  href="mailto:privacy@callmaker24.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@callmaker24.com
                </a>
                .
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                7.2 Correction
              </h3>
              <p>
                You may update your personal information at any time through
                your account dashboard.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                7.3 Deletion
              </h3>
              <p>
                You may request deletion of your account and personal data by:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-1">
                <li>
                  Using the &ldquo;Delete Account&rdquo; option in Settings.
                </li>
                <li>
                  Emailing{" "}
                  <a
                    href="mailto:privacy@callmaker24.com"
                    className="text-blue-600 hover:underline"
                  >
                    privacy@callmaker24.com
                  </a>
                  .
                </li>
                <li>
                  Calling{" "}
                  <a
                    href="tel:+16125408684"
                    className="text-blue-600 hover:underline"
                  >
                    612-540-8684
                  </a>
                  .
                </li>
              </ul>
              <p className="mt-2">
                We will process deletion requests within 30 days. Some data may
                be retained as required by law.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                7.4 Opt-Out of Marketing
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>SMS:</strong> Reply STOP to any SMS message.
                </li>
                <li>
                  <strong>Email:</strong> Click the &ldquo;Unsubscribe&rdquo;
                  link in any marketing email.
                </li>
                <li>
                  <strong>Push Notifications:</strong> Disable in your browser
                  or device settings.
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                7.5 Do Not Track
              </h3>
              <p>
                We currently do not respond to &ldquo;Do Not Track&rdquo;
                browser signals. We honor opt-out requests made through the
                mechanisms described above.
              </p>
            </section>

            {/* 8. Cookies & Tracking Technologies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Cookies &amp; Tracking Technologies
              </h2>
              <p>We use the following types of cookies:</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold border-b">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b">
                        Purpose
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border-b">Essential</td>
                      <td className="px-4 py-2 border-b">
                        Authentication, security, session management
                      </td>
                      <td className="px-4 py-2 border-b">Session / 30 days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-b">Functional</td>
                      <td className="px-4 py-2 border-b">
                        User preferences, language, theme settings
                      </td>
                      <td className="px-4 py-2 border-b">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-b">Analytics</td>
                      <td className="px-4 py-2 border-b">
                        Usage patterns, feature adoption, performance
                      </td>
                      <td className="px-4 py-2 border-b">2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                You can manage cookie preferences through your browser settings.
                Disabling essential cookies may prevent certain features from
                working correctly.
              </p>
            </section>

            {/* 9. International Data Transfers */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                9. International Data Transfers
              </h2>
              <p>
                Your information may be transferred to and processed in
                countries other than your country of residence, including the
                United States, where our servers and service providers are
                located. We ensure appropriate safeguards are in place,
                including standard contractual clauses and compliance with
                applicable data protection laws.
              </p>
            </section>

            {/* 10. GDPR (EEA Users) */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                10. European Economic Area (GDPR)
              </h2>
              <p>
                If you are located in the European Economic Area, you have
                additional rights under the General Data Protection Regulation:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  <strong>Legal Basis:</strong> We process your data based on
                  consent, contract performance, legitimate interests, or legal
                  obligations.
                </li>
                <li>
                  <strong>Right to Object:</strong> You may object to processing
                  based on legitimate interests.
                </li>
                <li>
                  <strong>Right to Restrict:</strong> You may request
                  restriction of processing in certain circumstances.
                </li>
                <li>
                  <strong>Data Portability:</strong> You may request your data
                  in a structured, machine-readable format.
                </li>
                <li>
                  <strong>Right to Lodge a Complaint:</strong> You may file a
                  complaint with your local data protection authority.
                </li>
              </ul>
              <p className="mt-2">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@callmaker24.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@callmaker24.com
                </a>
                .
              </p>
            </section>

            {/* 11. CCPA (California Users) */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                11. California Privacy Rights (CCPA)
              </h2>
              <p>
                If you are a California resident, you have additional rights
                under the California Consumer Privacy Act:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  <strong>Right to Know:</strong> You may request disclosure of
                  the categories and specific pieces of personal information we
                  have collected.
                </li>
                <li>
                  <strong>Right to Delete:</strong> You may request deletion of
                  your personal information.
                </li>
                <li>
                  <strong>Right to Opt-Out of Sale:</strong> We do not sell
                  personal information. No opt-out is necessary.
                </li>
                <li>
                  <strong>Non-Discrimination:</strong> We will not discriminate
                  against you for exercising your CCPA rights.
                </li>
              </ul>
              <p className="mt-2">
                To submit a verifiable consumer request, email{" "}
                <a
                  href="mailto:privacy@callmaker24.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@callmaker24.com
                </a>{" "}
                or call{" "}
                <a
                  href="tel:+16125408684"
                  className="text-blue-600 hover:underline"
                >
                  612-540-8684
                </a>
                .
              </p>
            </section>

            {/* 12. Shopify App Users */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                12. Shopify App Users
              </h2>
              <p>If you install CallMaker24 through the Shopify App Store:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  We access your Shopify store data (customers, orders,
                  products) only with the permissions you grant during
                  installation.
                </li>
                <li>
                  Billing is handled through Shopify&apos;s Billing API. We do
                  not collect credit card information for Shopify merchants.
                </li>
                <li>
                  When you uninstall the app, we delete your Shopify store data
                  within 48 hours.
                </li>
                <li>
                  We comply with the{" "}
                  <a
                    href="https://shopify.dev/docs/apps/store/requirements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Shopify App Store requirements
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://www.shopify.com/legal/api-terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Shopify API Terms
                  </a>
                  .
                </li>
                <li>
                  Your data processing is also subject to the{" "}
                  <a
                    href="https://www.shopify.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Shopify Privacy Policy
                  </a>
                  .
                </li>
              </ul>
            </section>

            {/* 13. Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                13. Children&apos;s Privacy
              </h2>
              <p>
                The Service is not directed to individuals under the age of 18.
                We do not knowingly collect personal information from children.
                If we discover that we have collected information from a child
                under 18, we will promptly delete it. If you believe a child has
                provided us with personal information, please contact us at{" "}
                <a
                  href="mailto:privacy@callmaker24.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@callmaker24.com
                </a>
                .
              </p>
            </section>

            {/* 14. Changes to This Policy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                14. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of material changes by posting the new policy on this
                page and updating the &ldquo;Last Updated&rdquo; date. We may
                also notify you via email or in-app notification for significant
                changes. Your continued use of the Service after changes
                constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* 15. Contact Us */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                15. Contact Us
              </h2>
              <p>
                For questions, concerns, or requests regarding this Privacy
                Policy or your personal data:
              </p>
              <div className="mt-3 bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900">
                  Mtsryde Holdings LLC (CallMaker24)
                </p>
                <ul className="mt-2 space-y-1">
                  <li>
                    Email:{" "}
                    <a
                      href="mailto:privacy@callmaker24.com"
                      className="text-blue-600 hover:underline"
                    >
                      privacy@callmaker24.com
                    </a>
                  </li>
                  <li>
                    Support:{" "}
                    <a
                      href="mailto:support@callmaker24.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@callmaker24.com
                    </a>
                  </li>
                  <li>
                    Phone:{" "}
                    <a
                      href="tel:+16125408684"
                      className="text-blue-600 hover:underline"
                    >
                      612-540-8684
                    </a>
                  </li>
                  <li>
                    Website:{" "}
                    <a
                      href="https://callmaker24.com"
                      className="text-blue-600 hover:underline"
                    >
                      callmaker24.com
                    </a>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Mtsryde Holdings LLC. All rights
            reserved.
          </p>
          <nav className="flex gap-6 mt-4 sm:mt-0">
            <Link href="/legal/privacy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-gray-700">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="hover:text-gray-700">
              Data Deletion
            </Link>
            <Link href="/support" className="hover:text-gray-700">
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
