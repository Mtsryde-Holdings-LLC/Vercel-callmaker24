'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  status: 'Available' | 'On Call' | 'After Call Work' | 'Offline' | 'Break'
  currentCall?: string
  callsToday: number
  avgHandleTime: string
}

interface QueueMetrics {
  queueName: string
  callsInQueue: number
  longestWait: string
  avgWait: string
  serviceLevel: number
}

interface CallRecord {
  id: string
  contactId: string
  phoneNumber: string
  customerName: string
  startTime: string
  duration?: number
  status: 'active' | 'completed' | 'abandoned' | 'missed'
  agent?: string
  queue: string
  disposition?: string
  recording?: string
}

export default function CallCenterPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'active' | 'ended'>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [awsConnectStatus, setAwsConnectStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [agentStatus, setAgentStatus] = useState<'Available' | 'Offline' | 'On Call' | 'After Call Work' | 'Break'>('Offline')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [showAgentPanel, setShowAgentPanel] = useState(false)
  const [callNotes, setCallNotes] = useState('')
  const [callDisposition, setCallDisposition] = useState('')

  useEffect(() => {
    // Simulate AWS Connect initialization
    if (agentStatus === 'Available') {
      setAwsConnectStatus('connecting')
      setTimeout(() => setAwsConnectStatus('connected'), 1500)
    }
  }, [agentStatus])

  const handleConnectToAWS = async () => {
    setAwsConnectStatus('connecting')
    try {
      // In production, initialize AWS Connect CCP
      // const response = await fetch('/api/call-center/aws-connect/init', { method: 'POST' })
      setTimeout(() => {
        setAwsConnectStatus('connected')
        setAgentStatus('Available')
      }, 1500)
    } catch (error) {
      console.error('Failed to connect to AWS Connect:', error)
      setAwsConnectStatus('disconnected')
    }
  }

  const handleCall = async () => {
    if (!phoneNumber) return
    setCallStatus('calling')
    
    try {
      // In production, make call via AWS Connect
      const response = await fetch('/api/call-center/aws-connect/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      
      if (response.ok) {
        setTimeout(() => {
          setCallStatus('active')
          setAgentStatus('On Call')
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to initiate call:', error)
      setCallStatus('idle')
    }
  }

  const handleEndCall = async () => {
    setCallStatus('ended')
    setAgentStatus('Available')
    
    try {
      // In production, end call via AWS Connect
      await fetch('/api/call-center/aws-connect/end-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: 'current_call' })
      })
    } catch (error) {
      console.error('Failed to end call:', error)
    }
    
    setTimeout(() => {
      setCallStatus('idle')
      setPhoneNumber('')
      setCallDuration(0)
    }, 2000)
  }

  const agents: Agent[] = [
    { id: '1', name: 'Sarah Johnson', status: 'Available', callsToday: 24, avgHandleTime: '4:32' },
    { id: '2', name: 'Mike Chen', status: 'On Call', currentCall: '+1 (555) 123-4567', callsToday: 31, avgHandleTime: '3:45' },
    { id: '3', name: 'Emma Davis', status: 'After Call Work', callsToday: 28, avgHandleTime: '5:12' },
    { id: '4', name: 'James Wilson', status: 'Available', callsToday: 19, avgHandleTime: '6:03' },
    { id: '5', name: 'Lisa Anderson', status: 'Break', callsToday: 22, avgHandleTime: '4:18' },
    { id: '6', name: 'David Martinez', status: 'On Call', currentCall: '+1 (555) 987-6543', callsToday: 27, avgHandleTime: '3:56' },
  ]

  const queues: QueueMetrics[] = [
    { queueName: 'Sales Queue', callsInQueue: 3, longestWait: '2:45', avgWait: '1:23', serviceLevel: 87 },
    { queueName: 'Support Queue', callsInQueue: 7, longestWait: '4:12', avgWait: '2:18', serviceLevel: 72 },
    { queueName: 'Billing Queue', callsInQueue: 1, longestWait: '0:34', avgWait: '0:45', serviceLevel: 95 },
  ]

  const callRecords: CallRecord[] = [
    { id: '1', contactId: 'contact_123', phoneNumber: '+1 (555) 123-4567', customerName: 'John Doe', startTime: '10 mins ago', duration: 323, status: 'completed', agent: 'Sarah Johnson', queue: 'Sales', disposition: 'Sale Made', recording: '/recordings/call_123.mp3' },
    { id: '2', contactId: 'contact_124', phoneNumber: '+1 (555) 234-5678', customerName: 'Jane Smith', startTime: '25 mins ago', duration: 225, status: 'completed', agent: 'Mike Chen', queue: 'Support', disposition: 'Issue Resolved' },
    { id: '3', contactId: 'contact_125', phoneNumber: '+1 (555) 345-6789', customerName: 'Bob Johnson', startTime: '1 hour ago', status: 'abandoned', queue: 'Sales' },
    { id: '4', contactId: 'contact_126', phoneNumber: '+1 (555) 456-7890', customerName: 'Alice Brown', startTime: 'Active', status: 'active', agent: 'Mike Chen', queue: 'Sales' },
  ]

  const stats = [
    { label: 'Total Calls Today', value: '147', icon: '📞', color: 'bg-blue-500', trend: '+12%' },
    { label: 'Active Agents', value: agents.filter(a => a.status === 'Available' || a.status === 'On Call').length.toString() + '/' + agents.length, icon: '👥', color: 'bg-green-500', trend: '75%' },
    { label: 'Calls in Queue', value: queues.reduce((sum, q) => sum + q.callsInQueue, 0).toString(), icon: '⏳', color: 'bg-orange-500', trend: '-3' },
    { label: 'Avg Handle Time', value: '4:32', icon: '⏱️', color: 'bg-purple-500', trend: '-8%' },
    { label: 'Service Level', value: '84%', icon: '🎯', color: 'bg-blue-500', trend: '+5%' },
    { label: 'Abandoned Rate', value: '3.2%', icon: '📉', color: 'bg-red-500', trend: '-1.2%' },
  ]

  const handleAgentStatusChange = async (newStatus: Agent['status']) => {
    setAgentStatus(newStatus)
    try {
      await fetch('/api/call-center/aws-connect/agent-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (error) {
      console.error('Failed to update agent status:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Center</h1>
          <p className="text-gray-600 mt-1">Make and manage customer calls via AWS Connect</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              awsConnectStatus === 'connected' ? 'bg-green-500' :
              awsConnectStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              AWS Connect: {awsConnectStatus === 'connected' ? 'Connected' : awsConnectStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          {awsConnectStatus === 'disconnected' && (
            <button
              onClick={handleConnectToAWS}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Connect to AWS
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                stat.trend?.startsWith('+') ? 'bg-green-100 text-green-700' : 
                stat.trend?.startsWith('-') ? 'bg-red-100 text-red-700' : 
                'bg-gray-100 text-gray-700'
              }`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Softphone & Agent Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Softphone Widget */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Softphone</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={agentStatus}
                  onChange={(e) => handleAgentStatusChange(e.target.value as Agent['status'])}
                  disabled={awsConnectStatus !== 'connected'}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Available">Available</option>
                  <option value="On Call">On Call</option>
                  <option value="After Call Work">After Call Work</option>
                  <option value="Break">Break</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
            </div>

            {awsConnectStatus !== 'connected' && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-yellow-800 text-sm font-medium mb-2">⚠️ Connect to AWS Connect</p>
                <button
                  onClick={handleConnectToAWS}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Connect Now
                </button>
              </div>
            )}

            {/* Dialer */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                disabled={awsConnectStatus !== 'connected'}
                className="w-full px-3 py-2 text-lg text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed mb-3"
              />

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPhoneNumber(phoneNumber + num)}
                    disabled={awsConnectStatus !== 'connected'}
                    className="bg-white hover:bg-gray-50 text-lg font-semibold py-3 rounded-lg shadow transition disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Call Status */}
              {callStatus !== 'idle' && (
                <div className="mb-3 text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    callStatus === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                    callStatus === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {callStatus === 'calling' && '📞 Calling...'}
                    {callStatus === 'active' && `🔴 Active - ${callDuration}s`}
                    {callStatus === 'ended' && '✅ Call Ended'}
                  </div>
                </div>
              )}

              {/* Call Controls */}
              <div className="flex items-center justify-center space-x-2">
                {callStatus === 'idle' && (
                  <>
                    <button
                      onClick={handleCall}
                      disabled={!phoneNumber || awsConnectStatus !== 'connected'}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      📞 Call
                    </button>
                    <button
                      onClick={() => setPhoneNumber('')}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg"
                    >
                      ⌫
                    </button>
                  </>
                )}
                {(callStatus === 'calling' || callStatus === 'active') && (
                  <button
                    onClick={handleEndCall}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold shadow transition"
                  >
                    📵 End Call
                  </button>
                )}
              </div>
            </div>

            {/* Call Controls (Active Call) */}
            {callStatus === 'active' && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">🔇</div>
                    <div className="text-xs">Mute</div>
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">⏸️</div>
                    <div className="text-xs">Hold</div>
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">🔄</div>
                    <div className="text-xs">Transfer</div>
                  </button>
                </div>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Call notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />
                <select
                  value={callDisposition}
                  onChange={(e) => setCallDisposition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select disposition...</option>
                  <option value="Sale Made">Sale Made</option>
                  <option value="Follow Up Required">Follow Up Required</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Voicemail">Voicemail</option>
                </select>
              </div>
            )}
          </div>

          {/* Queue Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h3>
            <div className="space-y-3">
              {queues.map((queue) => (
                <div key={queue.queueName} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{queue.queueName}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      queue.serviceLevel >= 90 ? 'bg-green-100 text-green-700' :
                      queue.serviceLevel >= 75 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {queue.serviceLevel}% SL
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <div className="font-semibold text-gray-900">{queue.callsInQueue}</div>
                      <div>In Queue</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{queue.longestWait}</div>
                      <div>Longest</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{queue.avgWait}</div>
                      <div>Avg Wait</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Tabs Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <div className="flex space-x-6 px-6">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dashboard'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'agents'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  👥 Agents
                </button>
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'calls'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📞 Call History
                </button>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'monitoring'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  👁️ Real-time Monitor
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Real-time Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700">Calls Answered</span>
                        <span className="text-2xl">📞</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-900">124</div>
                      <div className="text-xs text-blue-600 mt-1">↑ 12% from yesterday</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700">Outbound Calls</span>
                        <span className="text-2xl">📱</span>
                      </div>
                      <div className="text-3xl font-bold text-green-900">89</div>
                      <div className="text-xs text-green-600 mt-1">↑ 8% from yesterday</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-orange-700">Avg Wait Time</span>
                        <span className="text-2xl">⏱️</span>
                      </div>
                      <div className="text-3xl font-bold text-orange-900">1:23</div>
                      <div className="text-xs text-orange-600 mt-1">↓ 15% improvement</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-purple-700">Satisfaction</span>
                        <span className="text-2xl">⭐</span>
                      </div>
                      <div className="text-3xl font-bold text-purple-900">4.7</div>
                      <div className="text-xs text-purple-600 mt-1">Out of 5.0 rating</div>
                    </div>
                  </div>

                  {/* Active Calls List */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Active Calls</h4>
                    <div className="space-y-2">
                      {callRecords.filter(c => c.status === 'active').map((call) => (
                        <div key={call.id} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                              <div className="font-medium text-gray-900">{call.customerName}</div>
                              <div className="text-sm text-gray-600">{call.phoneNumber} • {call.agent}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-700">Live</div>
                            <div className="text-xs text-gray-600">{call.queue}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Chart Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <h4 className="font-semibold text-gray-900 mb-2">Performance Analytics</h4>
                    <p className="text-sm text-gray-600">Real-time charts and metrics from AWS Connect</p>
                    <button className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                      View Detailed Analytics
                    </button>
                  </div>
                </div>
              )}

              {/* Agents Tab */}
              {activeTab === 'agents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Search agents..."
                      className="flex-1 mr-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <select className="px-4 py-2 border border-gray-300 rounded-lg">
                      <option>All Status</option>
                      <option>Available</option>
                      <option>On Call</option>
                      <option>Offline</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agents.map((agent) => (
                      <div key={agent.id} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{agent.name}</div>
                              <div className="text-xs text-gray-500">ID: {agent.id}</div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            agent.status === 'Available' ? 'bg-green-100 text-green-700' :
                            agent.status === 'On Call' ? 'bg-orange-100 text-orange-700' :
                            agent.status === 'After Call Work' ? 'bg-blue-100 text-blue-700' :
                            agent.status === 'Break' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        
                        {agent.currentCall && (
                          <div className="mb-3 bg-orange-50 border border-orange-200 rounded p-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span className="text-orange-700 font-medium">On call: {agent.currentCall}</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-600 text-xs">Calls Today</div>
                            <div className="font-bold text-gray-900">{agent.callsToday}</div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-600 text-xs">Avg Handle</div>
                            <div className="font-bold text-gray-900">{agent.avgHandleTime}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center space-x-2">
                          <button className="flex-1 text-xs py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                            View Details
                          </button>
                          <button className="flex-1 text-xs py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                            Monitor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call History Tab */}
              {activeTab === 'calls' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {callRecords.map((call) => (
                        <tr key={call.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{call.customerName}</div>
                            {call.disposition && (
                              <div className="text-xs text-gray-500">{call.disposition}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{call.phoneNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{call.agent || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{call.queue}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              call.status === 'completed' ? 'bg-green-100 text-green-700' :
                              call.status === 'active' ? 'bg-orange-100 text-orange-700' :
                              call.status === 'abandoned' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {call.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{call.startTime}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button className="text-primary-600 hover:text-primary-900 mr-3">View</button>
                            {call.recording && (
                              <button className="text-blue-600 hover:text-blue-900">🎧 Play</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Real-time Monitoring Tab */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  {/* Real-time Wall Board */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white">
                    <h3 className="text-lg font-semibold mb-4">📺 Real-time Wallboard</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-1">12</div>
                        <div className="text-sm text-gray-300">Agents Online</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-1 text-green-400">6</div>
                        <div className="text-sm text-gray-300">Available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-1 text-orange-400">3</div>
                        <div className="text-sm text-gray-300">On Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-1 text-red-400">11</div>
                        <div className="text-sm text-gray-300">In Queue</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Agent Activity */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Live Agent Activity</h4>
                    <div className="space-y-2">
                      {agents.filter(a => a.status === 'On Call').map((agent) => (
                        <div key={agent.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <div>
                                <div className="font-medium text-gray-900">{agent.name}</div>
                                <div className="text-sm text-gray-600">Talking to {agent.currentCall}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-sm text-blue-600 hover:text-blue-700">👁️ Monitor</button>
                              <button className="text-sm text-green-600 hover:text-green-700">🎧 Listen</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Queue Monitoring */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Queue Activity</h4>
                    {queues.map((queue) => (
                      <div key={queue.queueName} className="mb-4 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900">{queue.queueName}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            queue.callsInQueue === 0 ? 'bg-green-100 text-green-700' :
                            queue.callsInQueue < 5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {queue.callsInQueue} waiting
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              queue.serviceLevel >= 90 ? 'bg-green-500' :
                              queue.serviceLevel >= 75 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${queue.serviceLevel}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                          <span>Service Level: {queue.serviceLevel}%</span>
                          <span>Longest wait: {queue.longestWait}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Supervisor Actions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">🎯 Supervisor Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        📢 Broadcast Message
                      </button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                        🔄 Force Agent Status
                      </button>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                        📊 Export Reports
                      </button>
                      <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                        ⚙️ Queue Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
