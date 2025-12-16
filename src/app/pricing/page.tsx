"use client";

import { useState } from "react";

const plans = [
  {
    name: "30-Day Free Trial",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Limited access - Upgrade for more",
    features: [
      "No credit card required",
      "Limited features for 30 days",
      "Upgrade anytime for full access",
    ],
    cta: "Start Free Trial",
    highlighted: false,
    isTrial: true,
  },
  {
    name: "Starter",
    monthlyPrice: 49.99,
    annualPrice: 42.49,
    description: "Perfect for small businesses getting started",
    features: [
      "1 agent",
      "500 customers",
      "5,000 emails/mo",
      "1,000 SMS/mo",
    ],
    cta: "Get Started",
    highlighted: false,
    isTrial: false,
  },
  {
    name: "Elite",
    monthlyPrice: 79.99,
    annualPrice: 67.99,
    description: "For growing teams who need more power",
    features: [
      "3 agents",
      "2,000 customers",
      "15,000 emails/mo",
      "5,000 SMS/mo",
      "AI content generation",
    ],
    cta: "Get Started",
    highlighted: true,
    isTrial: false,
  },
  {
    name: "Professional",
    monthlyPrice: 129.99,
    annualPrice: 110.49,
    description: "Advanced features for professional teams",
    features: [
      "5 agents",
      "10,000 customers",
      "50,000 emails/mo",
      "20,000 SMS/mo",
      "AI content generation",
      "Priority support",
    ],
    cta: "Get Started",
    highlighted: false,
    isTrial: false,
  },
  {
    name: "Enterprise",
    monthlyPrice: 499.99,
    annualPrice: 424.99,
    description: "Unlimited power for large organizations",
    features: [
      "Unlimited agents",
      "Unlimited customers",
      "Unlimited emails/mo",
      "Unlimited SMS/mo",
      "AI content generation",
      "White glove service",
      "Priority support",
    ],
    cta: "Contact Sales",
    highlighted: false,
    isTrial: false,
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select a plan to get started with CallMaker24
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                !isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl shadow-sm border ${
                plan.highlighted
                  ? "border-indigo-500 ring-2 ring-indigo-500"
                  : "border-gray-200"
              } p-6 relative flex flex-col`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.isTrial ? "0" : isAnnual ? plan.annualPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                  </span>
                  <span className="text-gray-500 ml-1">/mo</span>
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-6 flex-grow">
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
                className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : plan.isTrial
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center text-gray-600">
          <p className="mb-2">Select a plan to continue</p>
          <p>
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Sign in
            </a>
          </p>
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
