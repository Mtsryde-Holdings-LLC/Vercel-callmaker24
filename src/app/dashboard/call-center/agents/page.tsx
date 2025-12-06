'use client'

import { useState, useEffect } from 'react'

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const callsRes = await fetch('/api/voice/calls?status=IN_PROGRESS')
      if (callsRes.ok) setCalls(await callsRes.json())
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Live Agents</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Active Calls ({calls.length})</h2>
        <div className="space-y-3">
          {calls.map((call) => (
            <div key={call.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium">{call.from}</div>
                <div className="text-sm text-gray-600">{call.direction}</div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(call.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {calls.length === 0 && (
            <p className="text-gray-500 text-center py-4">No active calls</p>
          )}
        </div>
      </div>
    </div>
  )
}
