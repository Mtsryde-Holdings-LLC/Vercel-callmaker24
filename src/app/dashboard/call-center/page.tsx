'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function CallCenterPage() {
  const { data: session } = useSession()
  const [companyCode, setCompanyCode] = useState('')
  const [callbacks, setCallbacks] = useState<any[]>([])
  const [voicemails, setVoicemails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [callbacksRes, voicemailsRes] = await Promise.all([
        fetch('/api/ivr/callback'),
        fetch('/api/ivr/voicemail')
      ])
      
      if (callbacksRes.ok) {
        const data = await callbacksRes.json()
        setCallbacks(data.data || [])
      }
      if (voicemailsRes.ok) {
        const data = await voicemailsRes.json()
        setVoicemails(data.data || [])
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

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Call Center & IVR</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Company Code Setup</h2>
        <p className="text-gray-600 mb-4">Set your unique 4-digit company code for IVR routing</p>
        <div className="flex gap-4">
          <input
            type="text"
            maxLength={4}
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value.replace(/\D/g, ''))}
            className="px-4 py-2 border rounded-lg"
            placeholder="1234"
          />
          <button onClick={saveCompanyCode} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Code
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">📞 IVR Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Set your unique 4-digit company code above</li>
          <li>Configure your Twilio phone number webhook to: <code className="bg-white px-2 py-1 rounded">https://callmaker24.com/api/ivr/incoming</code></li>
          <li>Callers will be prompted to enter your company code</li>
          <li>System will route to your organization's menu</li>
        </ol>
      </div>
    </div>
  )
}
