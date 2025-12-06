'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function CallCenterPage() {
  const { data: session } = useSession()
  const [companyCode, setCompanyCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agentNumber, setAgentNumber] = useState('')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [callbacks, setCallbacks] = useState<any[]>([])
  const [voicemails, setVoicemails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [showDialer, setShowDialer] = useState(false)
  const [dialNumber, setDialNumber] = useState('')
  const [dialing, setDialing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [callbacksRes, voicemailsRes, orgRes] = await Promise.all([
        fetch('/api/ivr/callback'),
        fetch('/api/ivr/voicemail'),
        fetch('/api/organization')
      ])
      
      if (callbacksRes.ok) {
        const data = await callbacksRes.json()
        setCallbacks(data.data || [])
      }
      if (voicemailsRes.ok) {
        const data = await voicemailsRes.json()
        setVoicemails(data.data || [])
      }
      if (orgRes.ok) {
        const org = await orgRes.json()
        setPhoneNumber(org.twilioPhoneNumber || '')
        setAgentNumber(org.agentContactNumber || '')
        setAiEnabled(org.ivrConfig?.aiEnabled ?? true)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCompanyCode = async () => {
    try {
      const res = await fetch('/api/organization/company-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyCode })
      })
      if (res.ok) {
        alert('Company code saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save company code:', error)
    }
  }

  const purchaseNumber = async () => {
    setPurchasing(true)
    try {
      const res = await fetch('/api/organization/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purchase' })
      })
      const data = await res.json()
      if (res.ok) {
        setPhoneNumber(data.phoneNumber)
        alert(`✅ Number purchased: ${data.phoneNumber}`)
      } else {
        alert(`❌ Error: ${data.error || 'Failed to purchase number'}`)
      }
    } catch (error) {
      console.error('Failed to purchase number:', error)
      alert('❌ Network error. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  const releaseNumber = async () => {
    if (!confirm('Release this phone number?')) return
    try {
      const res = await fetch('/api/organization/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release' })
      })
      if (res.ok) {
        setPhoneNumber('')
        alert('Number released successfully')
      }
    } catch (error) {
      console.error('Failed to release number:', error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CallMaker24 AI Call Support Center</h1>
        <div className="flex gap-3">
          <a href="/dashboard/call-center/templates" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            📝 Templates
          </a>
          <a href="/dashboard/call-center/campaigns" className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
            📢 Campaigns
          </a>
          <a href="/dashboard/call-center/agents" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            👥 Live Agents
          </a>
          <button onClick={() => setShowDialer(!showDialer)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            📞 Dialer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">📞 Dedicated Phone Number</h2>
          {phoneNumber ? (
          <div>
            <p className="text-gray-600 mb-2">Your call center number:</p>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-green-600">{phoneNumber}</div>
              <button onClick={releaseNumber} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Release Number
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Customers can call this number directly. No company code needed.</p>
            
            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent Contact Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={agentNumber}
                  onChange={(e) => setAgentNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/organization', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ agentContactNumber: agentNumber })
                      })
                      if (res.ok) alert('✅ Saved')
                      else alert('❌ Failed')
                    } catch (error) {
                      alert('❌ Error')
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Calls forwarded to this number</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">Purchase a dedicated phone number for your call center</p>
            <button 
              onClick={purchaseNumber} 
              disabled={purchasing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {purchasing ? 'Purchasing...' : 'Purchase Phone Number ($1/month)'}
            </button>
          </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">🤖 AI Agent</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Pre-screening</p>
                <p className="text-sm text-gray-600">AI handles calls before transferring to agents</p>
              </div>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`px-4 py-2 rounded-lg font-medium ${aiEnabled ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}
              >
                {aiEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            {aiEnabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">✓ AI answers simple questions</p>
                <p className="text-sm text-green-800">✓ Transfers complex issues to agents</p>
                <p className="text-sm text-green-800">✓ Routes to correct department</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Pending Callbacks ({callbacks.filter(c => c.status === 'PENDING').length})</h2>
          <div className="space-y-3">
            {callbacks.filter(c => c.status === 'PENDING').slice(0, 5).map((cb) => (
              <div key={cb.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{cb.customerName || cb.customerPhone}</div>
                <div className="text-sm text-gray-600">{cb.department}</div>
                <div className="text-sm text-gray-500">{new Date(cb.scheduledFor).toLocaleString()}</div>
              </div>
            ))}
            {callbacks.filter(c => c.status === 'PENDING').length === 0 && (
              <p className="text-gray-500 text-sm">No pending callbacks</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">New Voicemails ({voicemails.filter(v => !v.listened).length})</h2>
          <div className="space-y-3">
            {voicemails.filter(v => !v.listened).slice(0, 5).map((vm) => (
              <div key={vm.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{vm.callerName || vm.callerPhone}</div>
                <div className="text-sm text-gray-600">{vm.department}</div>
                <div className="text-sm text-gray-500">{new Date(vm.createdAt).toLocaleString()}</div>
                <audio controls className="w-full mt-2">
                  <source src={vm.recordingUrl} type="audio/mpeg" />
                </audio>
              </div>
            ))}
            {voicemails.filter(v => !v.listened).length === 0 && (
              <p className="text-gray-500 text-sm">No new voicemails</p>
            )}
          </div>
        </div>
      </div>

      {showDialer && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">📞 Outbound Dialer</h2>
          <div className="flex gap-4">
            <input
              type="tel"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              placeholder="+1234567890"
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={async () => {
                setDialing(true)
                try {
                  const res = await fetch('/api/voice/dial', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: dialNumber })
                  })
                  if (res.ok) {
                    alert('✅ Calling ' + dialNumber)
                    setDialNumber('')
                  } else {
                    alert('❌ Failed to dial')
                  }
                } catch (error) {
                  alert('❌ Error dialing')
                } finally {
                  setDialing(false)
                }
              }}
              disabled={!dialNumber || dialing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {dialing ? 'Calling...' : 'Call'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">Calls from: {phoneNumber || 'No number configured'}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">📞 How It Works</h3>
        <ul className="list-disc list-inside space-y-2 text-blue-800">
          <li>Purchase a dedicated phone number for your organization</li>
          <li>Customers call your number directly - no company code needed</li>
          <li>IVR menu routes calls to Sales, Support, Billing, or Operator</li>
          <li>Make outbound calls using your dedicated number</li>
          <li>All calls and voicemails are isolated to your organization</li>
        </ul>
      </div>
    </div>
  )
}
