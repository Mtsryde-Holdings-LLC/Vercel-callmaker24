'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

interface CampaignReport {
  id: string
  name: string
  type: 'EMAIL' | 'SMS' | 'IVR' | 'SOCIAL'
  status: string
  createdAt: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  failed: number
}

export default function ReportsPage() {
  const { backgroundColor, primaryColor } = useTheme()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'EMAIL' | 'SMS' | 'IVR' | 'SOCIAL'>('ALL')
  const [reports, setReports] = useState<CampaignReport[]>([])

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/campaigns?type=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%'
    return `${((numerator / denominator) * 100).toFixed(1)}%`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return '📧'
      case 'SMS': return '💬'
      case 'IVR': return '☎️'
      case 'SOCIAL': return '📱'
      default: return '📊'
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'bg-blue-100 text-blue-800'
      case 'SMS': return 'bg-green-100 text-green-800'
      case 'IVR': return 'bg-purple-100 text-purple-800'
      case 'SOCIAL': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 p-8" style={{ backgroundColor }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaign Reports</h1>
        <p className="text-gray-600 mt-1">Detailed performance metrics for all campaigns</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {['ALL', 'EMAIL', 'SMS', 'IVR', 'SOCIAL'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 font-medium transition ${
              filter === type
                ? 'border-b-2 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={filter === type ? { borderColor: primaryColor, color: primaryColor } : {}}
          >
            {type === 'ALL' ? 'All Campaigns' : `${getTypeIcon(type)} ${type}`}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Campaigns</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{reports.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Sent</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {reports.reduce((sum, r) => sum + r.sent, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Avg Delivery Rate</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {calculateRate(
              reports.reduce((sum, r) => sum + r.delivered, 0),
              reports.reduce((sum, r) => sum + r.sent, 0)
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Avg Open Rate</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {calculateRate(
              reports.reduce((sum, r) => sum + r.opened, 0),
              reports.reduce((sum, r) => sum + r.delivered, 0)
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-600">Create your first campaign to see reports here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivered</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opened</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicked</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bounced</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unsubscribed</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rates</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-500">{report.status}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(report.type)}`}>
                        {getTypeIcon(report.type)} {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {report.sent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {report.delivered.toLocaleString()}
                      <div className="text-xs text-gray-500">{calculateRate(report.delivered, report.sent)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                      {report.opened.toLocaleString()}
                      <div className="text-xs text-gray-500">{calculateRate(report.opened, report.delivered)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                      {report.clicked.toLocaleString()}
                      <div className="text-xs text-gray-500">{calculateRate(report.clicked, report.opened)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {report.bounced.toLocaleString()}
                      <div className="text-xs text-gray-500">{calculateRate(report.bounced, report.sent)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                      {report.unsubscribed.toLocaleString()}
                      <div className="text-xs text-gray-500">{calculateRate(report.unsubscribed, report.delivered)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="space-y-1">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500">Delivery:</span>
                          <span className="text-xs font-medium text-green-600">{calculateRate(report.delivered, report.sent)}</span>
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500">Open:</span>
                          <span className="text-xs font-medium text-blue-600">{calculateRate(report.opened, report.delivered)}</span>
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500">CTR:</span>
                          <span className="text-xs font-medium text-purple-600">{calculateRate(report.clicked, report.opened)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
