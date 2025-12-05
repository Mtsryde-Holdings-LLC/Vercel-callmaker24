'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import TrialBanner from '@/components/TrialBanner'
import { isUserOnTrial } from '@/lib/trial-limits'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

const navigationItems = [
  { key: 'dashboard', href: '/dashboard', icon: '📊' },
  { key: 'crm', href: '/dashboard/crm', icon: '🤝' },
  { key: 'customers', href: '/dashboard/customers', icon: '👥' },
  { key: 'loyalty', href: '/dashboard/loyalty', icon: '🏆' },
  { key: 'emailCampaigns', href: '/dashboard/email', icon: '📧' },
  { key: 'smsCampaigns', href: '/dashboard/sms', icon: '💬' },
  { key: 'socialMedia', href: '/dashboard/social', icon: '📱' },
  { key: 'callCenter', href: '/dashboard/call-center', icon: '☎️' },
  { key: 'chatbot', href: '/dashboard/chatbot', icon: '🤖' },
  { key: 'team', href: '/dashboard/team', icon: '👔' },
  { key: 'analytics', href: '/dashboard/analytics', icon: '📈' },
  { key: 'settings', href: '/dashboard/settings', icon: '⚙️' },
  { key: 'signOut', href: '#', icon: '🚪', action: 'signOut' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { primaryColor, backgroundColor } = useTheme()
  const { t } = useTranslation()
  
  // Handle logout and clear settings
  const handleSignOut = () => {
    // Clear all theme and language settings from localStorage
    localStorage.removeItem('theme-primary-color')
    localStorage.removeItem('theme-secondary-color')
    localStorage.removeItem('theme-background-color')
    localStorage.removeItem('organization-language')
    
    // Sign out
    signOut({ callbackUrl: '/' })
  }
  
  // Mock organization data - in production, fetch from API
  const organization = {
    name: 'My Organization',
    subscriptionStatus: 'TRIALING' as const,
    subscriptionStartDate: new Date(),
  }
  
  const showTrialBanner = isUserOnTrial(
    organization.subscriptionStatus,
    organization.subscriptionStartDate
  )

  // TEMPORARY: Disabled auth check for testing
  // useEffect(() => {
  //   if (status === 'unauthenticated') {
  //     router.push('/auth/signin')
  //   }
  // }, [status, router])

  // if (status === 'loading') {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  //     </div>
  //   )
  // }

  // if (!session) {
  //   return null
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          lg:translate-x-0
        `}
        style={{ width: sidebarCollapsed ? '80px' : '256px' }}
      >
        <div className="flex items-center h-16 px-6 border-b">
          <div className="flex items-center justify-between w-full">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="https://image2url.com/images/1764870645442-014593f0-e852-49a2-8590-5f742b4ff9db.png" alt="CallMaker24" className={sidebarCollapsed ? "h-8 w-8" : "h-8"} />
              {!sidebarCollapsed && <span className="text-xl font-bold" style={{color: primaryColor}}>CallMaker24</span>}
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            if (item.action === 'signOut') {
              return (
                <button
                  key={item.key}
                  onClick={handleSignOut}
                  className={`
                    w-full flex items-center rounded-lg transition text-red-600 hover:bg-red-50
                    ${sidebarCollapsed ? 'justify-center px-4 py-3' : 'px-4 py-3'}
                  `}
                  title={sidebarCollapsed ? 'Sign Out' : ''}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-sm font-medium">Sign Out</span>
                  )}
                </button>
              )
            }
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`
                  flex items-center rounded-lg transition
                  ${sidebarCollapsed ? 'justify-center px-4 py-3' : 'px-4 py-3'}
                  ${isActive ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-700 hover:bg-gray-100'}
                `}
                style={isActive ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}}
                title={sidebarCollapsed ? t(`navigation.${item.key}`) : ''}
              >
                <span className="text-lg">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm font-medium">{t(`navigation.${item.key}`)}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{backgroundColor: primaryColor}}>
                {session?.user?.name?.[0] || 'G'}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{backgroundColor: primaryColor}}>
                {session?.user?.name?.[0] || 'G'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'Guest User'}</p>
                <p className="text-xs text-gray-500">{session?.user?.email || 'Testing Mode'}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 lg:flex-none"></div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Trial Banner */}
        {showTrialBanner && (
          <TrialBanner
            subscriptionStartDate={organization.subscriptionStartDate}
            organizationName={organization.name}
          />
        )}

        {/* Page content */}
        <main className="p-6" style={{backgroundColor: backgroundColor}}>
          {children}
        </main>
      </div>
    </div>
  )
}
