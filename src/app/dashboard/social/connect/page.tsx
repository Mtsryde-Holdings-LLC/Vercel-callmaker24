'use client'

import Link from 'next/link'

export default function ConnectSocialPage() {
  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600', url: '/api/social/connect/facebook' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-600', url: '/api/social/connect/instagram' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-500', url: '/api/social/connect/twitter' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', url: '/api/social/connect/linkedin' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black', url: '/api/social/connect/tiktok' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connect Social Account</h1>
          <p className="text-gray-600 mt-1">Link your social media accounts to start posting</p>
        </div>
        <Link href="/dashboard/social" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map(platform => (
          <a
            key={platform.id}
            href={platform.url}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition text-center"
          >
            <div className="text-6xl mb-4">{platform.icon}</div>
            <h3 className="text-xl font-bold mb-2">{platform.name}</h3>
            <button className={`${platform.color} text-white px-6 py-3 rounded-lg hover:opacity-90 transition w-full`}>
              Connect {platform.name}
            </button>
          </a>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">🔒 Secure OAuth Connection</h3>
        <p className="text-blue-800 text-sm">
          We use official OAuth authentication. Your credentials are never stored. You can revoke access anytime from your social media settings.
        </p>
      </div>
    </div>
  )
}
