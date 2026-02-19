import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support & Documentation | CallMaker24",
  description:
    "Get help with CallMaker24 — documentation, guides, FAQ, and contact support.",
};

const features = [
  {
    title: "Email Campaigns",
    description:
      "Create and send professional email campaigns with drag-and-drop templates, scheduling, and analytics.",
    icon: "✉️",
    docs: [
      "Create a new campaign from Dashboard → Campaigns → New Campaign.",
      "Choose from pre-built templates or design your own.",
      "Import contacts from CSV, Shopify, or enter manually.",
      "Schedule sends or send immediately.",
      "Track opens, clicks, and engagement in real-time.",
    ],
  },
  {
    title: "SMS Messaging",
    description:
      "Send text message campaigns with opt-in/opt-out management and TCPA compliance.",
    icon: "💬",
    docs: [
      "Configure your Twilio number in Settings → Integrations → Twilio.",
      "Create SMS campaigns from Dashboard → SMS → New Campaign.",
      "Contacts can opt out by replying STOP at any time.",
      "Message delivery status is tracked automatically.",
      "Rate limiting protects against over-sending.",
    ],
  },
  {
    title: "IVR Call Center",
    description:
      "Automated phone system with call routing, recording, and analytics powered by AWS Connect.",
    icon: "📞",
    docs: [
      "Set up your IVR flow in Dashboard → Call Center.",
      "Configure greeting messages, menu options, and routing.",
      "View call logs, recordings, and analytics.",
      "Route calls to different queues based on input.",
      "Integrates with AWS Connect for enterprise-grade reliability.",
    ],
  },
  {
    title: "AI Chatbot",
    description:
      "AI-powered chatbot for your website that handles customer inquiries 24/7.",
    icon: "🤖",
    docs: [
      "Enable the chatbot from Dashboard → Chatbot → Settings.",
      "Customize appearance, greeting, and behavior.",
      "Train with your business FAQ and knowledge base.",
      "Embed on your website with a simple script tag.",
      "Review conversation logs and improve responses over time.",
    ],
  },
  {
    title: "Social Media",
    description:
      "Manage Facebook and Instagram posts, scheduling, and engagement from one dashboard.",
    icon: "📱",
    docs: [
      "Connect your Facebook page in Settings → Integrations → Facebook.",
      "Create and schedule posts from Dashboard → Social Media.",
      "View engagement metrics and audience insights.",
      "Respond to comments and messages.",
      "Cross-post to multiple platforms simultaneously.",
    ],
  },
  {
    title: "Loyalty & Rewards",
    description:
      "Customer loyalty program with points, tiers, and automated reward notifications.",
    icon: "⭐",
    docs: [
      "Set up your loyalty program in Dashboard → Loyalty.",
      "Configure point values, tiers, and redemption rules.",
      "Customers earn points on purchases automatically (via Shopify sync).",
      "Send SMS/email notifications for reward milestones.",
      "View customer loyalty dashboards and analytics.",
    ],
  },
  {
    title: "Shopify Integration",
    description:
      "Sync your Shopify store customers, orders, and products automatically.",
    icon: "🛍️",
    docs: [
      "Install CallMaker24 from the Shopify App Store or connect manually.",
      "Grant required permissions during installation.",
      "Customer and order data syncs automatically.",
      "Use Shopify data to power targeted campaigns.",
      "Billing is handled through Shopify for App Store installs.",
    ],
  },
  {
    title: "CRM & Contacts",
    description:
      "Manage customer relationships, segments, and communication history.",
    icon: "👥",
    docs: [
      "Import contacts via CSV upload or Shopify sync.",
      "Create segments based on purchase history, engagement, or custom fields.",
      "View full communication history per contact.",
      "Add notes, tags, and custom attributes.",
      "Export contacts at any time.",
    ],
  },
];

