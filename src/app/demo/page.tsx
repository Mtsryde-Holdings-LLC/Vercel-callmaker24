"use client";

import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <img
              src="https://image2url.com/images/1764870645442-014593f0-e852-49a2-8590-5f742b4ff9db.png"
              alt="CallMaker24"
              className="h-12"
            />
          </Link>
          <div className="flex gap-4">
            <Link
              href="/auth/signin"
              className="px-6 py-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Demo Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              See CallMaker24 in Action
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover how CallMaker24 transforms your customer engagement with
              AI-powered SMS, email, and call center solutions
            </p>
          </div>

          {/* Video Demo Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <div className="aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-center text-white">
                <svg
                  className="w-24 h-24 mx-auto mb-4 opacity-50"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <p className="text-lg">Demo Video Coming Soon</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Complete Platform Overview
            </h2>
            <p className="text-gray-600 mb-6">
              Watch our comprehensive demo to see how CallMaker24 streamlines
              your communication workflow, automates customer engagement, and
              drives measurable results.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Email Marketing
              </h3>
              <p className="text-gray-600">
                Create and send professional email campaigns with advanced
                templates and tracking
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                SMS Automation
              </h3>
              <p className="text-gray-600">
                Send personalized text messages at scale with AI-powered
                automation
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Call Center
              </h3>
              <p className="text-gray-600">
                Manage customer calls with AWS Connect integration and AI
                routing
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                AI Chatbots
              </h3>
              <p className="text-gray-600">
                Deploy intelligent chatbots for 24/7 customer support automation
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Shopify Integration
              </h3>
              <p className="text-gray-600">
                Sync customers and orders automatically from your Shopify store
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Analytics
              </h3>
              <p className="text-gray-600">
                Track performance with real-time dashboards and detailed reports
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Start your free trial today and see the results for yourself
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition shadow-lg font-semibold"
              >
                Start Free Trial
              </Link>
              <Link
                href="/auth/signin"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 CallMaker24. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <Link
              href="/legal/terms"
              className="text-gray-400 hover:text-white"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="text-gray-400 hover:text-white"
            >
              Privacy
            </Link>
            <a
              href="tel:+16125408684"
              className="text-gray-400 hover:text-white"
            >
              612-540-8684
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
