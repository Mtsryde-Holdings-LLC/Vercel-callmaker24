'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Agent {
  id: string
  name: string
  status: 'Available' | 'On Call' | 'Break' | 'Offline'
  currentCall?: string
  callsToday: number
  avgHandleTime: string
}

interface CallRecord {
  id: string
  phoneNumber: string
  customerName: string
  startTime: string
  duration?: number
  status: 'active' | 'completed' | 'missed'
  agent?: string
  disposition?: string
}

interface IVRFlow {
  id: string
  name: string
  description: string
  isActive: boolean
  callsHandled: number
  lastModified: string
}

export default function CallCenterPage() {
  const { data: session } = useSession()
  const [activeView, setActiveView] = useState<'live' | 'ivr' | 'history' | 'analytics'>('live')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'active'>('idle')
  const [agentStatus, setAgentStatus] = useState<'Available' | 'Offline'>('Offline')
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([])
  const [ivrFlows, setIvrFlows] = useState<IVRFlow[]>([])
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null)

  // Mock data for demonstration
  const stats = [
    { label: 'Active Calls', value: '12', icon: '📞', color: 'from-blue-500 to-blue-600', change: '+3' },
    { label: 'Agents Online', value: '8/15', icon: '👥', color: 'from-green-500 to-green-600', change: '+2' },
    { label: 'Avg Wait Time', value: '1:24', icon: '⏱️', color: 'from-purple-500 to-purple-600', change: '-12s' },
    { label: 'Calls Today', value: '247', icon: '📊', color: 'from-orange-500 to-orange-600', change: '+18%' },
  ]

  const agents: Agent[] = [
    { id: '1', name: 'John Smith', status: 'On Call', currentCall: '+1234567890', callsToday: 23, avgHandleTime: '4:32' },
    { id: '2', name: 'Sarah Johnson', status: 'Available', callsToday: 18, avgHandleTime: '3:45' },
    { id: '3', name: 'Mike Davis', status: 'Break', callsToday: 15, avgHandleTime: '5:12' },
    { id: '4', name: 'Emily Brown', status: 'Available', callsToday: 21, avgHandleTime: '4:05' },
  ]

  useEffect(() => {
    fetchRecentCalls()
    fetchIVRFlows()
  }, [])

  const fetchRecentCalls = async () => {
    try {
      const response = await fetch('/api/call-center/calls')
      if (response.ok) {
        const data = await response.json()
        setRecentCalls(data)
      }
    } catch (error) {
      // Use mock data on error
      setRecentCalls([
        { id: '1', phoneNumber: '+1234567890', customerName: 'John Doe', startTime: '2 mins ago', duration: 345, status: 'completed', agent: 'John Smith', disposition: 'Resolved' },
        { id: '2', phoneNumber: '+1987654321', customerName: 'Jane Smith', startTime: '5 mins ago', duration: 189, status: 'completed', agent: 'Sarah Johnson', disposition: 'Follow-up' },
        { id: '3', phoneNumber: '+1555123456', customerName: 'Bob Wilson', startTime: '10 mins ago', status: 'missed' },
      ])
    }
  }

  const fetchIVRFlows = async () => {
    try {
      const response = await fetch('/api/ivr/flows')
      if (response.ok) {
        const data = await response.json()
        setIvrFlows(data)
      }
    } catch (error) {
      // Use mock data on error
      setIvrFlows([
        { id: '1', name: 'Main Reception', description: 'Primary customer greeting and routing', isActive: true, callsHandled: 1247, lastModified: '2 days ago' },
        { id: '2', name: 'Sales Department', description: 'Sales inquiry routing with lead capture', isActive: true, callsHandled: 856, lastModified: '1 week ago' },
        { id: '3', name: 'Support Line', description: 'Technical support IVR with ticket creation', isActive: false, callsHandled: 423, lastModified: '3 weeks ago' },
      ])
    }
  }

  const handleMakeCall = async () => {
    if (!phoneNumber) return
    setCallStatus('calling')
    
    try {
      const response = await fetch('/api/call-center/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      
      if (response.ok) {
        setTimeout(() => {
          setCallStatus('active')
          setAgentStatus('Available')
        }, 2000)
      }
    } catch (error) {
      console.error('Call failed:', error)
      setCallStatus('idle')
    }
  }

  const handleEndCall = () => {
    setCallStatus('idle')
    setPhoneNumber('')
    setShowCallDialog(false)
    fetchRecentCalls()
  }

  const getStatusBadge = (status: Agent['status']) => {
    const badges = {
      'Available': 'bg-green-100 text-green-700 border-green-200',
      'On Call': 'bg-blue-100 text-blue-700 border-blue-200',
      'Break': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Offline': 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return badges[status]
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call Center</h1>
            <p className="text-gray-600 mt-1">Manage calls, IVR flows, and agent performance</p>
          </div>
          <button
            onClick={() => setShowCallDialog(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <span className="text-xl">📞</span>
            <span className="font-semibold">Make Call</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mt-6 border-b border-gray-200">
          {[
            { id: 'live', label: 'Live Dashboard', icon: '🔴' },
            { id: 'ivr', label: 'IVR Flows', icon: '🔀' },
            { id: 'history', label: 'Call History', icon: '📋' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeView === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                {stat.icon}
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Dashboard View */}
        {activeView === 'live' && (
          <>
            {/* Agents Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Active Agents</h2>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-gray-600">Live</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{agent.name}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(agent.status)}`}>
                              {agent.status}
                            </span>
                            {agent.currentCall && (
                              <span className="text-xs text-gray-600">{agent.currentCall}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{agent.callsToday} calls</p>
                        <p className="text-xs text-gray-600">Avg: {agent.avgHandleTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Calls Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Calls</h2>
                <div className="space-y-4">
                  {recentCalls.map((call) => (
                    <div key={call.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{call.customerName || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{call.phoneNumber}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          call.status === 'completed' ? 'bg-green-100 text-green-700' :
                          call.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>⏱️ {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : 'N/A'}</p>
                        <p>👤 {call.agent || 'No agent'}</p>
                        {call.disposition && <p>📝 {call.disposition}</p>}
                        <p className="text-gray-500">{call.startTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* IVR Flows View */}
        {activeView === 'ivr' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">IVR Flows</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  + Create Flow
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ivrFlows.map((flow) => (
                  <div key={flow.id} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl">
                        🔀
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        flow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {flow.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{flow.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{flow.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>📞 {flow.callsHandled} calls</span>
                      <span>🕒 {flow.lastModified}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                      <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Call History View */}
        {activeView === 'history' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Call History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Agent</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Duration</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCalls.map((call) => (
                      <tr key={call.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-600">{call.startTime}</td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{call.customerName || 'Unknown'}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{call.phoneNumber}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{call.agent || 'N/A'}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            call.status === 'completed' ? 'bg-green-100 text-green-700' :
                            call.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Call Center Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Answer Rate</span>
                        <span className="font-semibold text-gray-900">94%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Customer Satisfaction</span>
                        <span className="font-semibold text-gray-900">4.7/5.0</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">First Call Resolution</span>
                        <span className="font-semibold text-gray-900">87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Call Volume Trends</h3>
                  <div className="h-48 flex items-end justify-between space-x-2">
                    {[65, 78, 45, 89, 72, 95, 85].map((height, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Make Call Dialog */}
      {showCallDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Make a Call</h3>
              <button onClick={() => setShowCallDialog(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            {callStatus === 'idle' && (
              <>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />
                <button
                  onClick={handleMakeCall}
                  disabled={!phoneNumber}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  📞 Call Now
                </button>
              </>
            )}

            {callStatus === 'calling' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl animate-pulse">📞</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Calling...</p>
                <p className="text-gray-600">{phoneNumber}</p>
              </div>
            )}

            {callStatus === 'active' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">✅</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Call Active</p>
                <p className="text-gray-600 mb-6">{phoneNumber}</p>
                <button
                  onClick={handleEndCall}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold"
                >
                  End Call
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
