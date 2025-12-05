'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
]

// Theme colors
const THEME_COLORS = [
  { name: 'Blue', primary: '#3B82F6', secondary: '#1E40AF' },
  { name: 'Purple', primary: '#8B5CF6', secondary: '#6D28D9' },
  { name: 'Green', primary: '#10B981', secondary: '#047857' },
  { name: 'Red', primary: '#EF4444', secondary: '#B91C1C' },
  { name: 'Orange', primary: '#F59E0B', secondary: '#D97706' },
  { name: 'Pink', primary: '#EC4899', secondary: '#BE185D' },
  { name: 'Teal', primary: '#14B8A6', secondary: '#0F766E' },
  { name: 'Indigo', primary: '#6366F1', secondary: '#4338CA' },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const { primaryColor, secondaryColor, backgroundColor, language, updateTheme, setLanguage, setBackgroundColor } = useTheme()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('organization')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Organization settings state
  const [orgData, setOrgData] = useState({
    name: '',
    logo: '',
    domain: '',
    language: language,
    primaryColor: primaryColor,
    secondaryColor: secondaryColor,
    backgroundColor: backgroundColor,
  })
  
  const [orgLoading, setOrgLoading] = useState(true)

  // Fetch organization data on mount
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/organization')
        if (response.ok) {
          const data = await response.json()
          if (data.organization) {
            setOrgData(prev => ({
              ...prev,
              name: data.organization.name || '',
              logo: data.organization.logo || '',
              domain: data.organization.domain || '',
            }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      } finally {
        setOrgLoading(false)
      }
    }
    
    fetchOrganization()
  }, [])

  // Sync with theme context
  useEffect(() => {
    setOrgData(prev => ({
      ...prev,
      language: language,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      backgroundColor: backgroundColor,
    }))
  }, [language, primaryColor, secondaryColor, backgroundColor])

  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  })

  // Mock subscription data - in production, fetch from API
  const subscription = {
    tier: 'PRO',
    status: 'ACTIVE',
    price: 129.99,
    billingPeriod: 'monthly',
    nextBillingDate: new Date('2024-12-01'),
    limits: {
      agents: 5,
      customers: 5000,
      emailsPerMonth: 100000,
      smsPerMonth: 25000,
    },
    usage: {
      agents: 3,
      customers: 2340,
      emailsThisMonth: 45230,
      smsThisMonth: 12500,
    }
  }

  // Integrations state
  const [integrations, setIntegrations] = useState<any[]>([])
  const [integrationsLoading, setIntegrationsLoading] = useState(true)

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations')
        if (response.ok) {
          const data = await response.json()
          const shopifyIntegration = data.integrations?.find((i: any) => i.platform === 'SHOPIFY')
          
          setIntegrations([
            { id: '1', name: 'SendGrid', icon: '📧', isActive: true, category: 'Email Provider' },
            { id: '2', name: 'Twilio', icon: '💬', isActive: true, category: 'SMS Provider' },
            { id: '3', name: 'Shopify', icon: '🛍️', isActive: !!shopifyIntegration, category: 'E-commerce', platform: 'SHOPIFY' },
            { id: '4', name: 'Stripe', icon: '💳', isActive: true, category: 'Payment' },
            { id: '5', name: 'Facebook', icon: '📘', isActive: true, category: 'Social Media' },
            { id: '6', name: 'Google Analytics', icon: '📊', isActive: false, category: 'Analytics' },
          ])
        }
      } catch (error) {
        console.error('Failed to fetch integrations:', error)
      } finally {
        setIntegrationsLoading(false)
      }
    }
    fetchIntegrations()
  }, [])

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        role: session.user.role || 'USER',
      })
    }
  }, [session])

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      // Update theme context - this will apply colors globally
      updateTheme(orgData.primaryColor, orgData.secondaryColor, orgData.backgroundColor)
      setLanguage(orgData.language)
      
      // Save to database via API
      const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgData.name,
          logo: orgData.logo,
          domain: orgData.domain,
          settings: {
            language: orgData.language,
            primaryColor: orgData.primaryColor,
            secondaryColor: orgData.secondaryColor,
            backgroundColor: orgData.backgroundColor,
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save organization settings')
      }
      
      const data = await response.json()
      setMessage('✓ Organization settings saved successfully! Theme applied.')
      
      // Keep form values - they are already in orgData state
      // No reset needed - the form will keep showing current values
    } catch (error: any) {
      console.error('Save organization error:', error)
      setMessage('⚠ Failed to save settings: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('✓ Profile updated successfully!')
    } catch (error) {
      setMessage('⚠ Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const toggleIntegration = async (integration: any) => {
    if (integration.name === 'Shopify') {
      if (!integration.isActive) {
        // Redirect to Shopify OAuth
        window.location.href = '/api/integrations/shopify/auth'
      } else {
        // Disconnect Shopify
        if (confirm('Disconnect Shopify integration?')) {
          try {
            const response = await fetch('/api/integrations?platform=SHOPIFY', { method: 'DELETE' })
            if (response.ok) {
              setIntegrations(integrations.map(int => 
                int.id === integration.id ? { ...int, isActive: false } : int
              ))
            }
          } catch (error) {
            console.error('Failed to disconnect:', error)
          }
        }
      }
    }
  }

  const tabs = [
    { id: 'organization', key: 'organization', icon: '🏢' },
    { id: 'subscription', key: 'subscription', icon: '💎' },
    { id: 'profile', key: 'profile', icon: '👤' },
    { id: 'integrations', key: 'integrations', icon: '🔗' },
    { id: 'appearance', key: 'appearance', icon: '🎨' },
    { id: 'api', key: 'apiWebhooks', icon: '🔌' },
    { id: 'notifications', key: 'notifications', icon: '🔔' },
  ]

  return (
    <div className="space-y-6" style={{backgroundColor: backgroundColor}}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✓') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={activeTab === tab.id ? { borderColor: primaryColor, color: primaryColor } : {}}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{t(`settings.${tab.key}`)}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <form onSubmit={handleSaveOrg} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Settings</h2>
                <p className="text-sm text-gray-600 mb-6">These settings apply to all users in your organization</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={orgData.name}
                    onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                  <select
                    value={orgData.language}
                    onChange={(e) => setOrgData({...orgData, language: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Current: {LANGUAGES.find(l => l.code === orgData.language)?.flag} {LANGUAGES.find(l => l.code === orgData.language)?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Domain
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Enterprise</span>
                  </label>
                  <input
                    type="text"
                    value={orgData.domain}
                    onChange={(e) => setOrgData({...orgData, domain: e.target.value})}
                    placeholder="yourcompany.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Current Subscription</h2>
                <p className="text-sm text-gray-600">View your plan details and usage</p>
              </div>

              {/* Current Plan Card */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-bold text-gray-900">{subscription.tier} Plan</h3>
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                        {subscription.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      ${subscription.price}/{subscription.billingPeriod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Next billing</p>
                    <p className="font-semibold text-gray-900">
                      {subscription.nextBillingDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Agents</p>
                    <p className="text-xl font-bold text-gray-900">{subscription.usage.agents}/{subscription.limits.agents}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Customers</p>
                    <p className="text-xl font-bold text-gray-900">{subscription.usage.customers.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Emails Used</p>
                    <p className="text-xl font-bold text-gray-900">{Math.round((subscription.usage.emailsThisMonth/subscription.limits.emailsPerMonth)*100)}%</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">SMS Used</p>
                    <p className="text-xl font-bold text-gray-900">{Math.round((subscription.usage.smsThisMonth/subscription.limits.smsPerMonth)*100)}%</p>
                  </div>
                </div>

                <Link
                  href="/pricing"
                  className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Upgrade Plan
                </Link>
              </div>

              {/* Usage Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Monthly Usage</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Email Campaigns</span>
                      <span className="font-medium">{subscription.usage.emailsThisMonth.toLocaleString()} / {subscription.limits.emailsPerMonth.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{width: `${(subscription.usage.emailsThisMonth/subscription.limits.emailsPerMonth)*100}%`}}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">SMS Messages</span>
                      <span className="font-medium">{subscription.usage.smsThisMonth.toLocaleString()} / {subscription.limits.smsPerMonth.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{width: `${(subscription.usage.smsThisMonth/subscription.limits.smsPerMonth)*100}%`}}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Profile Information</h2>
                <p className="text-sm text-gray-600">Update your personal details</p>
              </div>

              <div className="flex items-center space-x-6 pb-6 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <button type="button" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm">
                    Change Avatar
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={profileData.role}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Integrations</h2>
                <p className="text-sm text-gray-600">Connect third-party services to enhance your workflow</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className={`border-2 rounded-lg p-4 transition ${
                      integration.isActive
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{integration.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                          <p className="text-xs text-gray-500">{integration.category}</p>
                        </div>
                      </div>
                      {integration.isActive && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleIntegration(integration)}
                      disabled={integration.name !== 'Shopify' && integration.isActive}
                      className={`w-full py-2 rounded-lg font-medium transition ${
                        integration.isActive
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      } ${integration.name !== 'Shopify' && integration.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {integration.isActive ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Appearance Settings</h2>
                <p className="text-sm text-gray-600">Customize your platform's look and feel</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Theme Color</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setOrgData({...orgData, primaryColor: color.primary, secondaryColor: color.secondary})}
                      className={`relative p-3 rounded-lg border-2 transition ${
                        orgData.primaryColor === color.primary
                          ? 'border-gray-900 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full" style={{backgroundColor: color.primary}} />
                        <div className="w-6 h-6 rounded-full" style={{backgroundColor: color.secondary}} />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{color.name}</p>
                      {orgData.primaryColor === color.primary && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Background Color</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setOrgData({...orgData, backgroundColor: '#F9FAFB'})}
                    className={`relative p-4 rounded-lg border-2 transition ${
                      orgData.backgroundColor === '#F9FAFB'
                        ? 'border-gray-900 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-12 rounded mb-2" style={{backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB'}} />
                    <p className="text-sm font-medium text-gray-900">Faded Gray</p>
                    <p className="text-xs text-gray-500">Default</p>
                    {orgData.backgroundColor === '#F9FAFB' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setOrgData({...orgData, backgroundColor: '#E0F2FE'})}
                    className={`relative p-4 rounded-lg border-2 transition ${
                      orgData.backgroundColor === '#E0F2FE'
                        ? 'border-gray-900 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-12 rounded mb-2" style={{backgroundColor: '#E0F2FE'}} />
                    <p className="text-sm font-medium text-gray-900">Sky Blue</p>
                    <p className="text-xs text-gray-500">Light</p>
                    {orgData.backgroundColor === '#E0F2FE' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setOrgData({...orgData, backgroundColor: '#FFFFFF'})}
                    className={`relative p-4 rounded-lg border-2 transition ${
                      orgData.backgroundColor === '#FFFFFF'
                        ? 'border-gray-900 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-12 rounded mb-2" style={{backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB'}} />
                    <p className="text-sm font-medium text-gray-900">Pure White</p>
                    <p className="text-xs text-gray-500">Clean</p>
                    {orgData.backgroundColor === '#FFFFFF' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>
                <div 
                  className="border-2 border-gray-200 rounded-lg p-8 space-y-4"
                  style={{backgroundColor: orgData.backgroundColor}}
                >
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 mb-3">Platform background with card</p>
                    <div className="flex gap-3">
                      <button 
                        style={{backgroundColor: orgData.primaryColor}} 
                        className="px-6 py-2 text-white rounded-lg font-medium"
                      >
                        Primary Button
                      </button>
                      <button 
                        style={{backgroundColor: orgData.secondaryColor}} 
                        className="px-6 py-2 text-white rounded-lg font-medium"
                      >
                        Secondary Button
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleSaveOrg(e as any)
                  }}
                  disabled={loading}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  style={{ backgroundColor: orgData.primaryColor }}
                >
                  {loading ? 'Applying Theme...' : 'Save & Apply Theme'}
                </button>
              </div>
            </div>
          )}

          {/* API & Webhooks Tab */}
          {activeTab === 'api' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Integrations & API</h2>
                <p className="text-sm text-gray-600">Connect CallMaker24 to your website and other systems</p>
              </div>

              {/* Security Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-3">⚠️</span>
                  <div>
                    <p className="font-medium text-yellow-900">Keep your API keys secure</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Never share your API keys publicly or commit them to version control
                    </p>
                  </div>
                </div>
              </div>

              {/* API Keys Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔑 API Keys</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Production API Key</span>
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Regenerate
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <code className="flex-1 bg-white p-3 rounded border border-gray-200 text-sm font-mono">
                        sk_live_••••••••••••••••••••••••••••4a8f
                      </code>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm">
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Test API Key</span>
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Regenerate
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <code className="flex-1 bg-white p-3 rounded border border-gray-200 text-sm font-mono">
                        sk_test_••••••••••••••••••••••••••••2b1c
                      </code>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm">
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Generator Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Website Widgets</h3>
                <p className="text-sm text-gray-600 mb-4">Embed interactive widgets on your website</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {[
                    { name: 'Contact Form Widget', desc: 'Capture leads with customizable forms', icon: '📝' },
                    { name: 'Chatbot Widget', desc: 'Add AI chatbot to any page', icon: '💬' },
                    { name: 'Email Subscription', desc: 'Newsletter signup widget', icon: '📧' },
                    { name: 'SMS Opt-in Widget', desc: 'SMS subscription form', icon: '📱' },
                  ].map((widget, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-primary-400 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{widget.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{widget.name}</h4>
                            <p className="text-sm text-gray-500">{widget.desc}</p>
                          </div>
                        </div>
                        <button 
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                          style={{ color: primaryColor }}
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">JavaScript Embed Code</h4>
                  <div className="flex items-start space-x-3">
                    <code className="flex-1 bg-white p-3 rounded border border-gray-200 text-xs font-mono overflow-x-auto">
                      {`<script src="https://widget.callmaker24.com/embed.js"></script>
<script>
  CallMaker24.init({
    apiKey: 'pk_live_your_public_key',
    widget: 'chatbot',
    position: 'bottom-right'
  });
</script>`}
                    </code>
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm whitespace-nowrap">
                      Copy Code
                    </button>
                  </div>
                </div>
              </div>

              {/* Plugin Generator Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔌 Platform Plugins</h3>
                <p className="text-sm text-gray-600 mb-4">Ready-to-use plugins for popular platforms</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'WordPress', icon: '🔷', version: 'v2.4.1', downloads: '12K+' },
                    { name: 'Shopify', icon: '🛍️', version: 'v1.8.0', downloads: '8K+' },
                    { name: 'WooCommerce', icon: '🛒', version: 'v3.1.2', downloads: '15K+' },
                    { name: 'Magento', icon: '🏪', version: 'v2.0.5', downloads: '5K+' },
                    { name: 'Wix', icon: '🎯', version: 'v1.5.3', downloads: '6K+' },
                    { name: 'Squarespace', icon: '⬛', version: 'v1.3.0', downloads: '4K+' },
                  ].map((plugin, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-3xl">{plugin.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{plugin.name}</h4>
                          <p className="text-xs text-gray-500">{plugin.version} • {plugin.downloads}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition">
                          Download
                        </button>
                        <button className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition">
                          Docs
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shortcode Generator Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Shortcode Generator</h3>
                <p className="text-sm text-gray-600 mb-4">Generate shortcodes for WordPress, Shopify, and other CMS platforms</p>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shortcode Type</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                          <option>Contact Form</option>
                          <option>Email Signup</option>
                          <option>SMS Opt-in</option>
                          <option>Chatbot</option>
                          <option>Phone Widget</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                          <option>Default</option>
                          <option>Minimal</option>
                          <option>Modern</option>
                          <option>Classic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                          <option>Medium</option>
                          <option>Small</option>
                          <option>Large</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition mb-4"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Generate Shortcode
                    </button>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Generated Shortcode</span>
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Copy
                        </button>
                      </div>
                      <code className="block bg-white p-3 rounded border border-gray-200 text-sm font-mono">
                        [callmaker24 type="contact-form" style="default" size="medium"]
                      </code>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📖 Shortcode Usage Examples</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• WordPress: Add shortcode directly in posts/pages</li>
                      <li>• Shopify: Use in page content or theme templates</li>
                      <li>• WooCommerce: Insert in product descriptions</li>
                      <li>• Custom HTML: Works with any platform supporting HTML</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Webhooks Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🪝 Webhook Manager</h3>
                <p className="text-sm text-gray-600 mb-4">Receive real-time notifications for events in your account</p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Create New Webhook</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                      <input
                        type="url"
                        placeholder="https://your-site.com/webhook"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                        <option>campaign.sent</option>
                        <option>campaign.opened</option>
                        <option>campaign.clicked</option>
                        <option>customer.created</option>
                        <option>customer.updated</option>
                        <option>sms.delivered</option>
                        <option>call.completed</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    style={{ backgroundColor: primaryColor }}
                  >
                    + Add Webhook
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { url: 'https://myapp.com/webhook/campaigns', event: 'campaign.sent', status: 'Active', calls: '1,234' },
                    { url: 'https://analytics.example.com/track', event: 'campaign.opened', status: 'Active', calls: '856' },
                  ].map((webhook, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <code className="text-sm font-mono text-gray-900">{webhook.url}</code>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              {webhook.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Event: <span className="font-medium">{webhook.event}</span></span>
                            <span>Calls: <span className="font-medium">{webhook.calls}</span></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded transition">
                            Test
                          </button>
                          <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition">
                            Edit
                          </button>
                          <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Documentation Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 API Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'REST API', desc: 'Full API reference', icon: '🌐', color: 'blue' },
                    { title: 'Code Examples', desc: 'Sample implementations', icon: '💻', color: 'green' },
                    { title: 'SDKs', desc: 'Official libraries', icon: '📦', color: 'purple' },
                    { title: 'API Status', desc: 'Uptime & status', icon: '📊', color: 'orange' },
                  ].map((doc, idx) => (
                    <Link
                      key={idx}
                      href="#"
                      className={`border-2 border-${doc.color}-200 bg-${doc.color}-50 rounded-lg p-4 hover:shadow-md transition`}
                    >
                      <span className="text-2xl mb-2 block">{doc.icon}</span>
                      <h4 className="font-semibold text-gray-900 mb-1">{doc.title}</h4>
                      <p className="text-sm text-gray-600">{doc.desc}</p>
                      <span className={`text-sm text-${doc.color}-600 font-medium mt-2 inline-block`}>
                        View →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Notification Preferences</h2>
                <p className="text-sm text-gray-600">Control what alerts and updates you receive</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: '1', label: 'Campaign Sent', desc: 'Notify when campaigns are delivered' },
                  { id: '2', label: 'Campaign Opened', desc: 'Notify when recipients open emails' },
                  { id: '3', label: 'Weekly Reports', desc: 'Receive weekly performance summaries' },
                  { id: '4', label: 'Usage Alerts', desc: 'Alert when approaching plan limits' },
                  { id: '5', label: 'Team Activity', desc: 'Notify about team member actions' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-full h-full bg-gray-200 rounded-full peer-checked:bg-primary-600 transition cursor-pointer" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-6 cursor-pointer" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
