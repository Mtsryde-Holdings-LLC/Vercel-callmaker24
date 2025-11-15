'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  isAvailable: boolean;
}

export default function ConnectSocialAccountPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);

  const platforms: SocialPlatform[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600',
      description: 'Post to your Facebook page and reach your audience',
      isAvailable: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600',
      description: 'Share photos and stories with your followers',
      isAvailable: true,
    },
    {
      id: 'twitter',
      name: 'Twitter (X)',
      icon: '🐦',
      color: 'bg-black',
      description: 'Tweet and engage with your Twitter community',
      isAvailable: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700',
      description: 'Share professional content with your network',
      isAvailable: true,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: 'bg-gray-900',
      description: 'Create and share short-form videos',
      isAvailable: true,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      color: 'bg-red-600',
      description: 'Upload and manage your video content',
      isAvailable: true,
    },
  ];

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);

    try {
      // Get OAuth URL from backend
      const response = await fetch('/api/social/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        alert(`Failed to connect to ${platformId}. Please try again.`);
        setConnecting(null);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to initiate connection. Please try again.');
      setConnecting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connect Social Media Account</h1>
          <p className="text-gray-600 mt-1">Link your social media accounts to start posting</p>
        </div>
        <Link href="/dashboard/social" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">🔐</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Secure OAuth Connection</h3>
            <p className="text-sm text-blue-800">
              We use OAuth 2.0 for secure authentication. You'll be redirected to sign in with each platform. 
              We never store your passwords.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
          >
            <div className={`${platform.color} p-6 text-white`}>
              <div className="text-5xl mb-3">{platform.icon}</div>
              <h3 className="text-xl font-bold">{platform.name}</h3>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

              {platform.isAvailable ? (
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={connecting === platform.id}
                  className={`w-full ${platform.color} text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center space-x-2`}
                >
                  {connecting === platform.id ? (
                    <>
                      <span className="animate-spin">⚙️</span>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>🔗</span>
                      <span>Connect {platform.name}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start space-x-2">
            <span className="font-bold">1.</span>
            <span>Click "Connect" on your desired platform</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">2.</span>
            <span>Sign in to your social media account (you'll be redirected to their official login page)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">3.</span>
            <span>Authorize CallMaker24 to post on your behalf</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">4.</span>
            <span>You'll be redirected back and your account will be connected!</span>
          </li>
        </ol>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Some platforms require additional permissions or business accounts. 
            Make sure you have the necessary access before connecting.
          </p>
        </div>
      </div>
    </div>
  );
}
