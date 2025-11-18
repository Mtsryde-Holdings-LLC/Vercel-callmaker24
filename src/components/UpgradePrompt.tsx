'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RESTRICTED_FEATURES } from '@/lib/trial-limits'
import { useTheme } from '@/contexts/ThemeContext'

interface UpgradePromptProps {
  featureName: string
  daysRemaining?: number
  onClose?: () => void
}

export default function UpgradePrompt({ featureName, daysRemaining = 0, onClose }: UpgradePromptProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { primaryColor, secondaryColor } = useTheme()
  
  const feature = RESTRICTED_FEATURES.find(f => f.name === featureName)
  
  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }
  
  if (!isOpen || !feature) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 text-white relative"
          style={{
            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="text-6xl mb-3">{feature.icon}</div>
            <h2 className="text-3xl font-bold mb-2">Unlock {feature.name}</h2>
            <p className="text-primary-100 text-lg">
              This premium feature is available on paid plans
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Trial Info */}
          {daysRemaining > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <span className="font-semibold">
                  {daysRemaining} days remaining in your free trial
                </span>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              What you'll get:
            </h3>
            <p className="text-gray-600 mb-4">{feature.description}</p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Available in these plans:
              </div>
              <div className="flex flex-wrap gap-2">
                {feature.availableIn.map((tier) => (
                  <span
                    key={tier}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor
                    }}
                  >
                    {tier.charAt(0) + tier.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* More Features */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 uppercase mb-3">
              Plus get access to:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {RESTRICTED_FEATURES.slice(0, 6).map((f) => (
                <div key={f.name} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pricing Highlight */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Plans starting at</div>
              <div className="text-3xl font-bold text-gray-900">$49.99<span className="text-lg text-gray-600">/mo</span></div>
              <div className="text-sm text-green-700 font-semibold mt-1">
                Save 15% with annual billing
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/settings/billing"
              className="flex-1 text-white text-center px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-md"
              style={{backgroundColor: primaryColor}}
            >
              Upgrade Now
            </Link>
            <button
              onClick={handleClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Maybe Later
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link
              href="/pricing"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Compare all plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
