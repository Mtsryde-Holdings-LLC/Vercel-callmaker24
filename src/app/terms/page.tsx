export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using CallMaker24, you accept and agree to be bound by these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. SMS Marketing Consent</h2>
            <p className="mb-2">By using our service, you agree to receive marketing text messages and SMS communications from CallMaker24. Please note:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Message frequency may vary</li>
              <li>Message and data rates may apply</li>
              <li>Reply STOP to unsubscribe from SMS messages at any time</li>
              <li>Reply HELP for assistance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Service Description</h2>
            <p>CallMaker24 provides email marketing, SMS campaigns, social media management, AI-powered chatbot, IVR system, and CRM functionality.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Responsibilities</h2>
            <p>You agree to use the service in compliance with all applicable laws and regulations, including CAN-SPAM Act and TCPA requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payment Terms</h2>
            <p>Subscription fees are billed according to your selected plan. All fees are non-refundable except as required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Termination</h2>
            <p>We reserve the right to suspend or terminate your account for violation of these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact Information</h2>
            <p>For questions or concerns about these Terms of Service:</p>
            <p className="mt-2">
              <strong>CallMaker24</strong><br />
              Phone: <a href="tel:+16125408684" className="text-blue-600 hover:underline">612-540-8684</a><br />
              Email: support@callmaker24.com
            </p>
          </section>

          <section>
            <p className="text-sm text-gray-500 mt-8">Last Updated: {new Date().toLocaleDateString()}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
