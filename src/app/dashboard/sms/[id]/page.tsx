'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SmsCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    fetchCampaign()
  }, [params.id])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data)
        setFormData(data)
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        alert('✅ Campaign updated!')
        setEditing(false)
        fetchCampaign()
      }
    } catch (error) {
      alert('❌ Failed to update campaign')
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!campaign) {
    return <div className="p-6">Campaign not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-gray-600 mt-1">SMS Campaign Details</p>
        </div>
        <div className="flex gap-3">
          {!editing && campaign.status === 'DRAFT' && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Edit
            </button>
          )}
          <Link href="/dashboard/sms" className="text-blue-600 hover:text-blue-700">
            ← Back
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Campaign Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Message</label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                maxLength={160}
                className="w-full px-4 py-2 border rounded-lg mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">{(formData.message || '').length}/160 characters</p>
            </div>
            <div className="flex gap-3">
              <button onClick={saveCampaign} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Save
              </button>
              <button onClick={() => { setEditing(false); setFormData(campaign) }} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-gray-900">{campaign.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Recipients</label>
              <p className="text-gray-900">{campaign.totalRecipients || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Message Preview</label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded">{campaign.message}</p>
            </div>
            {campaign.scheduledFor && (
              <div>
                <label className="text-sm font-medium text-gray-600">Scheduled For</label>
                <p className="text-gray-900">{new Date(campaign.scheduledFor).toLocaleString()}</p>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">Sent At</label>
                <p className="text-gray-900">{new Date(campaign.sentAt).toLocaleString()}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