const faqs = [
  {
    q: "How do I get started with CallMaker24?",
    a: "Sign up for a free account, complete the onboarding wizard, and start with a 30-day free trial of all premium features. No credit card required.",
  },
  {
    q: "What subscription plans are available?",
    a: "We offer Starter ($49.99/mo), Elite ($79.99/mo), Pro ($129.99/mo), and Enterprise ($499.99/mo) plans. Annual billing saves 15%. All plans include a 30-day free trial.",
  },
  {
    q: "How do I connect my Shopify store?",
    a: 'Go to Settings → Integrations → Shopify and click "Connect Store," or install CallMaker24 directly from the Shopify App Store. Follow the authorization prompts to grant access.',
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: 'Yes. Go to Dashboard → Subscription and click "Cancel Plan." You\'ll retain access until the end of your billing period. For Shopify merchants, uninstalling the app cancels your subscription.',
  },
  {
    q: "How do I send my first SMS campaign?",
    a: "First, configure Twilio in Settings → Integrations. Then go to Dashboard → SMS → New Campaign, select your audience, compose your message, and send.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use HTTPS encryption, bcrypt password hashing, MFA support, database encryption at rest, and regular security audits. See our Privacy Policy for details.",
  },
  {
    q: "How do I delete my account and data?",
    a: "Go to Settings → Account → Delete Account, or email privacy@callmaker24.com. We process deletion requests within 30 days. See our Data Deletion page for more details.",
  },
  {
    q: "Do you support GDPR and CCPA compliance?",
    a: "Yes. We provide data access, portability, and deletion tools. See Sections 10 and 11 of our Privacy Policy for full details on your rights.",
  },
  {
    q: "What happens when I uninstall the Shopify app?",
    a: "Your subscription is automatically cancelled, your account is downgraded to the free tier, and your Shopify store data is deleted within 48 hours.",
  },
  {
    q: "How do I set up the AI chatbot on my website?",
    a: "Enable the chatbot in Dashboard → Chatbot, customize its appearance and training data, then copy the embed script and paste it into your website's HTML before the closing </body> tag.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            CallMaker24
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/legal/privacy"
              className="text-gray-600 hover:text-gray-900"
            >
              Privacy
            </Link>
            <Link
              href="/legal/terms"
              className="text-gray-600 hover:text-gray-900"
            >
              Terms
            </Link>
            <Link
              href="/auth/signin"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Support &amp; Documentation
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Everything you need to get the most out of CallMaker24. Guides,
            documentation, and answers to common questions.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Support */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Contact Support
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-blue-50">
                <div className="text-3xl mb-3">📧</div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a
                  href="mailto:support@callmaker24.com"
                  className="text-blue-600 hover:underline"
                >
                  support@callmaker24.com
                </a>
                <p className="text-sm text-gray-500 mt-1">
                  Response within 24 hours
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-green-50">
                <div className="text-3xl mb-3">📞</div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <a
                  href="tel:+16125408684"
                  className="text-blue-600 hover:underline"
                >
                  612-540-8684
                </a>
                <p className="text-sm text-gray-500 mt-1">
                  Mon–Fri, 9 AM – 5 PM CT
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-purple-50">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                <p className="text-gray-700">Available in your dashboard</p>
                <p className="text-sm text-gray-500 mt-1">
                  AI-powered + human escalation
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Start Guide
          </h2>
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Create Your Account
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Sign up at{" "}
                    <a
                      href="https://callmaker24.com"
                      className="text-blue-600 hover:underline"
                    >
                      callmaker24.com
                    </a>{" "}
                    with your email, Google, or Facebook account. Complete the
                    onboarding wizard to set up your organization.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Configure Integrations
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Connect Twilio for SMS/calls, Shopify for e-commerce, and
                    your email provider in Settings → Integrations. Each
                    integration has a guided setup flow.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Import Your Contacts
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Upload a CSV file, sync from Shopify, or add contacts
                    manually. Create segments to target the right audience for
                    each campaign.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Launch Your First Campaign
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Navigate to Campaigns, choose email or SMS, select your
                    audience, compose your message using templates, and send or
                    schedule.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  5
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">Track Results</h3>
                  <p className="text-gray-600 mt-1">
                    Monitor delivery rates, opens, clicks, and conversions from
                    your Dashboard. Use insights to optimize future campaigns.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Feature Documentation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Feature Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.docs.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription Plans Summary */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Subscription Plans
          </h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900 border-b">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b">
                      Starter
                      <br />
                      <span className="font-normal text-gray-500">
                        $49.99/mo
                      </span>
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-600 border-b">
                      Elite
                      <br />
                      <span className="font-normal text-blue-500">
                        $79.99/mo
                      </span>
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b">
                      Pro
                      <br />
                      <span className="font-normal text-gray-500">
                        $129.99/mo
                      </span>
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900 border-b">
                      Enterprise
                      <br />
                      <span className="font-normal text-gray-500">
                        $499.99/mo
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-6 py-3">Email Campaigns</td>
                    <td className="px-6 py-3 text-center">2,500/mo</td>
                    <td className="px-6 py-3 text-center">10,000/mo</td>
                    <td className="px-6 py-3 text-center">50,000/mo</td>
                    <td className="px-6 py-3 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">SMS Messages</td>
                    <td className="px-6 py-3 text-center">500/mo</td>
                    <td className="px-6 py-3 text-center">2,000/mo</td>
                    <td className="px-6 py-3 text-center">10,000/mo</td>
                    <td className="px-6 py-3 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">AI Chatbot</td>
                    <td className="px-6 py-3 text-center">Basic</td>
                    <td className="px-6 py-3 text-center">Advanced</td>
                    <td className="px-6 py-3 text-center">Advanced</td>
                    <td className="px-6 py-3 text-center">Custom</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">IVR / Call Center</td>
                    <td className="px-6 py-3 text-center">—</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">Social Media</td>
                    <td className="px-6 py-3 text-center">1 account</td>
                    <td className="px-6 py-3 text-center">3 accounts</td>
                    <td className="px-6 py-3 text-center">10 accounts</td>
                    <td className="px-6 py-3 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">Loyalty Program</td>
                    <td className="px-6 py-3 text-center">—</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">Shopify Integration</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">API Access</td>
                    <td className="px-6 py-3 text-center">—</td>
                    <td className="px-6 py-3 text-center">—</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">Priority Support</td>
                    <td className="px-6 py-3 text-center">—</td>
                    <td className="px-6 py-3 text-center">—</td>
                    <td className="px-6 py-3 text-center">✓</td>
                    <td className="px-6 py-3 text-center">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">Annual Discount</td>
                    <td className="px-6 py-3 text-center">15%</td>
                    <td className="px-6 py-3 text-center">15%</td>
                    <td className="px-6 py-3 text-center">15%</td>
                    <td className="px-6 py-3 text-center">15%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t text-center">
              <p className="text-sm text-gray-600">
                All plans include a <strong>30-day free trial</strong>.{" "}
                <Link
                  href="/dashboard/subscription"
                  className="text-blue-600 hover:underline"
                >
                  View full plan details →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/legal/privacy"
              className="bg-white rounded-xl shadow-sm border p-6 hover:border-blue-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                Privacy Policy
              </h3>
              <p className="text-sm text-gray-500">How we protect your data</p>
            </Link>
            <Link
              href="/legal/terms"
              className="bg-white rounded-xl shadow-sm border p-6 hover:border-blue-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                Terms of Service
              </h3>
              <p className="text-sm text-gray-500">
                Usage agreement and billing
              </p>
            </Link>
            <Link
              href="/data-deletion"
              className="bg-white rounded-xl shadow-sm border p-6 hover:border-blue-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                Data Deletion
              </h3>
              <p className="text-sm text-gray-500">Request data removal</p>
            </Link>
            <a
              href="mailto:support@callmaker24.com"
              className="bg-white rounded-xl shadow-sm border p-6 hover:border-blue-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Contact Us</h3>
              <p className="text-sm text-gray-500">support@callmaker24.com</p>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
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
