'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  message: string;
  emoji: string;
  characterCount: number;
  tags: string[];
}

export default function SmsTemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const templates: SmsTemplate[] = [
    {
      id: 'flash-sale',
      name: 'Flash Sale Alert',
      category: 'promotional',
      description: 'Urgent limited-time offer',
      message: '⚡ FLASH SALE! Get {{discount}}% OFF everything for the next {{hours}} hours! Use code: {{code}} 🛍️ Shop now: {{link}}',
      emoji: '⚡',
      characterCount: 100,
      tags: ['urgent', 'discount', 'limited-time']
    },
    {
      id: 'new-arrival',
      name: 'New Arrival',
      category: 'promotional',
      description: 'Announce new products',
      message: '🎉 NEW ARRIVAL! {{product_name}} just dropped! Be the first to get yours 👉 {{link}}',
      emoji: '🎉',
      characterCount: 85,
      tags: ['new', 'product', 'announcement']
    },
    {
      id: 'abandoned-cart',
      name: 'Cart Reminder',
      category: 'transactional',
      description: 'Recover abandoned carts',
      message: '🛒 Oops! You left {{item_count}} item(s) behind. Complete your order now & get {{discount}}% off! {{link}}',
      emoji: '🛒',
      characterCount: 95,
      tags: ['cart', 'reminder', 'discount']
    },
    {
      id: 'order-shipped',
      name: 'Order Shipped',
      category: 'transactional',
      description: 'Shipping confirmation',
      message: '📦 Great news {{first_name}}! Your order #{{order_number}} is on its way! Track it here: {{tracking_link}}',
      emoji: '📦',
      characterCount: 95,
      tags: ['shipping', 'confirmation', 'tracking']
    },
    {
      id: 'appointment-reminder',
      name: 'Appointment Reminder',
      category: 'reminder',
      description: 'Upcoming appointment alert',
      message: '⏰ Reminder: Your appointment is tomorrow at {{time}}! Reply YES to confirm or call us at {{phone}} 📞',
      emoji: '⏰',
      characterCount: 105,
      tags: ['appointment', 'reminder', 'confirmation']
    },
    {
      id: 'birthday-special',
      name: 'Birthday Wish',
      category: 'seasonal',
      description: 'Birthday greeting with offer',
      message: '🎂 Happy Birthday {{first_name}}! 🎉 Here\'s {{discount}}% OFF as our gift to you! Valid for {{days}} days 🎁 {{link}}',
      emoji: '🎂',
      characterCount: 110,
      tags: ['birthday', 'special', 'discount']
    },
    {
      id: 'thank-you',
      name: 'Thank You',
      category: 'engagement',
      description: 'Show appreciation',
      message: '💙 Thank you for your purchase! We appreciate you! Here\'s {{reward_points}} bonus points for your next order 🎁',
      emoji: '💙',
      characterCount: 110,
      tags: ['thanks', 'loyalty', 'appreciation']
    },
    {
      id: 'vip-exclusive',
      name: 'VIP Exclusive',
      category: 'promotional',
      description: 'Exclusive VIP offer',
      message: '👑 VIP ONLY! Early access to our sale starts NOW! Get {{discount}}% off before everyone else 🔥 {{link}}',
      emoji: '👑',
      characterCount: 105,
      tags: ['vip', 'exclusive', 'early-access']
    },
    {
      id: 'winner-announcement',
      name: 'Contest Winner',
      category: 'engagement',
      description: 'Contest winner notification',
      message: '🎊 CONGRATULATIONS {{first_name}}! You\'re our winner! 🏆 Claim your prize: {{prize}} Reply NOW to collect! 🎉',
      emoji: '🎊',
      characterCount: 110,
      tags: ['winner', 'contest', 'prize']
    },
    {
      id: 'welcome',
      name: 'Welcome Message',
      category: 'onboarding',
      description: 'Welcome new subscribers',
      message: '👋 Welcome to {{company_name}}! Get {{discount}}% off your first order with code: {{code}} 🎁 Start shopping: {{link}}',
      emoji: '👋',
      characterCount: 115,
      tags: ['welcome', 'new-customer', 'discount']
    },
    {
      id: 'last-chance',
      name: 'Last Chance',
      category: 'promotional',
      description: 'Urgency-driven final notice',
      message: '⏳ LAST CHANCE! Sale ends in {{hours}} hours! Don\'t miss out on {{discount}}% OFF everything! 🏃 {{link}}',
      emoji: '⏳',
      characterCount: 105,
      tags: ['urgent', 'last-chance', 'fomo']
    },
    {
      id: 'event-reminder',
      name: 'Event Reminder',
      category: 'reminder',
      description: 'Upcoming event notification',
      message: '🎪 Don\'t forget! {{event_name}} is {{when}}! We saved your spot 🎟️ Details: {{link}} See you there! 🙌',
      emoji: '🎪',
      characterCount: 110,
      tags: ['event', 'reminder', 'rsvp']
    },
    {
      id: 'feedback-request',
      name: 'Feedback Request',
      category: 'engagement',
      description: 'Ask for customer review',
      message: '⭐ Hey {{first_name}}! How was your experience? Rate us in 30 seconds & get {{reward}} 🎁 {{survey_link}}',
      emoji: '⭐',
      characterCount: 110,
      tags: ['feedback', 'review', 'survey']
    },
    {
      id: 'back-in-stock',
      name: 'Back in Stock',
      category: 'promotional',
      description: 'Product availability alert',
      message: '🚨 BACK IN STOCK! {{product_name}} is available again! Grab yours before it\'s gone 🏃💨 {{link}}',
      emoji: '🚨',
      characterCount: 100,
      tags: ['restock', 'product', 'alert']
    },
    {
      id: 'referral-invite',
      name: 'Referral Program',
      category: 'engagement',
      description: 'Encourage referrals',
      message: '🎁 Share the love! Refer a friend & you both get {{reward}}! Your unique link: {{referral_link}} 💸',
      emoji: '🎁',
      characterCount: 100,
      tags: ['referral', 'reward', 'sharing']
    },
    {
      id: 'weekend-special',
      name: 'Weekend Special',
      category: 'promotional',
      description: 'Weekend-only promotion',
      message: '🌞 WEEKEND VIBES! This weekend only: {{discount}}% OFF + FREE shipping! 📦 No code needed 👉 {{link}}',
      emoji: '🌞',
      characterCount: 110,
      tags: ['weekend', 'special', 'limited-time']
    },
    {
      id: 'loyalty-reward',
      name: 'Loyalty Reward',
      category: 'engagement',
      description: 'Reward loyal customers',
      message: '💎 You\'re a VIP now! Enjoy {{discount}}% OFF for life + exclusive perks 🎁 Welcome to the club! {{link}}',
      emoji: '💎',
      characterCount: 110,
      tags: ['loyalty', 'vip', 'reward']
    },
    {
      id: 'double-points',
      name: 'Double Points',
      category: 'promotional',
      description: 'Points multiplier promotion',
      message: '⚡ 2X POINTS TODAY! Every purchase earns double rewards 🎯 Shop now & watch your points grow! {{link}}',
      emoji: '⚡',
      characterCount: 105,
      tags: ['points', 'rewards', 'double']
    },
    {
      id: 'free-shipping',
      name: 'Free Shipping',
      category: 'promotional',
      description: 'Free shipping promotion',
      message: '🚚 FREE SHIPPING alert! No minimum purchase required today only! Stock up now 📦 {{link}}',
      emoji: '🚚',
      characterCount: 95,
      tags: ['free-shipping', 'limited-time', 'promotion']
    },
    {
      id: 'mystery-discount',
      name: 'Mystery Discount',
      category: 'promotional',
      description: 'Gamified discount offer',
      message: '🎰 SPIN TO WIN! Your mystery discount is waiting: {{discount_range}}% OFF! Reveal it now 🎲 {{link}}',
      emoji: '🎰',
      characterCount: 105,
      tags: ['gamification', 'mystery', 'fun']
    },
    {
      id: 'holiday-sale',
      name: 'Holiday Sale',
      category: 'seasonal',
      description: 'Holiday promotion',
      message: '🎄 HOLIDAY MAGIC! Celebrate with {{discount}}% OFF sitewide! Limited time only 🎅 Shop: {{link}}',
      emoji: '🎄',
      characterCount: 100,
      tags: ['holiday', 'seasonal', 'christmas']
    },
    {
      id: 'payment-reminder',
      name: 'Payment Due',
      category: 'transactional',
      description: 'Friendly payment reminder',
      message: '💳 Friendly reminder: Payment of ${{amount}} is due {{date}}. Pay now to avoid late fees 👉 {{payment_link}}',
      emoji: '💳',
      characterCount: 110,
      tags: ['payment', 'billing', 'reminder']
    },
    {
      id: 'delivery-today',
      name: 'Delivery Today',
      category: 'transactional',
      description: 'Same-day delivery notification',
      message: '🚗 Heads up! Your order arrives TODAY between {{time_range}}! Make sure someone\'s home 🏠 Track: {{link}}',
      emoji: '🚗',
      characterCount: 115,
      tags: ['delivery', 'urgent', 'tracking']
    },
    {
      id: 'price-drop',
      name: 'Price Drop Alert',
      category: 'promotional',
      description: 'Wishlist price reduction',
      message: '💰 PRICE DROP! {{product_name}} just got cheaper! Now ${{new_price}} (was ${{old_price}}) 🔥 {{link}}',
      emoji: '💰',
      characterCount: 105,
      tags: ['price-drop', 'wishlist', 'deal']
    },
    {
      id: 'limited-stock',
      name: 'Low Stock Alert',
      category: 'promotional',
      description: 'Scarcity-driven urgency',
      message: '⚠️ ALMOST GONE! Only {{quantity}} left of {{product_name}}! Don\'t miss out 🏃 Order now: {{link}}',
      emoji: '⚠️',
      characterCount: 100,
      tags: ['scarcity', 'urgent', 'low-stock']
    },
    {
      id: 'customer-anniversary',
      name: 'Customer Anniversary',
      category: 'seasonal',
      description: 'Celebrate customer loyalty',
      message: '🎊 It\'s been {{years}} amazing year(s) together! Here\'s {{discount}}% OFF to celebrate YOU 💜 {{link}}',
      emoji: '🎊',
      characterCount: 105,
      tags: ['anniversary', 'loyalty', 'milestone']
    },
    {
      id: 'flash-giveaway',
      name: 'Flash Giveaway',
      category: 'engagement',
      description: 'Quick contest entry',
      message: '🎁 FLASH GIVEAWAY! Reply "YES" in the next hour to enter & win {{prize}}! Act fast ⚡ Winners announced at {{time}}',
      emoji: '🎁',
      characterCount: 120,
      tags: ['giveaway', 'contest', 'interactive']
    },
    {
      id: 'order-ready',
      name: 'Order Ready',
      category: 'transactional',
      description: 'Pickup notification',
      message: '✅ {{first_name}}, your order #{{order_number}} is ready for pickup! Come get it at {{location}} 📍 Hours: {{hours}}',
      emoji: '✅',
      characterCount: 115,
      tags: ['pickup', 'ready', 'local']
    },
    {
      id: 'subscription-renewal',
      name: 'Subscription Reminder',
      category: 'transactional',
      description: 'Renewal notification',
      message: '🔔 Your {{plan_name}} subscription renews on {{date}} for ${{amount}}. Update payment: {{link}} Questions? Reply!',
      emoji: '🔔',
      characterCount: 115,
      tags: ['subscription', 'renewal', 'billing']
    },
    {
      id: 'member-exclusive',
      name: 'Members Only',
      category: 'promotional',
      description: 'Exclusive member offer',
      message: '🌟 MEMBERS ONLY! Secret sale just for you: {{discount}}% OFF + early access! Don\'t tell anyone 🤫 {{link}}',
      emoji: '🌟',
      characterCount: 110,
      tags: ['members', 'exclusive', 'secret']
    },
    {
      id: 'survey-incentive',
      name: 'Quick Survey',
      category: 'engagement',
      description: 'Short feedback with reward',
      message: '📋 Quick favor! Take our 2-minute survey & get ${{reward}} off your next order 💰 {{survey_link}} Thanks!',
      emoji: '📋',
      characterCount: 110,
      tags: ['survey', 'feedback', 'incentive']
    },
    // ==========================================
    // CHRISTMAS & HOLIDAY THEMED SMS TEMPLATES
    // ==========================================
    {
      id: 'christmas-12-days',
      name: '12 Days of Christmas',
      category: 'seasonal',
      description: 'Daily Christmas countdown deals',
      message: '🎄 DAY {{day}} of 12 Days of Christmas! Today: {{discount}}% OFF {{category}}! Use code: {{code}} 🎁 Shop: {{link}}',
      emoji: '🎄',
      characterCount: 115,
      tags: ['christmas', '12-days', 'countdown', 'daily-deal']
    },
    {
      id: 'christmas-gift-guide',
      name: 'Gift Guide Alert',
      category: 'seasonal',
      description: 'Christmas gift recommendations',
      message: '🎅 Need gift ideas? Our Christmas Gift Guide is HERE! Perfect presents for everyone on your list 🎁 Browse: {{link}}',
      emoji: '🎅',
      characterCount: 115,
      tags: ['christmas', 'gift-guide', 'shopping', 'ideas']
    },
    {
      id: 'christmas-last-minute',
      name: 'Last-Minute Christmas',
      category: 'seasonal',
      description: 'Urgent Christmas shipping deadline',
      message: '⏰ LAST CALL! Order by {{deadline}} for Christmas delivery! {{discount}}% OFF + FREE express shipping 🎄 {{link}}',
      emoji: '⏰',
      characterCount: 110,
      tags: ['christmas', 'urgent', 'deadline', 'shipping']
    },
    {
      id: 'christmas-morning',
      name: 'Christmas Day Surprise',
      category: 'seasonal',
      description: 'Special Christmas morning message',
      message: '🎄 Merry Christmas {{first_name}}! 🎁 Santa dropped off a special gift: {{discount}}% OFF TODAY ONLY! Unwrap it: {{link}}',
      emoji: '🎄',
      characterCount: 120,
      tags: ['christmas', 'holiday', 'gift', 'special']
    },
    {
      id: 'new-year-countdown',
      name: 'New Year Countdown',
      category: 'seasonal',
      description: 'New Year celebration sale',
      message: '🎆 Happy New Year! Start {{year}} with {{discount}}% OFF everything! New year, new you! 🥂 Shop: {{link}}',
      emoji: '🎆',
      characterCount: 105,
      tags: ['new-year', 'celebration', 'countdown', 'sale']
    },
    {
      id: 'winter-wonderland',
      name: 'Winter Wonderland',
      category: 'seasonal',
      description: 'Winter-themed cozy sale',
      message: '❄️ WINTER WONDERLAND SALE! Stay cozy with {{discount}}% OFF sweaters, blankets & more! ☃️ Shop warm: {{link}}',
      emoji: '❄️',
      characterCount: 110,
      tags: ['winter', 'cozy', 'seasonal', 'sale']
    },
    {
      id: 'stocking-stuffers',
      name: 'Stocking Stuffers',
      category: 'seasonal',
      description: 'Small gift ideas under budget',
      message: '🧦 STOCKING STUFFERS under ${{price}}! Perfect last-minute gifts 🎁 Extra {{discount}}% off w/ code: {{code}} {{link}}',
      emoji: '🧦',
      characterCount: 115,
      tags: ['christmas', 'stocking', 'budget', 'gifts']
    },
    {
      id: 'holiday-gift-card',
      name: 'Holiday Gift Card',
      category: 'seasonal',
      description: 'Gift card promotion',
      message: '💳 THE PERFECT GIFT! Buy a ${{amount}} gift card, get ${{bonus}} FREE! 🎄 Instant delivery, no wrapping needed! {{link}}',
      emoji: '💳',
      characterCount: 115,
      tags: ['gift-card', 'christmas', 'bonus', 'instant']
    },
    {
      id: 'secret-santa',
      name: 'Secret Santa Special',
      category: 'seasonal',
      description: 'Secret Santa gift ideas',
      message: '🎅 SECRET SANTA? We got you! Gifts under ${{price}} + {{discount}}% OFF! Find the perfect surprise 🤫 {{link}}',
      emoji: '🎅',
      characterCount: 110,
      tags: ['secret-santa', 'christmas', 'gifts', 'budget']
    },
    {
      id: 'post-christmas-sale',
      name: 'Post-Christmas Clearance',
      category: 'seasonal',
      description: 'After-Christmas mega sale',
      message: '🏷️ POST-CHRISTMAS CLEARANCE! Up to {{discount}}% OFF everything! 🔥 Best deals of the year - shop now: {{link}}',
      emoji: '🏷️',
      characterCount: 110,
      tags: ['clearance', 'sale', 'post-christmas', 'deals']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📱' },
    { id: 'promotional', name: 'Promotional', icon: '🎯' },
    { id: 'transactional', name: 'Transactional', icon: '💳' },
    { id: 'reminder', name: 'Reminders', icon: '⏰' },
    { id: 'seasonal', name: 'Seasonal', icon: '🎉' },
    { id: 'onboarding', name: 'Onboarding', icon: '👋' },
    { id: 'engagement', name: 'Engagement', icon: '❤️' },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: SmsTemplate) => {
    // Store template data in localStorage and navigate
    localStorage.setItem('selectedSmsTemplate', JSON.stringify(template));
    router.push('/dashboard/sms/create?template=' + template.id);
  };

  const getMessageSegments = (charCount: number) => {
    return Math.ceil(charCount / 160);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Templates</h1>
          <p className="text-gray-600 mt-1">Pre-made messages with emojis and personalization</p>
        </div>
        <Link href="/dashboard/sms/create" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search templates, tags, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-primary-600">{templates.length}</div>
          <div className="text-sm text-gray-600">Total Templates</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-green-600">{filteredTemplates.length}</div>
          <div className="text-sm text-gray-600">Showing Now</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-blue-600">{categories.length - 1}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-purple-600">100%</div>
          <div className="text-sm text-gray-600">Customizable</div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const segments = getMessageSegments(template.characterCount);
          return (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
            >
              {/* Template Header */}
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 p-6 text-center border-b">
                <div className="text-5xl mb-3">{template.emoji}</div>
                <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              </div>

              {/* Template Body */}
              <div className="p-6">
                {/* Category Badge */}
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {categories.find((c) => c.id === template.category)?.name}
                  </span>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[120px]">
                  <div className="text-sm text-gray-800 leading-relaxed break-words">
                    {template.message}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>📏</span>
                    <span>{template.characterCount} chars</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📨</span>
                    <span>{segments} SMS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🏷️</span>
                    <span>{template.tags.length} tags</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Use This Template
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-xl font-semibold text-gray-900 mb-2">No templates found</div>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Template Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>Personalization:</strong> Use variables like {'{{'}first_name{'}}'} to customize messages</li>
          <li>• <strong>Character Count:</strong> SMS messages are best under 160 characters (1 SMS)</li>
          <li>• <strong>Emojis:</strong> Add personality and increase open rates by 20%+</li>
          <li>• <strong>Links:</strong> Use URL shorteners to save characters</li>
          <li>• <strong>Timing:</strong> Send between 10 AM - 8 PM for best engagement</li>
        </ul>
      </div>
    </div>
  );
}
