'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChatbotEmbedPage() {
  const [widgetSettings, setWidgetSettings] = useState({
    botName: 'Support Bot',
    welcomeMessage: 'Hello! How can I help you today?',
    primaryColor: '#667eea',
    position: 'bottom-right',
    triggerText: 'Chat with us',
    avatar: '🤖',
  });

  const [copied, setCopied] = useState(false);

  // Generate unique widget ID (in production, this would be from database)
  const widgetId = 'cm24_' + Math.random().toString(36).substr(2, 9);

  const embedCode = `<!-- CallMaker24 Chatbot Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['CallMaker24Widget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'cm24', '${window.location.origin}/widget/chatbot.js'));
  cm24('init', {
    widgetId: '${widgetId}',
    botName: '${widgetSettings.botName}',
    welcomeMessage: '${widgetSettings.welcomeMessage}',
    primaryColor: '${widgetSettings.primaryColor}',
    position: '${widgetSettings.position}',
    avatar: '${widgetSettings.avatar}'
  });
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettingChange = (key: string, value: string) => {
    setWidgetSettings({ ...widgetSettings, [key]: value });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Embed Chatbot</h1>
          <p className="text-gray-600 mt-1">Add a pop-up chatbot to your website</p>
        </div>
        <Link href="/dashboard/chatbot" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Widget Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={widgetSettings.botName}
                  onChange={(e) => handleSettingChange('botName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={widgetSettings.welcomeMessage}
                  onChange={(e) => handleSettingChange('welcomeMessage', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={widgetSettings.primaryColor}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={widgetSettings.primaryColor}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={widgetSettings.position}
                  onChange={(e) => handleSettingChange('position', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar (Emoji)
                </label>
                <input
                  type="text"
                  value={widgetSettings.avatar}
                  onChange={(e) => handleSettingChange('avatar', e.target.value)}
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="🤖"
                />
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Installation</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
                <span>Copy the embed code below</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
                <span>Paste it before the closing <code className="bg-gray-100 px-2 py-0.5 rounded">&lt;/body&gt;</code> tag of your website</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
                <span>The chatbot will automatically appear on your site!</span>
              </li>
            </ol>
          </div>

          {/* Embed Code */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Embed Code</h2>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                {copied ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
              <code>{embedCode}</code>
            </pre>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
            <div className="bg-gray-100 rounded-lg p-8 relative" style={{ minHeight: '500px' }}>
              <div className="text-center text-gray-500 mb-4">
                <p className="text-sm">This is how your website will look</p>
                <p className="text-xs mt-1">Chatbot appears in the corner ↓</p>
              </div>

              {/* Mock Website Content */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded shadow">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>

              {/* Chatbot Widget Preview */}
              <ChatbotWidget settings={widgetSettings} />
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Fully responsive and mobile-friendly</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Customizable colors and branding</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Minimized and expanded states</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">AI-powered responses</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">No page reload required</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Lightweight and fast loading</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chatbot Widget Preview Component
function ChatbotWidget({ settings }: { settings: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: settings.welcomeMessage, sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');

  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    setMessages([...messages, 
      { id: Date.now(), text: inputText, sender: 'user' },
      { id: Date.now() + 1, text: 'Thanks for your message! This is a preview of how the bot will respond.', sender: 'bot' }
    ]);
    setInputText('');
  };

  return (
    <div className={`fixed ${positionStyles[settings.position as keyof typeof positionStyles]} z-50`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl mb-4 w-80 sm:w-96 animate-fadeIn">
          {/* Header */}
          <div 
            className="rounded-t-lg p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{settings.avatar}</div>
              <div>
                <h3 className="font-semibold">{settings.botName}</h3>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[70%] p-3 rounded-lg text-sm ${
                    msg.sender === 'user' 
                      ? 'text-white' 
                      : 'bg-white text-gray-800 shadow'
                  }`}
                  style={msg.sender === 'user' ? { backgroundColor: settings.primaryColor } : {}}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <button
                onClick={handleSend}
                className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 px-6 py-4 font-medium"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <span className="text-2xl">{settings.avatar}</span>
          <span>Chat</span>
        </button>
      )}
    </div>
  );
}
