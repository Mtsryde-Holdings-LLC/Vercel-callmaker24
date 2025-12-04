export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Deletion Instructions</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Request Data Deletion</h2>
            <p>If you want to delete your data from CallMaker24, you can do so by following these steps:</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Option 1: Delete from Dashboard</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Log in to your CallMaker24 account</li>
              <li>Go to Settings → Account</li>
              <li>Click "Delete Account"</li>
              <li>Confirm deletion</li>
            </ol>
            <p className="mt-2 text-sm text-gray-600">This will permanently delete all your data including contacts, campaigns, and account information.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Option 2: Contact Support</h3>
            <p>Send a data deletion request to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Email: <a href="mailto:privacy@callmaker24.com" className="text-blue-600 hover:underline">privacy@callmaker24.com</a></li>
              <li>Phone: <a href="tel:+16125408684" className="text-blue-600 hover:underline">612-540-8684</a></li>
            </ul>
            <p className="mt-2">Include your account email and we'll process your request within 30 days.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What Gets Deleted</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your account and profile information</li>
              <li>All customer contacts and data</li>
              <li>Email and SMS campaign history</li>
              <li>Social media connections and posts</li>
              <li>Analytics and reports</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Retention</h3>
            <p>Some data may be retained for legal or business purposes:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Transaction records (7 years for tax purposes)</li>
              <li>Legal compliance data</li>
              <li>Anonymized analytics data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Facebook Data Deletion</h2>
            <p>If you connected your Facebook account and want to delete data shared with CallMaker24:</p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>Go to your Facebook Settings → Apps and Websites</li>
              <li>Find CallMaker24 and click Remove</li>
              <li>Or contact us at <a href="mailto:privacy@callmaker24.com" className="text-blue-600 hover:underline">privacy@callmaker24.com</a></li>
            </ol>
          </section>

          <section className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              For questions about data deletion, contact us at{' '}
              <a href="tel:+16125408684" className="text-blue-600 hover:underline">612-540-8684</a>
              {' '}or{' '}
              <a href="mailto:privacy@callmaker24.com" className="text-blue-600 hover:underline">privacy@callmaker24.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
