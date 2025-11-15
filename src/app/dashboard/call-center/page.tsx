'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CallCenterPage() {
  const [activeTab, setActiveTab] = useState('dialer')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'active' | 'ended'>('idle')
  const [callDuration, setCallDuration] = useState(0)

  const handleCall = () => {
    if (!phoneNumber) return
    setCallStatus('calling')
    setTimeout(() => setCallStatus('active'), 2000)
  }

  const handleEndCall = () => {
    setCallStatus('ended')
    setTimeout(() => {
      setCallStatus('idle')
      setPhoneNumber('')
      setCallDuration(0)
    }, 2000)
  }

  const recentCalls = [
    { id: 1, number: '+1 (555) 123-4567', name: 'John Doe', duration: '5:23', status: 'completed', time: '10 mins ago' },
    { id: 2, number: '+1 (555) 234-5678', name: 'Jane Smith', duration: '3:45', status: 'completed', time: '25 mins ago' },
    { id: 3, number: '+1 (555) 345-6789', name: 'Bob Johnson', duration: '0:12', status: 'missed', time: '1 hour ago' },
    { id: 4, number: '+1 (555) 456-7890', name: 'Alice Brown', duration: '8:56', status: 'completed', time: '2 hours ago' },
  ]

  const stats = [
    { label: 'Total Calls Today', value: '147', icon: '📞', color: 'bg-blue-500' },
    { label: 'Active Calls', value: '5', icon: '🔴', color: 'bg-green-500' },
    { label: 'Average Duration', value: '4:32', icon: '⏱️', color: 'bg-purple-500' },
    { label: 'Success Rate', value: '87%', icon: '✅', color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Call Center</h1>
        <p className="text-gray-600 mt-1">Make and manage customer calls</p>
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dialer')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dialer'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📱 Dialer
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recent'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Recent Calls
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'queue'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⏳ Call Queue
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Dialer Tab */}
          {activeTab === 'dialer' && (
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 shadow-lg">
                <div className="mb-6">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 text-2xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPhoneNumber(phoneNumber + num)}
                      className="bg-white hover:bg-gray-50 text-2xl font-semibold py-4 rounded-lg shadow-md transition"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Call Status */}
                {callStatus !== 'idle' && (
                  <div className="mb-6 text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                      callStatus === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                      callStatus === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {callStatus === 'calling' && '📞 Calling...'}
                      {callStatus === 'active' && `🔴 Active Call - ${callDuration}s`}
                      {callStatus === 'ended' && '✅ Call Ended'}
                    </div>
                  </div>
                )}

                {/* Call Controls */}
                <div className="flex items-center justify-center space-x-4">
                  {callStatus === 'idle' && (
                    <button
                      onClick={handleCall}
                      disabled={!phoneNumber}
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      📞 Call
                    </button>
                  )}
                  {(callStatus === 'calling' || callStatus === 'active') && (
                    <button
                      onClick={handleEndCall}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full text-xl font-semibold shadow-lg transition"
                    >
                      📵 End Call
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Calls Tab */}
          {activeTab === 'recent' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{call.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{call.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{call.duration}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{call.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-primary-600 hover:text-primary-900 mr-4">
                          Call Back
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Queue</h3>
              <p className="text-gray-600 mb-6">No calls in queue</p>
              <Link
                href="/dashboard/crm"
                className="text-primary-600 hover:text-primary-700"
              >
                Add contacts to call queue
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
