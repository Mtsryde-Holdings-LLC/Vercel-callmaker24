'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  tags?: string[]
}

export default function CreateSmsCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    scheduledFor: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')

  useEffect(() => {
    fetchCustomers()
    
    // Check if a template was selected
    const templateId = searchParams.get('template')
    if (templateId) {
      const templateData = localStorage.getItem('selectedSmsTemplate')
      if (templateData) {
        const template = JSON.parse(templateData)
        setFormData(prev => ({
          ...prev,
          name: template.name,
          message: template.message,
        }))
        setCharCount(template.message.length)
        // Clean up
        localStorage.removeItem('selectedSmsTemplate')
      }
    }
  }, [searchParams])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const result = await response.json()
        // Filter only customers with phone numbers
        setCustomers((result.data || []).filter((c: Customer) => c.phone))
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.phone && (
      (c.phone && c.phone.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (c.firstName && c.firstName.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
    )
  )

  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedCustomers(filteredCustomers.map(c => c.id))
  }

  const clearAll = () => {
    setSelectedCustomers([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (name === 'message') {
      setCharCount(value.length)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (selectedCustomers.length === 0) {
      setError('Please select at least one recipient with a phone number')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recipients: selectedCustomers,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create campaign')
        setLoading(false)
        return
      }

      const campaign = await response.json()
      router.push(`/dashboard/sms/${campaign.id}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const messageCount = Math.ceil(charCount / 160)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create SMS Campaign</h1>
          <p className="text-gray-600 mt-1">Send text messages to your customers</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/sms/templates" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            📱 Browse Templates
          </Link>
          <Link href="/dashboard/sms" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Flash Sale Alert"
            />
          </div>

          {/* Recipients Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients * ({selectedCustomers.length} selected)
            </label>
            <button
              type="button"
              onClick={() => setShowCustomerSelect(!showCustomerSelect)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  {selectedCustomers.length === 0 
                    ? '📱 Click to select customers with phone numbers' 
                    : `✓ ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? 's' : ''} selected`}
                </span>
                <span className="text-2xl">{showCustomerSelect ? '▼' : '▶'}</span>
              </div>
            </button>

            {showCustomerSelect && (
              <div className="mt-4 border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg mr-3"
                  />
                  <button type="button" onClick={selectAll} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 mr-2">
                    Select All
                  </button>
                  <button type="button" onClick={clearAll} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    Clear
                  </button>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No customers with phone numbers found. Import or add customers with phone numbers first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCustomers.map(customer => {
                      const displayName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                      return (
                        <label key={customer.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => toggleCustomer(customer.id)}
                            className="w-4 h-4 text-primary-600 rounded mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{displayName}</div>
                            <div className="text-sm text-gray-600">📱 {customer.phone}</div>
                          </div>
                          {customer.tags && customer.tags.length > 0 && (
                            <div className="flex gap-1">
                              {customer.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your SMS message here..."
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className={charCount > 160 ? 'text-orange-600' : 'text-gray-500'}>
                {charCount} characters • {messageCount} message{messageCount !== 1 ? 's' : ''}
              </span>
              {charCount > 160 && (
                <span className="text-orange-600">
                  ⚠️ Messages over 160 characters may be split
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-2">
              Send Date & Time (Optional)
            </label>
            <input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Leave empty to save as draft, or select a date/time to schedule
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📱 SMS Best Practices</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Keep messages concise and actionable</li>
              <li>• Include a clear call-to-action</li>
              <li>• Avoid excessive punctuation and ALL CAPS</li>
              <li>• Always include opt-out instructions</li>
              <li>• Respect time zones when scheduling</li>
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/dashboard/sms"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault()
                if (selectedCustomers.length === 0) {
                  setError('Please select at least one recipient')
                  return
                }
                setLoading(true)
                try {
                  const response = await fetch('/api/sms/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, recipients: selectedCustomers, sendNow: true }),
                  })
                  if (response.ok) {
                    const campaign = await response.json()
                    router.push(`/dashboard/sms/${campaign.id}`)
                  } else {
                    setError('Failed to send campaign')
                  }
                } catch (err) {
                  setError('An error occurred')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : '📤 Send Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
