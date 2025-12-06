'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CampaignDetailPage() {
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
      const response = await fetch(`/api/email-campaigns/${params.id}`)
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
      const response = await fetch(`/api/email-campaigns/${params.id}`, {
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
          <p className="text-gray-600 mt-1">Campaign Details</p>
        </div>
        <div className="flex gap-3">
          {!editing && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Edit
            </button>
          )}
          <Link href="/dashboard/email" className="text-blue-600 hover:text-blue-700">
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
              <label className="text-sm font-medium text-gray-600">Subject</label>
              <input
                type="text"
                value={formData.subject || ''}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">From Name</label>
              <input
                type="text"
                value={formData.fromName || ''}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">From Email</label>
              <input
                type="email"
                value={formData.fromEmail || ''}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">HTML Content</label>
              <textarea
                value={formData.htmlContent || ''}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border rounded-lg mt-1 font-mono text-sm"
              />
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
              <label className="text-sm font-medium text-gray-600">Subject</label>
              <p className="text-gray-900">{campaign.subject}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-gray-900">{campaign.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Recipients</label>
              <p className="text-gray-900">{campaign.totalRecipients || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Content Preview</label>
              <div className="mt-2 p-4 border rounded" dangerouslySetInnerHTML={{ __html: campaign.htmlContent }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}