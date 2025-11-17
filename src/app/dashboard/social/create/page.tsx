'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
}

export default function CreateSocialPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'source' | 'generate' | 'preview'>('source');
  const [contentSource, setContentSource] = useState<'shopify' | 'upload' | 'manual'>('shopify');
  
  // Shopify integration
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyStore, setShopifyStore] = useState('');
  const [shopifyApiKey, setShopifyApiKey] = useState('');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  
  // Content generation
  const [generationType, setGenerationType] = useState<'image' | 'video' | 'carousel'>('image');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  
  // Manual upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Post details
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['FACEBOOK']);
  const [scheduleDate, setScheduleDate] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const platforms = [
    { id: 'FACEBOOK', name: 'Facebook', icon: '📘' },
    { id: 'INSTAGRAM', name: 'Instagram', icon: '📷' },
    { id: 'TWITTER', name: 'Twitter', icon: '🐦' },
    { id: 'LINKEDIN', name: 'LinkedIn', icon: '💼' },
    { id: 'TIKTOK', name: 'TikTok', icon: '🎵' },
  ];

  const connectShopify = async () => {
    try {
      const response = await fetch('/api/integrations/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: shopifyStore, apiKey: shopifyApiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setShopifyConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect Shopify:', error);
      alert('Failed to connect to Shopify. Please check your credentials.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const generateAIContent = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/social/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: generationType,
          product: selectedProduct,
          tone,
          targetAudience,
          customPrompt: aiPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data);
        setCaption(data.caption);
        setHashtags(data.hashtags || []);
        setStep('preview');
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    try {
      const postData = {
        content: caption,
        platforms: selectedPlatforms,
        scheduledFor: scheduleDate || undefined,
        hashtags: hashtags.join(' '),
        generatedContent: generatedContent || undefined,
      };

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        alert('Post created successfully!');
        router.push('/dashboard/social');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Social Media Post</h1>
          <p className="text-gray-600 mt-1">Generate AI-powered content from your products or upload your own</p>
        </div>
        <button onClick={() => router.back()} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          ← Back
        </button>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-2 ${step === 'source' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'source' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="font-medium">Content Source</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className={`flex items-center space-x-2 ${step === 'generate' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="font-medium">Generate/Upload</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <div className={`flex items-center space-x-2 ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
            <span className="font-medium">Preview &amp; Publish</span>
          </div>
        </div>
      </div>

      {/* Step 1: Content Source */}
      {step === 'source' && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Choose Content Source</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setContentSource('shopify')} className={`p-6 border-2 rounded-lg transition ${contentSource === 'shopify' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              <div className="text-4xl mb-3">🛍️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Shopify Store</h3>
              <p className="text-sm text-gray-600">Connect your e-commerce store and generate content from products</p>
            </button>

            <button onClick={() => setContentSource('upload')} className={`p-6 border-2 rounded-lg transition ${contentSource === 'upload' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              <div className="text-4xl mb-3">📤</div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload Content</h3>
              <p className="text-sm text-gray-600">Upload your own images, videos, or graphics</p>
            </button>

            <button onClick={() => setContentSource('manual')} className={`p-6 border-2 rounded-lg transition ${contentSource === 'manual' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              <div className="text-4xl mb-3">✍️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Manual Creation</h3>
              <p className="text-sm text-gray-600">Create text-only posts or use AI to generate captions</p>
            </button>
          </div>

          <button onClick={() => setStep('generate')} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Generate/Upload */}
      {step === 'generate' && (
        <div className="space-y-6">
          {/* Shopify Integration */}
          {contentSource === 'shopify' && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Connect Shopify Store</h2>

              {!shopifyConnected ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store URL</label>
                    <input type="text" value={shopifyStore} onChange={(e) => setShopifyStore(e.target.value)} placeholder="your-store.myshopify.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key / Access Token</label>
                    <input type="password" value={shopifyApiKey} onChange={(e) => setShopifyApiKey(e.target.value)} placeholder="shpat_xxxxxxxxxxxxx" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <button onClick={connectShopify} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium">
                    Connect Store
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span className="font-medium text-green-900">Connected to {shopifyStore}</span>
                    </div>
                    <button onClick={() => setShopifyConnected(false)} className="text-sm text-red-600 hover:text-red-700">Disconnect</button>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Select Product</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {products.map((product) => (
                        <div key={product.id} onClick={() => setSelectedProduct(product)} className={`p-4 border-2 rounded-lg cursor-pointer transition ${selectedProduct?.id === product.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                          <div className="flex space-x-4">
                            {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="w-20 h-20 object-cover rounded" />}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{product.title}</h4>
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                              <p className="text-sm font-semibold text-blue-600 mt-2">${product.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Content */}
          {contentSource === 'upload' && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Upload Your Content</h2>

              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <div className="text-5xl mb-4">📁</div>
                <p className="text-lg font-medium text-gray-900 mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-600">PNG, JPG, GIF, MP4, MOV up to 50MB</p>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{uploadedFiles.length} file(s) uploaded</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {uploadedFiles[idx].type.startsWith('video/') ? (
                          <video src={url} className="w-full h-32 object-cover rounded-lg" controls />
                        ) : (
                          <img src={url} alt={`Upload ${idx}`} className="w-full h-32 object-cover rounded-lg" />
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx));
                            setPreviewUrls(previewUrls.filter((_, i) => i !== idx));
                          }} 
                          className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Content Generation */}
          {(contentSource === 'shopify' || contentSource === 'manual') && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">AI Content Generation</h2>

              {contentSource === 'shopify' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['image', 'video', 'carousel'].map((type) => (
                      <button key={type} onClick={() => setGenerationType(type as any)} className={`p-4 border-2 rounded-lg transition ${generationType === type ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="text-2xl mb-1">{type === 'image' ? '🖼️' : type === 'video' ? '🎥' : '📱'}</div>
                        <div className="text-sm font-medium capitalize">{type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone &amp; Style</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual &amp; Friendly</option>
                  <option value="exciting">Exciting &amp; Energetic</option>
                  <option value="luxury">Luxury &amp; Premium</option>
                  <option value="humorous">Humorous</option>
                  <option value="informative">Informative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g., Young professionals, Tech enthusiasts" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Prompt (Optional)</label>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Add specific instructions..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <button onClick={generateAIContent} disabled={generating || (contentSource === 'shopify' && !selectedProduct)} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium disabled:opacity-50">
                {generating ? <span className="flex items-center justify-center"><span className="animate-spin mr-2">⚙️</span> Generating with AI...</span> : '✨ Generate Content with AI'}
              </button>
            </div>
          )}

          <div className="flex space-x-4">
            <button onClick={() => setStep('source')} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium">← Back</button>
            {contentSource === 'upload' && (
              <button onClick={() => setStep('preview')} disabled={uploadedFiles.length === 0} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">Continue →</button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Preview & Publish */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Preview &amp; Publish</h2>

            {generatedContent?.imageUrl && (
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <p className="text-sm font-medium text-blue-900 mb-2">✨ AI Generated Content</p>
                <img src={generatedContent.imageUrl} alt="Generated" className="w-full max-h-96 object-cover rounded-lg" />
              </div>
            )}

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((url, idx) => (
                  <div key={idx}>
                    {uploadedFiles[idx].type.startsWith('video/') ? (
                      <video src={url} className="w-full h-32 object-cover rounded-lg" controls />
                    ) : (
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-32 object-cover rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Write your caption..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center space-x-1">
                    <span>#{tag}</span>
                    <button onClick={() => setHashtags(hashtags.filter((_, i) => i !== idx))} className="text-blue-900 hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
              <input type="text" placeholder="Add hashtags (press Enter)" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  setHashtags([...hashtags, e.currentTarget.value.replace('#', '')]);
                  e.currentTarget.value = '';
                }
              }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Platforms</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {platforms.map((platform) => (
                  <button key={platform.id} onClick={() => setSelectedPlatforms(selectedPlatforms.includes(platform.id) ? selectedPlatforms.filter((p) => p !== platform.id) : [...selectedPlatforms, platform.id])} className={`p-4 border-2 rounded-lg transition ${selectedPlatforms.includes(platform.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <div className="text-2xl mb-1">{platform.icon}</div>
                    <div className="text-sm font-medium">{platform.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
              <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-500 mt-1">Leave empty to publish immediately</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button onClick={() => setStep('generate')} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium">← Back</button>
            <button onClick={handlePublish} disabled={!caption || selectedPlatforms.length === 0} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50">
              {scheduleDate ? '📅 Schedule Post' : '🚀 Publish Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
