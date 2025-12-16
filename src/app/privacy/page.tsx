import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Callmaker24",
  description: "Privacy Policy for Callmaker24 Shopify App",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Callmaker24</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: December 16, 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Callmaker24 (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Shopify application.
              </p>
              <p className="text-gray-600">
                By installing and using Callmaker24, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-600 mb-4">When you install Callmaker24, we collect the following information from your Shopify store:</p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Customer Data</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Customer names and contact information (email, phone)</li>
                <li>Customer addresses (shipping and billing)</li>
                <li>Purchase history and order count</li>
                <li>Total amount spent</li>
                <li>Marketing preferences (email/SMS opt-in status)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Order Data</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Order details (items, quantities, prices)</li>
                <li>Shipping and billing addresses</li>
                <li>Payment status and transaction information</li>
                <li>Fulfillment and tracking information</li>
                <li>Discount codes used</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Product Data</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Product titles and descriptions</li>
                <li>Pricing information</li>
                <li>Inventory levels</li>
                <li>Product categories and tags</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Customer Relationship Management:</strong> To help you manage and segment your customers</li>
                <li><strong>Marketing Automation:</strong> To enable targeted email and SMS marketing campaigns</li>
                <li><strong>Analytics:</strong> To provide insights into customer behavior and sales performance</li>
                <li><strong>Abandoned Cart Recovery:</strong> To help recover lost sales through automated follow-ups</li>
                <li><strong>Order Management:</strong> To track and display order information within the app</li>
                <li><strong>Service Improvement:</strong> To improve and optimize our application</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>All data is encrypted in transit using TLS/SSL</li>
                <li>Data is stored in secure, encrypted databases</li>
                <li>We use Shopify&apos;s HMAC verification for all webhook requests</li>
                <li>Access to data is restricted to authorized personnel only</li>
                <li>Regular security audits and updates are performed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-600 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share data only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our app (e.g., email delivery services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights (GDPR)</h2>
              <p className="text-gray-600 mb-4">
                If you are in the European Economic Area (EEA), you have certain data protection rights:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please contact us at privacy@callmaker24.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your data for as long as your Shopify app is installed and active. Upon uninstallation:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>We will delete your data within 48 hours of receiving the shop/redact webhook from Shopify</li>
                <li>You may request immediate data deletion by contacting us</li>
                <li>Some data may be retained for legal compliance purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-600">
                Our application may use cookies and similar tracking technologies to enhance user experience. These are used solely for functionality and do not track users across other websites.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-gray-600">
                Our service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal data, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600"><strong>Callmaker24</strong></p>
                <p className="text-gray-600">Mtsryde Holdings LLC</p>
                <p className="text-gray-600">Email: privacy@callmaker24.com</p>
                <p className="text-gray-600">Website: https://callmaker24.com</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Shopify&apos;s Role</h2>
              <p className="text-gray-600">
                Our app operates within the Shopify platform. Shopify has its own privacy practices which govern how they handle merchant and customer data. We encourage you to review Shopify&apos;s Privacy Policy at{" "}
                <a href="https://www.shopify.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                  https://www.shopify.com/legal/privacy
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Callmaker24 by Mtsryde Holdings LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
