'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SmsCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaign()
  }, [params.id])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data)
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
    } finally {
      setLoading(false)
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
        <Link href="/dashboard/sms" className="text-blue-600 hover:text-blue-700">
          ← Back to Campaigns
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <p className="text-gray-900">{campaign.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Recipients</label>
          <p className="text-gray-900">{campaign.totalRecipients || 0}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Message</label>
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
      </div>
    </div>
  )
}
