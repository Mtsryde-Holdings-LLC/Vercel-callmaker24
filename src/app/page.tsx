import Link from 'next/link'
import { ArrowRightIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, PhoneIcon, ChartBarIcon, UserGroupIcon, ShareIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-heading font-bold text-primary-600">
              CallMaker24
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-primary-600 transition">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-primary-600 transition">
                Pricing
              </Link>
              <Link href="/auth/signin" className="text-gray-600 hover:text-primary-600 transition">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition shadow-md hover:shadow-glow"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6 animate-fade-in">
            All-in-One Marketing
            <span className="text-primary-600"> Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-slide-up">
            Email campaigns, SMS marketing, AI-powered chatbot, and IVR system—all in one place.
            Grow your business with intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              href="/auth/signup"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition shadow-lg hover:shadow-glow inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/demo"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition shadow-lg border-2 border-primary-600 inline-flex items-center justify-center"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-white rounded-3xl shadow-xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed to help you engage customers and grow revenue
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<EnvelopeIcon className="h-12 w-12" />}
            title="Email Marketing"
            description="Create beautiful email campaigns with AI-powered copy generation and A/B testing"
          />
          <FeatureCard
            icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
            title="SMS Campaigns"
            description="Reach customers instantly with targeted SMS messages and two-way messaging"
          />
          <FeatureCard
            icon={<ShareIcon className="h-12 w-12" />}
            title="Social Media Management"
            description="Schedule and publish posts across Facebook, Instagram, Twitter, LinkedIn, and TikTok with unified analytics"
          />
          <FeatureCard
            icon={<UserGroupIcon className="h-12 w-12" />}
            title="Customer CRM"
            description="Manage contacts, segment audiences, track interactions, and build lasting customer relationships"
          />
          <FeatureCard
            icon={<PhoneIcon className="h-12 w-12" />}
            title="IVR & Voice"
            description="Professional call routing, recording, and AI-powered chatbot with live agent handoff"
          />
          <FeatureCard
            icon={<ChartBarIcon className="h-12 w-12" />}
            title="Analytics & Reporting"
            description="Comprehensive dashboards and insights across all channels to optimize your campaigns"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="p-8 rounded-2xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-xl transition">
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">Starter</h3>
            <div className="mb-2">
              <span className="text-4xl font-bold text-gray-900">$49</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-sm text-green-600 font-semibold mb-6">30 days free trial</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Up to 1,000 contacts</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">5,000 emails/month</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">500 SMS/month</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Basic analytics</span>
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="block w-full text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Professional Plan */}
          <div className="p-8 rounded-2xl border-2 border-primary-500 hover:border-primary-600 hover:shadow-2xl transition relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">Professional</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$149</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Up to 10,000 contacts</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">50,000 emails/month</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">5,000 SMS/month</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Social media scheduling</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">AI-powered insights</span>
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="block w-full text-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-semibold shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-8 rounded-2xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-xl transition">
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">Enterprise</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">Custom</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Unlimited contacts</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Unlimited emails & SMS</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Dedicated support</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">Custom integrations</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">White-label options</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">SLA guarantee</span>
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="block w-full text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl shadow-2xl p-12 md:p-16 text-center text-white">
          <h2 className="text-4xl font-heading font-bold mb-4">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses growing with our platform
          </p>
          <Link
            href="/auth/signup"
            className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition shadow-lg inline-flex items-center font-semibold"
          >
            Get Started Free
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 CallMaker24. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg transition group">
      <div className="text-primary-600 mb-4 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  )
}
