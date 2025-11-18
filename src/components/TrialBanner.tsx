'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getDaysRemainingInTrial } from '@/lib/trial-limits'
import { useTheme } from '@/contexts/ThemeContext'

interface TrialBannerProps {
  subscriptionStartDate: Date
  organizationName: string
}

export default function TrialBanner({ subscriptionStartDate, organizationName }: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { primaryColor } = useTheme()
  const daysRemaining = getDaysRemainingInTrial(subscriptionStartDate)
  
  if (!isVisible || daysRemaining <= 0) return null
  
  const isUrgent = daysRemaining <= 7
  
  return (
    <div className={`${
      isUrgent 
        ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
    } border-2 rounded-xl p-4 mb-6 relative`}>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </button>
      
      <div className="flex items-center gap-4 pr-8">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          isUrgent ? 'bg-orange-200' : 'bg-blue-200'
        }`}>
          <svg className={`w-6 h-6 ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${isUrgent ? 'text-orange-900' : 'text-blue-900'}`}>
            {isUrgent ? '⚠️ Trial Ending Soon!' : '🎉 You\'re on a Free Trial'}
          </h3>
          <p className={`text-sm ${isUrgent ? 'text-orange-800' : 'text-blue-800'}`}>
            <span className="font-semibold">{daysRemaining} days remaining</span> · 
            Limited access to premium features · 
            Upgrade anytime for full benefits
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href="/dashboard/settings/billing"
            className="px-4 py-2 rounded-lg font-semibold transition text-white hover:opacity-90"
            style={{
              backgroundColor: isUrgent ? '#ea580c' : primaryColor
            }}
          >
            Upgrade Now
          </Link>
          <Link
            href="/pricing"
            className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition text-gray-700"
          >
            View Plans
          </Link>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3 bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${(daysRemaining / 30) * 100}%`,
            backgroundColor: isUrgent ? '#f97316' : primaryColor
          }}
        />
      </div>
    </div>
  )
}
