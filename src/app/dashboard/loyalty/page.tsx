'use client'

import { useState, useEffect } from 'react'

export default function LoyaltyPage() {
  const [tiers, setTiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/loyalty/tiers')
      if (res.ok) {
        const data = await res.json()
        setTiers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTier = async (tier: any) => {
    try {
      const res = await fetch('/api/loyalty/tiers', {
        method: tier.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tier)
      })
      if (res.ok) {
        fetchTiers()
        setEditing(null)
      }
    } catch (error) {
      console.error('Failed to save tier:', error)
    }
  }

  const defaultTiers = [
    { tier: 'BRONZE', name: 'Bronze', minPoints: 0, pointsPerDollar: 1, benefits: ['1 point per $1 spent'] },
    { tier: 'SILVER', name: 'Silver', minPoints: 500, pointsPerDollar: 1.5, benefits: ['1.5 points per $1 spent', '5% discount'] },
    { tier: 'GOLD', name: 'Gold', minPoints: 1500, pointsPerDollar: 2, benefits: ['2 points per $1 spent', '10% discount', 'Free shipping'] },
    { tier: 'PLATINUM', name: 'Platinum', minPoints: 3000, pointsPerDollar: 2.5, benefits: ['2.5 points per $1 spent', '15% discount', 'Free shipping', 'Priority support'] },
    { tier: 'DIAMOND', name: 'Diamond', minPoints: 5000, pointsPerDollar: 3, benefits: ['3 points per $1 spent', '20% discount', 'Free shipping', 'Priority support', 'Exclusive access'] }
  ]

  const initializeTiers = async () => {
    for (const tier of defaultTiers) {
      await saveTier(tier)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Loyalty Rewards Management</h1>
        {tiers.length === 0 && (
          <button onClick={initializeTiers} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Initialize Default Tiers
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {(tiers.length > 0 ? tiers : defaultTiers).map((tier) => (
          <div key={tier.tier} className="bg-white rounded-lg shadow-lg p-6">
            {editing === tier.tier ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => setTiers(tiers.map(t => t.tier === tier.tier ? { ...t, name: e.target.value } : t))}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Tier Name"
                />
                <input
                  type="number"
                  value={tier.minPoints}
                  onChange={(e) => setTiers(tiers.map(t => t.tier === tier.tier ? { ...t, minPoints: parseInt(e.target.value) } : t))}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Minimum Points"
                />
                <input
                  type="number"
                  step="0.1"
                  value={tier.pointsPerDollar}
                  onChange={(e) => setTiers(tiers.map(t => t.tier === tier.tier ? { ...t, pointsPerDollar: parseFloat(e.target.value) } : t))}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Points per Dollar"
                />
                <div className="flex gap-2">
                  <button onClick={() => { saveTier(tier); setEditing(null) }} className="px-4 py-2 bg-green-600 text-white rounded-lg">Save</button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-600 text-white rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{tier.name}</h2>
                    <p className="text-gray-600">{tier.tier}</p>
                  </div>
                  <button onClick={() => setEditing(tier.tier)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Minimum Points</p>
                    <p className="text-xl font-bold">{tier.minPoints}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Points per Dollar</p>
                    <p className="text-xl font-bold">{tier.pointsPerDollar}x</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">Benefits:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {(tier.benefits || []).map((benefit: string, i: number) => (
                      <li key={i} className="text-gray-700">{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
