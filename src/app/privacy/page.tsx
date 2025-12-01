export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly, including name, email, phone number, and business information when you create an account or use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. SMS and Marketing Communications</h2>
            <p className="mb-2">By using CallMaker24, you consent to receive:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Marketing text messages and SMS communications from CallMaker24</li>
              <li>Service updates and notifications</li>
              <li>Promotional offers and campaigns</li>
            </ul>
            <p className="mt-3 font-semibold">Important SMS Information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Message frequency varies based on your activity</li>
              <li>Message and data rates may apply from your carrier</li>
              <li>Reply STOP to any message to unsubscribe from SMS communications</li>
              <li>Reply HELP for customer support</li>
              <li>Carriers are not liable for delayed or undelivered messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>We use your information to provide services, send marketing communications, improve our platform, and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing</h2>
            <p>We do not sell your personal information. We may share data with service providers (Twilio, Stripe, OpenAI) necessary to operate our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information, including encryption and secure data storage.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information. You may opt-out of marketing communications at any time by replying STOP to SMS messages or using unsubscribe links in emails.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to improve user experience and analyze platform usage.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <p className="mt-2">
              <strong>CallMaker24</strong><br />
              Phone: <a href="tel:+16125408684" className="text-blue-600 hover:underline">612-540-8684</a><br />
              Email: privacy@callmaker24.com<br />
              Support: support@callmaker24.com
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
