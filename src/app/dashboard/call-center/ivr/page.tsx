'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateIVRFlowPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    greeting: 'Thank you for calling.',
    options: [
      { digit: '1', label: 'Sales', action: 'dial', value: '' },
      { digit: '2', label: 'Support', action: 'dial', value: '' },
      { digit: '3', label: 'Billing', action: 'dial', value: '' },
      { digit: '0', label: 'Operator', action: 'dial', value: '' },
    ]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleOptionChange = (index: number, field: string, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setFormData({ ...formData, options: newOptions })
  }

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { digit: '', label: '', action: 'dial', value: '' }]
    })
  }

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ivr/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        setError('Failed to create IVR flow')
        setLoading(false)
        return
      }

      router.push('/dashboard/call-center?view=ivr')
    } catch (err) {
      setError('An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create IVR Flow</h1>
          <p className="text-gray-600 mt-1">Set up automated call routing</p>
        </div>
        <Link href="/dashboard/call-center" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flow Name *
            </label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Main Reception"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Primary customer greeting and routing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Greeting Message *
            </label>
            <textarea
              name="greeting"
              value={formData.greeting}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Thank you for calling. Press 1 for Sales..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Menu Options
              </label>
              <button
                type="button"
                onClick={addOption}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Option
              </button>
            </div>

            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    value={option.digit}
                    onChange={(e) => handleOptionChange(index, 'digit', e.target.value)}
                    placeholder="1"
                    maxLength={1}
                    className="w-16 px-3 py-2 border border-gray-300 rounded text-center"
                  />
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    placeholder="Sales"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  />
                  <select
                    value={option.action}
                    onChange={(e) => handleOptionChange(index, 'action', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="dial">Dial Number</option>
                    <option value="voicemail">Voicemail</option>
                    <option value="hangup">Hang Up</option>
                  </select>
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    placeholder="+1234567890"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/dashboard/call-center"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Flow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
