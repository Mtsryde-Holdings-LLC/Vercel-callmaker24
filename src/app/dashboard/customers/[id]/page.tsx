'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setCustomer(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  if (!customer) return <div className="p-8">Customer not found</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/customers" className="text-blue-600 hover:underline">
          ← Back to Customers
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {customer.firstName} {customer.lastName}
            </h1>
            {customer.company && <p className="text-gray-600">{customer.company}</p>}
          </div>
          <Link
            href={`/dashboard/customers/${params.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">{customer.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="font-medium">{customer.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Shopify ID:</span>
                <p className="font-medium">{customer.shopifyId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Preferences</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${customer.emailOptIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {customer.emailOptIn ? '✓ Email Subscribed' : '✗ Email Unsubscribed'}
                </span>
              </div>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${customer.smsOptIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {customer.smsOptIn ? '✓ SMS Subscribed' : '✗ SMS Unsubscribed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Created: {new Date(customer.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(customer.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
