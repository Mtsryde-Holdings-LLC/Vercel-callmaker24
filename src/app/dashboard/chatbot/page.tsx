'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

interface Intent {
  id: string
  name: string
  examples: string[]
  response: string
  confidence: number
}

export default function ChatbotPage() {
  const { backgroundColor } = useTheme()
  const [activeTab, setActiveTab] = useState<'test' | 'intents' | 'settings'>('test')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you today?', sender: 'bot', timestamp: new Date().toISOString() }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const intents: Intent[] = [
    {
      id: '1',
      name: 'Greeting',
      examples: ['hello', 'hi', 'hey', 'good morning'],
      response: 'Hello! How can I help you today?',
      confidence: 0.95
    },
    {
      id: '2',
      name: 'Pricing Question',
      examples: ['how much', 'pricing', 'cost', 'price plans'],
      response: 'Our pricing starts at $29/month for the basic plan. Would you like to see all our plans?',
      confidence: 0.92
    },
    {
      id: '3',
      name: 'Support Request',
      examples: ['help', 'support', 'issue', 'problem'],
      response: "I'm here to help! Can you describe the issue you're experiencing?",
      confidence: 0.88
    },
    {
      id: '4',
      name: 'Feature Inquiry',
      examples: ['features', 'what can you do', 'capabilities'],
      response: 'CallMaker24 offers email campaigns, SMS marketing, call center tools, IVR systems, and more!',
      confidence: 0.90
    }
  ]

  const stats = [
    { label: 'Conversations Today', value: '1,234', icon: '💬', color: 'bg-blue-500' },
    { label: 'Active Intents', value: intents.length.toString(), icon: '🎯', color: 'bg-green-500' },
    { label: 'Avg Confidence', value: '91%', icon: '📊', color: 'bg-purple-500' },
    { label: 'Response Rate', value: '98%', icon: '⚡', color: 'bg-orange-500' },
  ]

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages([...messages, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'm a demo bot. In production, I'd use AI to understand your request and provide helpful responses.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="space-y-6" style={{backgroundColor}}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chatbot</h1>
          <p className="text-gray-600 mt-1">AI-powered customer support assistant</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/chatbot/embed"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            🌐 Embed Widget
          </Link>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            + Create Intent
          </button>
        </div>
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
              onClick={() => setActiveTab('test')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💬 Test Chatbot
            </button>
            <button
              onClick={() => setActiveTab('intents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'intents'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎯 Manage Intents
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Test Chatbot Tab */}
          {activeTab === 'test' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl shadow-lg overflow-hidden">
                {/* Chat Header */}
                <div className="bg-primary-600 text-white px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-semibold">CallMaker24 Assistant</h3>
                      <p className="text-sm text-primary-100">Online</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-96 overflow-y-auto p-6 space-y-4 bg-white">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-primary-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Intents Tab */}
          {activeTab === 'intents' && (
            <div className="space-y-4">
              {intents.map((intent) => (
                <div key={intent.id} className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{intent.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${intent.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{(intent.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-700 p-2">✏️</button>
                      <button className="text-red-600 hover:text-red-700 p-2">🗑️</button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Training Examples:</h4>
                    <div className="flex flex-wrap gap-2">
                      {intent.examples.map((example, idx) => (
                        <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200">
                          "{example}"
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                    <p className="bg-white p-3 rounded-lg text-gray-800 text-sm border border-gray-200">
                      {intent.response}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chatbot Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chatbot Name</label>
                    <input
                      type="text"
                      defaultValue="CallMaker24 Assistant"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                    <textarea
                      rows={3}
                      defaultValue="Hello! How can I help you today?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                      <option>GPT-4 Turbo</option>
                      <option>GPT-3.5 Turbo</option>
                      <option>Custom Model</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-700">Enable fallback to human agent</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-700">Collect user feedback after conversation</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Widget Embed Code</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`<script src="https://callmaker24.com/widget.js"></script>
<script>
  CallMaker24.init({
    apiKey: 'your-api-key',
    position: 'bottom-right'
  });
</script>`}</pre>
                </div>
                <button className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Copy to Clipboard
                </button>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
