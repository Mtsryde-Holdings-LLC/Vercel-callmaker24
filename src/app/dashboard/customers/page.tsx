'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

interface Customer {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  segment?: string
  tags?: string[]
  acceptsMarketing?: boolean
  ordersCount?: number
  totalSpent?: string
  source?: string
  createdAt: string
}

export default function CustomersPage() {
  const { primaryColor, backgroundColor } = useTheme()
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const customersPerPage = 50
  const [showImportModal, setShowImportModal] = useState(false)
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [shopifyStore, setShopifyStore] = useState('')
  const [shopifyApiKey, setShopifyApiKey] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [webhooksRegistered, setWebhooksRegistered] = useState(false)
  const [registeringWebhooks, setRegisteringWebhooks] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const result = await response.json()
        console.log('Customer API response:', result)
        setCustomers(result.data || [])
      } else {
        console.error('Customer API error:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = async () => {
    if (!importFile) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully imported ${data.imported} customers. ${data.errors} errors.`)
        setShowImportModal(false)
        setImportFile(null)
        fetchCustomers()
      }
    } catch (error) {
      console.error('Failed to import:', error)
      alert('Failed to import customers')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/customers/export?format=csv')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export:', error)
      alert('Failed to export customers')
    }
  }

  const handleShopifySync = async () => {
    setSyncing(true)
    try {
      // Get integration from database
      const integrationResponse = await fetch('/api/integrations?platform=SHOPIFY')
      const integrationData = await integrationResponse.json()
      
      if (!integrationData.integration) {
        if (confirm('Shopify not connected. Go to Shopify integration page?')) {
          window.location.href = '/dashboard/integrations/shopify'
        }
        setSyncing(false)
        return
      }

      const { shop, accessToken } = integrationData.integration.credentials
      const organizationId = integrationData.integration.organizationId

      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, shop, accessToken }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully synced ${data.synced.customers} customers, ${data.synced.products} products, and ${data.synced.orders} orders from Shopify!`)
        setShowShopifyModal(false)
        fetchCustomers()
      } else {
        const error = await response.json()
        console.error('Shopify sync error:', error)
        alert(`Sync failed: ${error.error}\n\nDetails: ${error.details || 'No additional details'}`)
      }
    } catch (error: any) {
      console.error('Failed to sync Shopify:', error)
      alert(`Failed to sync with Shopify: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleRegisterWebhooks = async () => {
    if (!shopifyStore || !shopifyApiKey) {
      alert('Please enter store URL and API key first')
      return
    }

    setRegisteringWebhooks(true)
    try {
      const response = await fetch('/api/integrations/shopify/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: shopifyStore, apiKey: shopifyApiKey }),
      })

      if (response.ok) {
        const data = await response.json()
        setWebhooksRegistered(true)
        alert(`✓ ${data.message}\n\nWebhooks registered:\n- customers/create\n- customers/update\n- customers/delete\n\nCustomers will now sync automatically!`)
      }
    } catch (error) {
      console.error('Failed to register webhooks:', error)
      alert('Failed to register webhooks')
    } finally {
      setRegisteringWebhooks(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setCustomers(customers.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const name = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    
    let matchesSegment = true
    if (segmentFilter === 'has_email') matchesSegment = !!customer.email
    else if (segmentFilter === 'no_email') matchesSegment = !customer.email
    else if (segmentFilter === 'has_phone') matchesSegment = !!customer.phone
    else if (segmentFilter === 'email_subscribed') matchesSegment = customer.emailOptIn === true
    else if (segmentFilter === 'sms_subscribed') matchesSegment = customer.smsOptIn === true
    
    return matchesSearch && matchesSegment
  })

  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage)
  const startIndex = (currentPage - 1) * customersPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + customersPerPage)

  const segments = Array.from(new Set(customers.map((c) => c.segment).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Database</h1>
          <p className="text-gray-600 mt-1">Manage and sync customers across all channels</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowShopifyModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
          >
            <span>🛍️</span>
            <span>Sync Shopify</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <span>📤</span>
            <span>Import</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
          >
            <span>📥</span>
            <span>Export</span>
          </button>
          <Link
            href="/dashboard/customers/create"
            className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
            style={{backgroundColor: primaryColor}}
          >
            + Add Customer
          </Link>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Import Customers from CSV</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a CSV file with columns: firstName, lastName, email, phone, tags, acceptsMarketing
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {importFile && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">📄 {importFile.name}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportCSV}
                  disabled={!importFile || importing}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopify Sync Modal */}
      {showShopifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Sync Shopify Customers</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will sync all customers from your connected Shopify store.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowShopifyModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShopifySync}
                  disabled={syncing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Customers</option>
              <option value="has_email">Has Email</option>
              <option value="no_email">No Email</option>
              <option value="has_phone">Has Phone</option>
              <option value="email_subscribed">Email Subscribed</option>
              <option value="sms_subscribed">SMS Subscribed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: primaryColor}}></div>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || segmentFilter ? 'No customers found matching your filters.' : 'No customers yet. Add your first customer!'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCustomers.map((customer) => {
                const displayName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{displayName}</div>
                      {customer.source && (
                        <div className="text-xs text-gray-500">{customer.source}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags?.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {tag}
                          </span>
                        )) || (customer.segment ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {customer.segment}
                          </span>
                        ) : '-')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="hover:opacity-70"
                        style={{color: primaryColor}}
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/customers/${customer.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + customersPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === pageNum
                        ? 'text-white'
                        : 'border hover:bg-gray-50'
                    }`}
                    style={currentPage === pageNum ? { backgroundColor: primaryColor } : {}}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{customers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Segments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{segments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">New This Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {
              customers.filter((c) => {
                const date = new Date(c.createdAt)
                const now = new Date()
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
              }).length
            }
          </p>
        </div>
      </div>
    </div>
  )
}
