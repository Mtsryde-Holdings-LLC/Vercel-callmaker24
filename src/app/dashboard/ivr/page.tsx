'use client'

import { useState } from 'react'

interface IVRNode {
  id: string
  type: 'menu' | 'message' | 'forward' | 'voicemail'
  label: string
  prompt?: string
  options?: { key: string; action: string; nextNode?: string }[]
}

export default function IVRPage() {
  const [flows, setFlows] = useState([
    { id: '1', name: 'Main Reception', nodes: 3, status: 'active', calls: 1247 },
    { id: '2', name: 'Sales Department', nodes: 5, status: 'active', calls: 856 },
    { id: '3', name: 'Support Line', nodes: 4, status: 'inactive', calls: 423 },
  ])
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)

  const stats = [
    { label: 'Active IVR Flows', value: flows.filter(f => f.status === 'active').length.toString(), icon: '📞', color: 'bg-blue-500' },
    { label: 'Total Calls Today', value: '2,526', icon: '📊', color: 'bg-green-500' },
    { label: 'Avg Response Time', value: '2.3s', icon: '⚡', color: 'bg-purple-500' },
    { label: 'Success Rate', value: '94%', icon: '✅', color: 'bg-orange-500' },
  ]

  const sampleFlow: IVRNode[] = [
    {
      id: 'welcome',
      type: 'message',
      label: 'Welcome Message',
      prompt: 'Thank you for calling CallMaker24. Please listen to the following options.'
    },
    {
      id: 'main-menu',
      type: 'menu',
      label: 'Main Menu',
      prompt: 'Press 1 for Sales, Press 2 for Support, Press 3 for Billing, or Press 0 for Operator',
      options: [
        { key: '1', action: 'Forward to Sales', nextNode: 'sales' },
        { key: '2', action: 'Forward to Support', nextNode: 'support' },
        { key: '3', action: 'Forward to Billing', nextNode: 'billing' },
        { key: '0', action: 'Forward to Operator', nextNode: 'operator' },
      ]
    },
    {
      id: 'sales',
      type: 'forward',
      label: 'Sales Department',
      prompt: 'Connecting you to our sales team...'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IVR System</h1>
          <p className="text-gray-600 mt-1">Create and manage interactive voice response flows</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          + Create Flow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* IVR Flows List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">IVR Flows</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flow Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nodes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls Handled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{flow.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{flow.nodes} nodes</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      flow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {flow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{flow.calls.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedFlow(flow.id)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Edit
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 mr-4">
                      Test
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flow Builder Preview */}
      {selectedFlow && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Flow Builder - {flows.find(f => f.id === selectedFlow)?.name}</h2>
            <button
              onClick={() => setSelectedFlow(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sampleFlow.map((node, index) => (
                <div key={node.id} className="relative">
                  {index > 0 && (
                    <div className="absolute left-8 -top-2 w-0.5 h-4 bg-gray-300"></div>
                  )}
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border-2 border-primary-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">
                            {node.type === 'message' && '💬'}
                            {node.type === 'menu' && '📋'}
                            {node.type === 'forward' && '📞'}
                            {node.type === 'voicemail' && '📮'}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{node.label}</h3>
                            <span className="text-xs text-gray-500 uppercase">{node.type}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3 ml-11">{node.prompt}</p>
                        {node.options && (
                          <div className="ml-11 space-y-2">
                            {node.options.map((option) => (
                              <div key={option.key} className="flex items-center space-x-2 text-sm">
                                <span className="bg-white px-2 py-1 rounded font-mono font-semibold">{option.key}</span>
                                <span className="text-gray-600">→</span>
                                <span className="text-gray-700">{option.action}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600 p-1">✏️</button>
                        <button className="text-gray-400 hover:text-red-600 p-1">🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-6 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition">
              + Add Node
            </button>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Test Flow
              </button>
              <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Most Used Flow</h3>
          <p className="text-xl font-bold text-gray-900">Main Reception</p>
          <p className="text-sm text-gray-500 mt-1">1,247 calls today</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Peak Call Time</h3>
          <p className="text-xl font-bold text-gray-900">2:00 PM - 3:00 PM</p>
          <p className="text-sm text-gray-500 mt-1">342 calls per hour</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Menu Depth</h3>
          <p className="text-xl font-bold text-gray-900">2.4 levels</p>
          <p className="text-sm text-gray-500 mt-1">4.2 seconds to resolve</p>
        </div>
      </div>
    </div>
  )
}
