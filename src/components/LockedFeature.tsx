'use client'

import { useState } from 'react'
import UpgradePrompt from './UpgradePrompt'

interface LockedFeatureProps {
  featureName: string
  daysRemaining?: number
  children?: React.ReactNode
  icon?: string
}

export default function LockedFeature({ 
  featureName, 
  daysRemaining = 0, 
  children,
  icon = '🔒'
}: LockedFeatureProps) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  
  return (
    <>
      <div className="relative">
        {/* Blurred/Disabled Content */}
        <div className="pointer-events-none filter blur-sm opacity-50">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center p-6">
            <div className="text-5xl mb-3">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {featureName}
            </h3>
            <p className="text-gray-600 mb-4">
              This feature is available on paid plans
            </p>
            <button
              onClick={() => setShowUpgradePrompt(true)}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Unlock Feature
            </button>
          </div>
        </div>
      </div>
      
      {showUpgradePrompt && (
        <UpgradePrompt
          featureName={featureName}
          daysRemaining={daysRemaining}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </>
  )
}
