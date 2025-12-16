import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Callmaker24",
  description: "Pricing plans for Callmaker24 Shopify App",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "month",
    annualPrice: null,
    annualSavings: null,
    description: "No credit card required",
    features: [
      "Up to 100 contacts",
      "500 emails/month",
      "50 SMS/month",
      "Basic templates",
      "Email support",
    ],
    cta: "Get Started Free",
    highlighted: false,
    badge: null,
  },
  {
    name: "Starter",
    price: "$79",
    period: "month",
    annualPrice: "$67",
    annualSavings: "Save 15% with annual",
    description: "For growing businesses",
    features: [
      "Up to 2,500 contacts",
      "10,000 emails/month",
      "1,000 SMS/month",
      "Basic analytics",
      "30-day free trial",
      "Priority support",
    ],
    cta: "Get Started",
    highlighted: false,
    badge: null,
  },
  {
    name: "Professional",
    price: "$199",
    period: "month",
    annualPrice: "$169",
    annualSavings: "Save 15% with annual",
    description: "For scaling businesses",
    features: [
      "Up to 25,000 contacts",
      "100,000 emails/month",
      "10,000 SMS/month",
      "Advanced analytics & reporting",
      "Social media scheduling",
      "AI-powered chatbot",
      "30-day free trial",
    ],
    cta: "Get Started",
    highlighted: true,
    badge: "Free $499 setup on annual",
  },
  {
    name: "Enterprise",
    price: "$499",
    period: "month",
    annualPrice: null,
    annualSavings: null,
    description: "For large organizations",
    features: [
      "Unlimited contacts",
      "Unlimited emails",
      "Unlimited SMS",
      "Everything in Professional",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "24/7 premium support",
    ],
    cta: "Contact Sales",
    highlighted: false,
    badge: null,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Callmaker24</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your business. Paid plans include a 30-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl shadow-sm border ${
                plan.highlighted
                  ? "border-indigo-500 ring-2 ring-indigo-500"
                  : "border-gray-200"
              } p-6 relative`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 ml-1">/{plan.period}</span>
                </div>
                {plan.annualSavings && (
                  <p className="text-green-600 text-sm font-medium mb-1">
                    {plan.annualSavings}: {plan.annualPrice}/mo
                  </p>
                )}
                {plan.badge && (
                  <p className="text-indigo-600 text-sm font-medium mb-1">
                    {plan.badge}
                  </p>
                )}
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate your billing accordingly.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens after my free trial?
              </h3>
              <p className="text-gray-600">
                After your 30-day free trial, you&apos;ll be charged for the plan you selected. You can cancel anytime before the trial ends with no charges.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee. If you&apos;re not satisfied with Callmaker24, contact us for a full refund.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards through Shopify&apos;s billing system. Enterprise customers can also pay via invoice.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use industry-standard encryption and security practices. All data is encrypted in transit and at rest. View our{" "}
                <a href="/privacy" className="text-indigo-600 hover:text-indigo-800">
                  Privacy Policy
                </a>{" "}
                for more details.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I import my existing customers?
              </h3>
              <p className="text-gray-600">
                Yes! Callmaker24 automatically syncs all your existing Shopify customers when you install the app. No manual import required.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-gray-600 mb-6">
            Our team is here to help you find the perfect plan for your business.
          </p>
          <a
            href="mailto:sales@callmaker24.com"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Callmaker24 by Mtsryde Holdings LLC. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
