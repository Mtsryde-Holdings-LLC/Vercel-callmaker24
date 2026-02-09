'use client'

import { useState, useEffect } from 'react'

export default function IVRTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'APPOINTMENT',
    script: '',
    variables: []
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/ivr/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaults = async () => {
    try {
      const res = await fetch('/api/ivr/templates/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        alert('✅ Default templates created!')
        fetchTemplates()
      }
    } catch (error) {
      alert('❌ Failed to create templates')
    }
  }

  const createTemplate = async () => {
    try {
      const url = editingId ? `/api/ivr/templates/${editingId}` : '/api/ivr/templates'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        alert(editingId ? '✅ Template updated!' : '✅ Template created!')
        setShowCreate(false)
        setEditingId(null)
        fetchTemplates()
      }
    } catch (error) {
      alert('❌ Failed to save template')
    }
  }

  const editTemplate = (template: any) => {
    setFormData({
      name: template.name,
      type: template.type,
      script: template.script,
      variables: template.variables || []
    })
    setEditingId(template.id)
    setShowCreate(true)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    try {
      const res = await fetch(`/api/ivr/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('✅ Template deleted!')
        fetchTemplates()
      }
    } catch (error) {
      alert('❌ Failed to delete template')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">IVR Templates</h1>
        <div className="flex gap-3">
          {templates.length === 0 && (
            <button onClick={initializeDefaults} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Initialize Default Templates
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Create Template
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Create'} IVR Template</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="APPOINTMENT">Appointment Reminder</option>
                <option value="SURVEY">Survey</option>
                <option value="PROMOTION">Promotion</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Script</label>
              <textarea
                value={formData.script}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Use {{variableName}} for dynamic content"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={createTemplate} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create
              </button>
              <button onClick={() => { setShowCreate(false); setEditingId(null) }} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{template.name}</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {template.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.script}</p>
            <div className="flex gap-2">
              <button onClick={() => setPreviewId(template.id)} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Preview
              </button>
              <button onClick={() => editTemplate(template)} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                Edit
              </button>
              <button onClick={() => deleteTemplate(template.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showCreate && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No templates yet. Initialize defaults or create your own.</p>
        </div>
      )}

      {previewId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPreviewId(null)}>
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Template Preview</h2>
            {templates.find(t => t.id === previewId) && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg font-semibold">{templates.find(t => t.id === previewId)?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900">{templates.find(t => t.id === previewId)?.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Script</label>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{templates.find(t => t.id === previewId)?.script}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Variables</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(templates.find(t => t.id === previewId)?.variables || []).map((v: string) => (
                      <span key={v} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setPreviewId(null)} className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
