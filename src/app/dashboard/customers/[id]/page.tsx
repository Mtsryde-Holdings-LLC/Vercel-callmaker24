'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [carts, setCarts] = useState<any[]>([])
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      const [customerRes, ordersRes, cartsRes, discountsRes] = await Promise.all([
        fetch(`/api/customers/${params.id}`),
        fetch(`/api/customers/${params.id}/shopify/orders`),
        fetch(`/api/customers/${params.id}/shopify/carts`),
        fetch(`/api/customers/${params.id}/discounts`)
      ])
      
      if (customerRes.ok) {
        const data = await customerRes.json()
        setCustomer(data.data)
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.data || [])
      }
      if (cartsRes.ok) {
        const data = await cartsRes.json()
        setCarts(data.data || [])
      }
      if (discountsRes.ok) {
        const data = await discountsRes.json()
        setDiscounts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
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
          <h3 className="font-semibold text-gray-900 mb-3">Loyalty Program</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Member Status</p>
              <p className="text-lg font-bold">{customer.loyaltyMember ? '✓ Active' : '✗ Not Enrolled'}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Points Balance</p>
              <p className="text-lg font-bold">{customer.loyaltyPoints || 0}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Points Used</p>
              <p className="text-lg font-bold">{customer.loyaltyUsed || 0}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Special Points</p>
              <p className="text-lg font-bold">{(customer.birthdayPoints || 0) + (customer.specialPoints || 0)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">Purchase History</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-lg font-bold">{customer.orderCount || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-lg font-bold">${(customer.totalSpent || 0).toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Last Order</p>
              <p className="text-lg font-bold">{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : 'Never'}</p>
            </div>
          </div>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">Order #{order.order_number || order.name}</p>
                      <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${parseFloat(order.total_price).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded ${order.financial_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                        {order.financial_status}
                      </span>
                    </div>
                  </div>
                  {order.line_items && order.line_items.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {order.line_items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex-shrink-0">
                          {item.product_image && (
                            <img src={item.product_image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                          )}
                          <p className="text-xs text-gray-600 mt-1 w-16 truncate">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No purchases yet</p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">Abandoned Carts</h3>
          {carts.filter((c: any) => !c.recovered).length > 0 ? (
            <div className="space-y-2">
              {carts.filter((c: any) => !c.recovered).map((cart: any) => (
                <div key={cart.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <div>
                    <p className="font-medium">Cart abandoned</p>
                    <p className="text-sm text-gray-600">{new Date(cart.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${cart.total.toFixed(2)}</p>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Unchecked</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No abandoned carts</p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">Discounts Received</h3>
          {discounts.length > 0 ? (
            <div className="space-y-2">
              {discounts.slice(0, 5).map((discount: any) => (
                <div key={discount.id} className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <div>
                    <p className="font-medium">{discount.code}</p>
                    <p className="text-sm text-gray-600">{new Date(discount.usedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">-${discount.amount.toFixed(2)}</p>
                    <span className="text-xs text-gray-600">{discount.type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No discounts used</p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Created: {new Date(customer.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(customer.updatedAt).toLocaleString()}</p>
            {customer.birthday && <p>Birthday: {new Date(customer.birthday).toLocaleDateString()}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
