'use client'

import { useState, useEffect } from 'react'

export default function IVRCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    recipients: '',
    scheduledFor: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [campaignsRes, templatesRes, customersRes] = await Promise.all([
      fetch('/api/ivr/campaigns'),
      fetch('/api/ivr/templates'),
      fetch('/api/customers')
    ])
    if (campaignsRes.ok) setCampaigns(await campaignsRes.json())
    if (templatesRes.ok) setTemplates(await templatesRes.json())
    if (customersRes.ok) {
      const data = await customersRes.json()
      setCustomers((data.data || []).filter((c: any) => c.phone))
    }
  }

  const loadFromCustomers = () => {
    const phones = selectedCustomers
      .map(id => customers.find(c => c.id === id)?.phone)
      .filter(Boolean)
      .join('\n')
    setFormData({ ...formData, recipients: phones })
    setShowCustomerSelect(false)
  }

  const createCampaign = async () => {
    try {
      const res = await fetch('/api/ivr/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recipients: formData.recipients.split('\n').map(r => r.trim()).filter(Boolean)
        })
      })
      if (res.ok) {
        alert('✅ Campaign created!')
        setShowCreate(false)
        fetchData()
      }
    } catch (error) {
      alert('❌ Failed to create campaign')
    }
  }

  const startCampaign = async (id: string) => {
    if (!confirm('Start this campaign now?')) return
    try {
      const res = await fetch(`/api/ivr/campaigns/${id}/start`, { method: 'POST' })
      if (res.ok) {
        alert('✅ Campaign started!')
        fetchData()
      }
    } catch (error) {
      alert('❌ Failed to start campaign')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Call Campaigns</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Create Campaign
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Create Campaign</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Recipients</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerSelect(!showCustomerSelect)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  📋 Select from Customers ({selectedCustomers.length} selected)
                </button>
                {selectedCustomers.length > 0 && (
                  <button
                    type="button"
                    onClick={loadFromCustomers}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    ✓ Load {selectedCustomers.length} Phone Numbers
                  </button>
                )}
              </div>
              {showCustomerSelect && (
                <div className="mb-3 border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomers(customers.map(c => c.id))}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomers([])}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customers.map(customer => (
                      <label key={customer.id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCustomers([...selectedCustomers, customer.id])
                            } else {
                              setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                          <div className="text-sm text-gray-600">{customer.phone}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+12345678901&#10;+12345678902&#10;+12345678903"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.recipients.split('\n').filter(Boolean).length} phone numbers
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Schedule For (optional)</label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={createCampaign} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                Save as Draft
              </button>
              {formData.scheduledFor && (
                <button onClick={createCampaign} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  ⏰ Schedule
                </button>
              )}
              <button onClick={async () => {
                await createCampaign()
                const campaign = campaigns[campaigns.length - 1]
                if (campaign) startCampaign(campaign.id)
              }} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                📞 Start Now
              </button>
              <button onClick={() => setShowCreate(false)} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{campaign.name}</h3>
                <p className="text-sm text-gray-600">
                  {campaign.totalCalls} calls • {campaign.completedCalls} completed • {campaign.failedCalls} failed
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {campaign.scheduledFor ? `Scheduled: ${new Date(campaign.scheduledFor).toLocaleString()}` : 'Not scheduled'}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  campaign.status === 'DRAFT' ? 'bg-gray-200' :
                  campaign.status === 'RUNNING' ? 'bg-blue-200 text-blue-800' :
                  campaign.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {campaign.status}
                </span>
                {campaign.status === 'DRAFT' && (
                  <button onClick={() => startCampaign(campaign.id)} className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    Start
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && !showCreate && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No campaigns yet. Create your first bulk call campaign.</p>
        </div>
      )}
    </div>
  )
}
