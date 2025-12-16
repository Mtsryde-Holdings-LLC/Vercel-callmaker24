'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  subject: string;
  preheader: string;
  content: string;
  isPremium: boolean;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const templates: EmailTemplate[] = [
    {
      id: 'loyalty-invite',
      name: 'Loyalty Program Invite',
      category: 'promotional',
      description: 'Invite customers to join your loyalty rewards program',
      thumbnail: '🏆',
      subject: 'Join Our Exclusive Loyalty Rewards Program!',
      preheader: 'Earn points, get rewards, and enjoy exclusive benefits',
      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #7c3aed; text-align: center;">🏆 You're Invited!</h1>
  <h2 style="text-align: center; color: #333;">Join Our Loyalty Rewards Program</h2>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">Dear Valued Customer,</p>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    We're excited to invite you to join our exclusive Loyalty Rewards Program! As a member, you'll enjoy:
  </p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 10px 0; font-size: 16px;">✅ Earn points on every purchase</li>
      <li style="padding: 10px 0; font-size: 16px;">✅ Exclusive member-only discounts</li>
      <li style="padding: 10px 0; font-size: 16px;">🎂 Birthday rewards and special occasion bonuses</li>
      <li style="padding: 10px 0; font-size: 16px;">✅ Early access to sales and new products</li>
      <li style="padding: 10px 0; font-size: 16px;">✅ Free shipping on select orders</li>
    </ul>
  </div>
  
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>🎉 Special Birthday Bonus!</strong><br>
      Share your birthday when you sign up and receive exclusive birthday rewards every year!
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{loyalty_signup_url}}" style="background: linear-gradient(to right, #7c3aed, #3b82f6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">
      Join Now - It's Free!
    </a>
  </div>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    Start earning rewards today and unlock exclusive benefits reserved just for our loyal customers!
  </p>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    Best regards,<br>
    <strong>Your Company Team</strong>
  </p>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
    <p>Questions? Contact us at support@yourcompany.com</p>
  </div>
</div>`,
      isPremium: false,
    },
    {
      id: 'welcome',
      name: 'Welcome Series',
      category: 'onboarding',
      description: 'Warm welcome email for new subscribers',
      thumbnail: '🎉',
      subject: 'Welcome to {{company_name}}! Get Started Today',
      preheader: 'Thanks for joining us! Here\'s what to expect next.',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 10px; padding: 40px;">
            <h1 style="color: #667eea; font-size: 32px; margin-bottom: 20px;">Welcome Aboard! 🎉</h1>
            <p style="font-size: 18px; color: #333; line-height: 1.6;">Hi {{first_name}},</p>
            <p style="font-size: 16px; color: #666; line-height: 1.8;">
              We're thrilled to have you as part of our community! You've just taken the first step towards something amazing.
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">What's Next?</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">✓ Complete your profile</li>
                <li style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">✓ Explore our features</li>
                <li style="padding: 10px 0;">✓ Join our community</li>
              </ul>
            </div>
            <a href="{{cta_link}}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Get Started</a>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'flash-sale',
      name: 'Flash Sale Alert',
      category: 'promotional',
      description: 'Urgent limited-time offer announcement',
      thumbnail: '⚡',
      subject: '⚡ FLASH SALE: {{discount}}% OFF - Ends in {{hours}} Hours!',
      preheader: 'Don\'t miss out on our biggest sale of the season!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; padding: 40px; text-align: center;">
            <div style="background: white; border-radius: 50%; width: 100px; height: 100px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px;">⚡</div>
            <h1 style="color: white; font-size: 42px; margin: 20px 0; text-transform: uppercase; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Flash Sale!</h1>
            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 30px; margin: 30px 0;">
              <p style="color: white; font-size: 64px; font-weight: bold; margin: 0;">{{discount}}% OFF</p>
              <p style="color: white; font-size: 24px; margin: 10px 0;">Everything Store-Wide</p>
            </div>
            <div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: #f5576c; font-size: 18px; font-weight: bold; margin: 0;">⏰ Ends in {{hours}} Hours!</p>
            </div>
            <a href="{{shop_link}}" style="display: inline-block; background: white; color: #f5576c; padding: 20px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">SHOP NOW</a>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'product-launch',
      name: 'Product Launch',
      category: 'announcement',
      description: 'Introduce new products with style',
      thumbnail: '🚀',
      subject: 'Introducing {{product_name}} - You\'ve Never Seen Anything Like This',
      preheader: 'The wait is over. Our newest innovation is here.',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 0;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 20px; text-align: center;">
            <h1 style="color: white; font-size: 48px; margin: 0; text-transform: uppercase;">New Launch 🚀</h1>
          </div>
          <div style="background: white; padding: 40px;">
            <h2 style="color: #333; font-size: 32px; margin-bottom: 20px;">Introducing {{product_name}}</h2>
            <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 30px 0; text-align: center;">
              <div style="background: #e9ecef; height: 200px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 64px;">📦</div>
              <p style="color: #666; margin-top: 20px; font-style: italic;">Product Image Here</p>
            </div>
            <p style="font-size: 18px; color: #666; line-height: 1.8;">{{product_description}}</p>
            <div style="background: #667eea; color: white; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
              <p style="font-size: 16px; margin: 0 0 10px 0;">Special Launch Price</p>
              <p style="font-size: 48px; font-weight: bold; margin: 0;">$\{{price}}</p>
            </div>
            <a href="{{product_link}}" style="display: block; background: #667eea; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Pre-Order Now</a>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'newsletter',
      name: 'Monthly Newsletter',
      category: 'newsletter',
      description: 'Keep subscribers informed and engaged',
      thumbnail: '📰',
      subject: '{{month}} Newsletter: What\'s New & Trending',
      preheader: 'Your monthly dose of updates, tips, and exclusive content',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
          <div style="background: #2c3e50; padding: 30px; text-align: center;">
            <h1 style="color: white; font-size: 36px; margin: 0;">📰 {{month}} Newsletter</h1>
            <p style="color: #ecf0f1; margin: 10px 0 0 0;">{{company_name}} Monthly Update</p>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">What's New This Month</h2>
            <div style="margin: 30px 0;">
              <h3 style="color: #3498db; font-size: 20px;">📌 Feature Update</h3>
              <p style="color: #666; line-height: 1.8;">{{feature_description}}</p>
            </div>
            <div style="margin: 30px 0;">
              <h3 style="color: #3498db; font-size: 20px;">💡 Tips & Tricks</h3>
              <p style="color: #666; line-height: 1.8;">{{tips_content}}</p>
            </div>
            <div style="background: #ecf0f1; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
              <h3 style="color: #2c3e50; margin-bottom: 15px;">🎯 This Month's Highlight</h3>
              <p style="color: #666; font-size: 18px; line-height: 1.8;">{{highlight_text}}</p>
              <a href="{{highlight_link}}" style="display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Learn More</a>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart',
      category: 'transactional',
      description: 'Recover lost sales with gentle reminders',
      thumbnail: '🛒',
      subject: 'You left something behind... Complete your order now!',
      preheader: 'Your items are waiting. Get {{discount}}% off if you order today.',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 64px;">🛒</div>
            <h1 style="color: #333; font-size: 32px; margin: 20px 0;">Don't Forget Your Items!</h1>
            <p style="color: #666; font-size: 18px;">Hi {{first_name}}, you left some great items in your cart.</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; margin: 30px 0;">
            <h3 style="color: #333; margin-bottom: 20px;">Your Cart Items:</h3>
            <div style="border-bottom: 1px solid #dee2e6; padding: 15px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; color: #333; font-weight: bold;">{{item_name}}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Quantity: {{quantity}}</p>
                </div>
                <p style="margin: 0; color: #333; font-weight: bold; font-size: 18px;">${'$'}{{item_price}}</p>
              </div>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">Total:</p>
                <p style="margin: 0; color: #28a745; font-size: 24px; font-weight: bold;">${'$'}{{cart_total}}</p>
              </div>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; padding: 20px; text-align: center; color: white; margin: 30px 0;">
            <p style="margin: 0; font-size: 20px; font-weight: bold;">🎁 SPECIAL OFFER</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your order in the next 24 hours and get {{discount}}% OFF!</p>
          </div>
          <a href="{{checkout_link}}" style="display: block; background: #28a745; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Complete Your Purchase</a>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'birthday',
      name: 'Birthday Special',
      category: 'seasonal',
      description: 'Celebrate customer birthdays with offers',
      thumbnail: '🎂',
      subject: 'Happy Birthday {{first_name}}! 🎉 Here\'s Your Special Gift',
      preheader: 'Celebrate your special day with an exclusive birthday discount',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; padding: 40px; text-align: center;">
            <div style="font-size: 80px; margin-bottom: 20px;">🎂</div>
            <h1 style="color: #ff6b6b; font-size: 36px; margin: 20px 0;">Happy Birthday {{first_name}}! 🎉</h1>
            <p style="color: #666; font-size: 18px; line-height: 1.8;">We hope your special day is filled with joy, laughter, and wonderful moments!</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 40px; margin: 30px 0; color: white;">
              <p style="margin: 0 0 10px 0; font-size: 18px;">🎁 Your Birthday Gift</p>
              <p style="margin: 0; font-size: 56px; font-weight: bold;">{{discount}}% OFF</p>
              <p style="margin: 10px 0 0 0; font-size: 16px;">+ Free Shipping on Any Order</p>
            </div>
            <div style="background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="color: #856404; margin: 0; font-weight: bold;">🎈 Valid for 7 days</p>
              <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">Use code: BDAY{{year}}</p>
            </div>
            <a href="{{shop_link}}" style="display: inline-block; background: #ff6b6b; color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0;">Claim Your Gift</a>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">🎊 From all of us at {{company_name}} 🎊</p>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'event-invite',
      name: 'Event Invitation',
      category: 'announcement',
      description: 'Invite customers to special events',
      thumbnail: '🎟️',
      subject: 'You\'re Invited! {{event_name}} - RSVP Now',
      preheader: 'Join us for an exclusive event you won\'t want to miss',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px 20px;">
          <div style="background: white; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 20px; text-align: center; color: white;">
              <div style="font-size: 64px; margin-bottom: 20px;">🎟️</div>
              <h1 style="margin: 0; font-size: 32px;">YOU'RE INVITED</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">An Exclusive Event</p>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #333; font-size: 28px; text-align: center; margin-bottom: 30px;">{{event_name}}</h2>
              <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <div style="margin-bottom: 20px;">
                  <p style="color: #667eea; font-weight: bold; margin: 0; font-size: 14px;">📅 DATE & TIME</p>
                  <p style="color: #333; margin: 5px 0 0 0; font-size: 18px;">{{event_date}} at {{event_time}}</p>
                </div>
                <div style="margin-bottom: 20px;">
                  <p style="color: #667eea; font-weight: bold; margin: 0; font-size: 14px;">📍 LOCATION</p>
                  <p style="color: #333; margin: 5px 0 0 0; font-size: 18px;">{{event_location}}</p>
                </div>
                <div>
                  <p style="color: #667eea; font-weight: bold; margin: 0; font-size: 14px;">✨ HIGHLIGHTS</p>
                  <p style="color: #666; margin: 10px 0 0 0; line-height: 1.8;">{{event_highlights}}</p>
                </div>
              </div>
              <a href="{{rsvp_link}}" style="display: block; background: #667eea; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 30px 0;">RSVP Now - Spots Limited!</a>
              <p style="color: #999; text-align: center; font-size: 14px; margin: 20px 0 0 0;">Can't make it? <a href="#" style="color: #667eea;">Let us know</a></p>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'referral',
      name: 'Referral Program',
      category: 'promotional',
      description: 'Encourage customers to refer friends',
      thumbnail: '🎁',
      subject: 'Give $\{{amount}}, Get $\{{amount}} - Share the Love!',
      preheader: 'Refer a friend and you both get rewarded',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 72px; margin-bottom: 20px;">🎁</div>
            <h1 style="color: #333; font-size: 36px; margin: 0;">Share the Love!</h1>
            <p style="color: #666; font-size: 18px; margin-top: 10px;">Give ${'$'}{{amount}}, Get ${'$'}{{amount}}</p>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 40px; color: white; margin: 30px 0;">
            <h2 style="margin: 0 0 20px 0; font-size: 24px; text-align: center;">Here's How It Works</h2>
            <div style="display: grid; gap: 20px;">
              <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px;">
                <p style="margin: 0; font-size: 32px;">1️⃣</p>
                <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6;">Share your unique referral link with friends</p>
              </div>
              <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px;">
                <p style="margin: 0; font-size: 32px;">2️⃣</p>
                <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6;">They get ${'$'}{{amount}} off their first purchase</p>
              </div>
              <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px;">
                <p style="margin: 0; font-size: 32px;">3️⃣</p>
                <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6;">You get ${'$'}{{amount}} credit after their purchase</p>
              </div>
            </div>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <p style="color: #333; margin: 0 0 15px 0; font-weight: bold;">Your Referral Link:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 5px; padding: 15px; margin: 15px 0;">
              <code style="color: #667eea; font-size: 16px; word-break: break-all;">{{referral_link}}</code>
            </div>
            <a href="{{share_link}}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Share Now</a>
          </div>
          <p style="color: #999; text-align: center; font-size: 14px; line-height: 1.6;">💰 No limit on referrals! The more you share, the more you earn.</p>
        </div>
      `,
      isPremium: true,
    },
    {
      id: 're-engagement',
      name: 'We Miss You',
      category: 'retention',
      description: 'Win back inactive customers',
      thumbnail: '💙',
      subject: 'We Miss You {{first_name}}! Here\'s {{discount}}% Off to Come Back',
      preheader: 'It\'s been a while. Let\'s reconnect with a special offer.',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; padding: 40px; text-align: center;">
            <div style="font-size: 80px; margin-bottom: 20px;">💙</div>
            <h1 style="color: #333; font-size: 36px; margin: 20px 0;">We Miss You!</h1>
            <p style="color: #666; font-size: 18px; line-height: 1.8;">Hey {{first_name}}, it's been a while since we last saw you. We hope everything is going well!</p>
            <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; margin: 30px 0;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">We've got some exciting new things we'd love to share with you:</p>
              <ul style="list-style: none; padding: 0; text-align: left;">
                <li style="padding: 10px 0; color: #666;">✨ {{new_feature_1}}</li>
                <li style="padding: 10px 0; color: #666;">🎯 {{new_feature_2}}</li>
                <li style="padding: 10px 0; color: #666;">🚀 {{new_feature_3}}</li>
              </ul>
            </div>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; color: white; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; font-size: 18px;">Welcome Back Offer</p>
              <p style="margin: 0; font-size: 48px; font-weight: bold;">{{discount}}% OFF</p>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your Next Purchase</p>
            </div>
            <a href="{{shop_link}}" style="display: inline-block; background: #667eea; color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0;">Come Back & Save</a>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">This exclusive offer expires in 7 days</p>
          </div>
        </div>
      `,
      isPremium: true,
    },
    {
      id: 'survey',
      name: 'Customer Feedback',
      category: 'engagement',
      description: 'Gather valuable customer insights',
      thumbnail: '📊',
      subject: 'We Value Your Opinion - Quick 2-Minute Survey',
      preheader: 'Help us improve! Complete our survey and get a special thank you.',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 72px; margin-bottom: 20px;">📊</div>
            <h1 style="color: #333; font-size: 32px; margin: 0;">We'd Love Your Feedback</h1>
            <p style="color: #666; font-size: 18px; margin-top: 10px;">Help us serve you better</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; margin: 30px 0;">
            <p style="color: #333; font-size: 18px; margin-bottom: 20px;">Hi {{first_name}},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.8;">Your opinion matters to us! We're constantly working to improve our products and services, and your feedback is invaluable.</p>
            <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
              <p style="color: #333; font-weight: bold; margin: 0 0 10px 0;">This survey will take just 2 minutes</p>
              <p style="color: #666; margin: 0; font-size: 14px;">✓ Quick and easy questions<br>✓ Your responses are confidential<br>✓ Help shape our future</p>
            </div>
          </div>
          <a href="{{survey_link}}" style="display: block; background: #667eea; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 30px 0;">Take the Survey</a>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; padding: 25px; text-align: center; color: white; margin: 30px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">🎁 Thank You Gift</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Complete the survey and get {{reward}} as a thank you!</p>
          </div>
          <p style="color: #999; text-align: center; font-size: 14px;">Thank you for being part of our community! 💜</p>
        </div>
      `,
      isPremium: true,
    },
    {
      id: 'seasonal-holiday',
      name: 'Holiday Sale',
      category: 'seasonal',
      description: 'Festive holiday promotions',
      thumbnail: '🎄',
      subject: '🎄 Holiday Sale: Up to {{discount}}% OFF Everything!',
      preheader: 'Celebrate the season with our biggest sale of the year',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #d31027 0%, #ea384d 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 120%22><path fill=%22%23198754%22 d=%22M0,0 L1200,0 L1200,120 L0,60 Z%22/></svg>'); background-size: cover; padding: 50px 20px; text-align: center;">
              <div style="font-size: 80px; margin-bottom: 20px;">🎄</div>
              <h1 style="color: white; font-size: 42px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Holiday Sale</h1>
              <p style="color: white; font-size: 20px; margin: 10px 0 0 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">Season's Savings Are Here!</p>
            </div>
            <div style="padding: 40px;">
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: linear-gradient(135deg, #d31027 0%, #ea384d 100%); border-radius: 50%; width: 150px; height: 150px; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(211,16,39,0.3);">
                  <div style="text-align: center; color: white;">
                    <p style="margin: 0; font-size: 18px;">Up To</p>
                    <p style="margin: 5px 0; font-size: 48px; font-weight: bold;">{{discount}}%</p>
                    <p style="margin: 0; font-size: 18px;">OFF</p>
                  </div>
                </div>
              </div>
              <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; margin: 30px 0;">
                <h3 style="color: #333; text-align: center; margin-bottom: 20px;">🎁 Featured Holiday Deals</h3>
                <div style="border-bottom: 1px solid #dee2e6; padding: 15px 0;">
                  <p style="margin: 0; color: #333; font-weight: bold;">{{category_1}}</p>
                  <p style="margin: 5px 0 0 0; color: #d31027; font-size: 18px;">Save up to {{percent_1}}%</p>
                </div>
                <div style="border-bottom: 1px solid #dee2e6; padding: 15px 0;">
                  <p style="margin: 0; color: #333; font-weight: bold;">{{category_2}}</p>
                  <p style="margin: 5px 0 0 0; color: #d31027; font-size: 18px;">Save up to {{percent_2}}%</p>
                </div>
                <div style="padding: 15px 0;">
                  <p style="margin: 0; color: #333; font-weight: bold;">{{category_3}}</p>
                  <p style="margin: 5px 0 0 0; color: #d31027; font-size: 18px;">Save up to {{percent_3}}%</p>
                </div>
              </div>
              <a href="{{shop_link}}" style="display: block; background: linear-gradient(135deg, #d31027 0%, #ea384d 100%); color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(211,16,39,0.3);">Shop Holiday Deals</a>
              <p style="color: #999; text-align: center; font-size: 14px; margin-top: 30px;">⏰ Sale ends {{end_date}} - Don't miss out!</p>
            </div>
          </div>
        </div>
      `,
      isPremium: true,
    },
    {
      id: 'thank-you',
      name: 'Thank You',
      category: 'transactional',
      description: 'Show appreciation after purchase',
      thumbnail: '💜',
      subject: 'Thank You for Your Order #{{order_number}}',
      preheader: 'Your order is confirmed and on its way!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 80px; margin-bottom: 20px;">💜</div>
            <h1 style="color: #333; font-size: 36px; margin: 0;">Thank You!</h1>
            <p style="color: #666; font-size: 18px; margin-top: 10px;">Your order has been confirmed</p>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; color: white; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Order Number</p>
            <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;">{{order_number}}</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 30px; margin: 30px 0;">
            <h3 style="color: #333; margin-bottom: 20px;">Order Summary</h3>
            <div style="border-bottom: 1px solid #dee2e6; padding: 15px 0;">
              <div style="display: flex; justify-content: space-between;">
                <p style="margin: 0; color: #666;">Subtotal:</p>
                <p style="margin: 0; color: #333;">${'$'}{{subtotal}}</p>
              </div>
            </div>
            <div style="border-bottom: 1px solid #dee2e6; padding: 15px 0;">
              <div style="display: flex; justify-content: space-between;">
                <p style="margin: 0; color: #666;">Shipping:</p>
                <p style="margin: 0; color: #333;">${'$'}{{shipping}}</p>
              </div>
            </div>
            <div style="padding: 15px 0;">
              <div style="display: flex; justify-content: space-between;">
                <p style="margin: 0; color: #333; font-weight: bold; font-size: 18px;">Total:</p>
                <p style="margin: 0; color: #667eea; font-weight: bold; font-size: 18px;">${'$'}{{total}}</p>
              </div>
            </div>
          </div>
          <div style="background: #fff3cd; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0; font-weight: bold;">📦 Estimated Delivery</p>
            <p style="color: #856404; margin: 10px 0 0 0;">{{delivery_date}}</p>
          </div>
          <a href="{{tracking_link}}" style="display: block; background: #667eea; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 30px 0;">Track Your Order</a>
          <p style="color: #666; text-align: center; font-size: 16px; line-height: 1.8;">We appreciate your business! If you have any questions, feel free to contact our support team.</p>
        </div>
      `,
      isPremium: true,
    },
    // ==========================================
    // CHRISTMAS & HOLIDAY THEMED TEMPLATES
    // ==========================================
    {
      id: 'christmas-12-days',
      name: '12 Days of Christmas',
      category: 'seasonal',
      description: 'Daily deals countdown to Christmas',
      thumbnail: '🎁',
      subject: '🎄 Day {{day}} of 12 Days of Christmas - {{discount}}% OFF {{category}}!',
      preheader: 'Unwrap today\'s exclusive deal before midnight!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); padding: 40px 20px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">🎄🎁🎄</div>
              <h1 style="color: white; font-size: 36px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">12 Days of Christmas</h1>
              <div style="background: rgba(255,255,255,0.2); border-radius: 50px; padding: 10px 30px; display: inline-block; margin-top: 15px;">
                <p style="color: white; font-size: 24px; font-weight: bold; margin: 0;">DAY {{day}} of 12</p>
              </div>
            </div>
            <div style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #666; font-size: 18px; margin: 0;">Today's Exclusive Deal</p>
                <h2 style="color: #c41e3a; font-size: 42px; margin: 10px 0;">{{discount}}% OFF</h2>
                <p style="color: #333; font-size: 24px; font-weight: bold; margin: 0;">{{category}}</p>
              </div>
              <div style="background: #fff8dc; border: 2px dashed #c41e3a; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="color: #8b0000; margin: 0; font-size: 14px;">USE CODE:</p>
                <p style="color: #c41e3a; font-size: 32px; font-weight: bold; margin: 5px 0; letter-spacing: 3px;">{{code}}</p>
              </div>
              <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <p style="color: #666; text-align: center; margin: 0;">⏰ <strong>Hurry!</strong> This deal expires at midnight!</p>
              </div>
              <a href="{{shop_link}}" style="display: block; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(196,30,58,0.3);">🎁 Unwrap Today's Deal</a>
              <p style="color: #999; text-align: center; font-size: 12px; margin-top: 20px;">🎵 On the {{day_ordinal}} day of Christmas, we gave to you... amazing savings! 🎵</p>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'christmas-gift-guide',
      name: 'Christmas Gift Guide',
      category: 'seasonal',
      description: 'Curated gift recommendations for everyone',
      thumbnail: '🎅',
      subject: '🎅 The Ultimate Christmas Gift Guide - Perfect Gifts for Everyone!',
      preheader: 'Find the perfect gift for everyone on your list',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #165B33 0%, #146B3A 50%, #F8B229 100%); padding: 50px 20px; text-align: center;">
              <div style="font-size: 70px; margin-bottom: 15px;">🎅</div>
              <h1 style="color: white; font-size: 32px; margin: 0;">Christmas Gift Guide</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0 0;">Find the perfect gift for everyone on your list</p>
            </div>
            <div style="padding: 40px;">
              <p style="color: #333; font-size: 18px; text-align: center; margin-bottom: 30px;">🎄 Handpicked gifts to make this Christmas magical 🎄</p>

              <div style="background: #ffebee; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #c41e3a; margin: 0 0 10px 0;">👨 For Him</h3>
                <p style="color: #666; margin: 0;">Tech gadgets, grooming essentials, outdoor gear & more</p>
                <a href="{{link_him}}" style="color: #c41e3a; font-weight: bold; text-decoration: none;">Shop Now →</a>
              </div>

              <div style="background: #fff3e0; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #e65100; margin: 0 0 10px 0;">👩 For Her</h3>
                <p style="color: #666; margin: 0;">Jewelry, beauty sets, cozy accessories & more</p>
                <a href="{{link_her}}" style="color: #e65100; font-weight: bold; text-decoration: none;">Shop Now →</a>
              </div>

              <div style="background: #e8f5e9; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #2e7d32; margin: 0 0 10px 0;">👶 For Kids</h3>
                <p style="color: #666; margin: 0;">Toys, games, educational sets & more</p>
                <a href="{{link_kids}}" style="color: #2e7d32; font-weight: bold; text-decoration: none;">Shop Now →</a>
              </div>

              <div style="background: #e3f2fd; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #1565c0; margin: 0 0 10px 0;">🏠 For Home</h3>
                <p style="color: #666; margin: 0;">Decor, kitchen essentials, cozy blankets & more</p>
                <a href="{{link_home}}" style="color: #1565c0; font-weight: bold; text-decoration: none;">Shop Now →</a>
              </div>

              <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); border-radius: 10px; padding: 25px; text-align: center; color: white; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; font-size: 16px;">🎁 Use code for extra savings:</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">{{code}}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Get {{discount}}% OFF your entire order!</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: #165B33; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">View Full Gift Guide</a>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'christmas-last-minute',
      name: 'Last-Minute Christmas',
      category: 'seasonal',
      description: 'Urgent pre-Christmas shopping reminder',
      thumbnail: '⏰',
      subject: '⏰ LAST CHANCE! Order by {{deadline}} for Christmas Delivery!',
      preheader: 'Don\'t miss the shipping deadline - order NOW!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #c41e3a; padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: #000; padding: 30px 20px; text-align: center;">
              <div style="font-size: 50px; margin-bottom: 10px;">⏰🎄⏰</div>
              <h1 style="color: #ff4444; font-size: 36px; margin: 0; text-transform: uppercase; animation: pulse 1s infinite;">Last Chance!</h1>
              <p style="color: white; font-size: 18px; margin: 10px 0 0 0;">Order NOW for Christmas Delivery</p>
            </div>
            <div style="padding: 40px; text-align: center;">
              <div style="background: #fff3cd; border: 3px solid #ffc107; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                <p style="color: #856404; font-size: 16px; margin: 0 0 10px 0;">🚨 SHIPPING DEADLINE:</p>
                <p style="color: #000; font-size: 32px; font-weight: bold; margin: 0;">{{deadline}}</p>
                <p style="color: #856404; font-size: 14px; margin: 10px 0 0 0;">Order before midnight to guarantee Christmas arrival!</p>
              </div>

              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">🎁 Still Need Gift Ideas?</h2>

              <div style="display: grid; gap: 15px; margin-bottom: 30px;">
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px;">
                  <p style="margin: 0; font-size: 16px;">🎮 <strong>Best Sellers</strong> - Guaranteed crowd-pleasers</p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px;">
                  <p style="margin: 0; font-size: 16px;">💳 <strong>Gift Cards</strong> - Instant digital delivery</p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px;">
                  <p style="margin: 0; font-size: 16px;">🎄 <strong>Stocking Stuffers</strong> - Under $25</p>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); border-radius: 10px; padding: 20px; color: white; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-size: 14px;">LAST-MINUTE SAVER CODE:</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold;">{{code}}</p>
                <p style="margin: 5px 0 0 0; font-size: 16px;">{{discount}}% OFF + Express Shipping</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: #c41e3a; color: white; padding: 20px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(196,30,58,0.4);">🛒 SHOP NOW - TIME IS RUNNING OUT!</a>

              <p style="color: #999; font-size: 12px; margin-top: 20px;">Free express shipping on orders over \${{min_order}}</p>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'new-year-countdown',
      name: 'New Year Celebration',
      category: 'seasonal',
      description: 'New Year\'s Eve countdown sale',
      thumbnail: '🥂',
      subject: '🥂 Ring in {{year}}! New Year\'s Sale - Up to {{discount}}% OFF!',
      preheader: 'Celebrate the new year with incredible savings',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #f5af19 0%, #f12711 100%); padding: 50px 20px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">🎆🥂🎆</div>
              <h1 style="color: white; font-size: 48px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">{{year}}</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 24px; margin: 10px 0 0 0;">New Year, New Deals!</p>
            </div>
            <div style="padding: 40px; text-align: center;">
              <div style="background: #1a1a2e; border-radius: 15px; padding: 30px; margin-bottom: 30px;">
                <p style="color: #f5af19; font-size: 18px; margin: 0 0 10px 0;">🎉 NEW YEAR'S SALE 🎉</p>
                <p style="color: white; font-size: 56px; font-weight: bold; margin: 0;">UP TO {{discount}}% OFF</p>
                <p style="color: rgba(255,255,255,0.7); font-size: 16px; margin: 10px 0 0 0;">Everything you need to start {{year}} right!</p>
              </div>

              <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #333; margin: 0 0 15px 0;">🎊 New Year Resolutions? We've Got You!</h3>
                <div style="text-align: left;">
                  <p style="margin: 10px 0; color: #666;">✨ <strong>Get Fit</strong> - Fitness gear & activewear</p>
                  <p style="margin: 10px 0; color: #666;">📚 <strong>Learn More</strong> - Books & courses</p>
                  <p style="margin: 10px 0; color: #666;">🏠 <strong>Get Organized</strong> - Home & office essentials</p>
                  <p style="margin: 10px 0; color: #666;">💄 <strong>Self Care</strong> - Beauty & wellness</p>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #f5af19 0%, #f12711 100%); border-radius: 10px; padding: 20px; color: white; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-size: 14px;">YOUR NEW YEAR CODE:</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 3px;">{{code}}</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">🥂 Shop New Year's Sale</a>

              <p style="color: #999; font-size: 14px; margin-top: 20px;">Sale ends January {{end_date}} - Start the year with savings!</p>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'holiday-thank-you',
      name: 'Holiday Thank You',
      category: 'seasonal',
      description: 'Season\'s gratitude message to customers',
      thumbnail: '💝',
      subject: '💝 Thank You for an Amazing Year - Happy Holidays from {{company_name}}!',
      preheader: 'Wishing you joy, peace, and happiness this holiday season',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #2c5530 0%, #1a472a 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>❄️</text></svg>') repeat; background-size: 40px; padding: 50px 20px; text-align: center;">
              <div style="background: rgba(255,255,255,0.95); border-radius: 15px; padding: 40px;">
                <div style="font-size: 60px; margin-bottom: 15px;">💝</div>
                <h1 style="color: #c41e3a; font-size: 36px; margin: 0;">Thank You</h1>
                <p style="color: #2c5530; font-size: 20px; margin: 10px 0 0 0;">For an Incredible Year Together</p>
              </div>
            </div>
            <div style="padding: 40px;">
              <p style="color: #333; font-size: 18px; line-height: 1.8; margin-bottom: 20px;">Dear {{first_name}},</p>

              <p style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                As we wrap up another wonderful year, we wanted to take a moment to express our heartfelt gratitude for your continued support and trust in {{company_name}}.
              </p>

              <div style="background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%); border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
                <p style="color: #333; font-size: 18px; margin: 0; font-style: italic;">
                  "May your holidays be filled with warmth, joy, and cherished moments with loved ones."
                </p>
              </div>

              <p style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                To show our appreciation, please enjoy this exclusive holiday gift:
              </p>

              <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); border-radius: 10px; padding: 25px; text-align: center; color: white; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 14px;">🎁 YOUR HOLIDAY GIFT</p>
                <p style="margin: 0; font-size: 36px; font-weight: bold;">{{discount}}% OFF</p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Code: <strong>{{code}}</strong> • Valid through {{expiry}}</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: #2c5530; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">Redeem Your Gift</a>

              <p style="color: #666; font-size: 16px; line-height: 1.8; margin-top: 30px;">
                Wishing you and your family a magical holiday season and a prosperous New Year!
              </p>

              <p style="color: #333; font-size: 16px; margin-top: 20px;">
                With gratitude,<br>
                <strong>The {{company_name}} Team</strong>
              </p>

              <div style="text-align: center; margin-top: 30px; font-size: 30px;">
                🎄❄️🎁❄️🎄
              </div>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'christmas-morning',
      name: 'Christmas Morning Surprise',
      category: 'seasonal',
      description: 'Special Christmas Day deals',
      thumbnail: '🌟',
      subject: '🌟 Merry Christmas! Open Your Special Gift Inside...',
      preheader: 'Santa left something special in your inbox!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f4c75 0%, #1b262c 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #c41e3a 0%, #165B33 100%); padding: 50px 20px; text-align: center;">
              <div style="font-size: 80px; margin-bottom: 15px;">🌟</div>
              <h1 style="color: white; font-size: 42px; margin: 0;">Merry Christmas!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 15px 0 0 0;">🎅 Santa left something special for you 🎅</p>
            </div>
            <div style="padding: 40px; text-align: center;">
              <p style="color: #333; font-size: 18px; margin-bottom: 30px;">Good morning, {{first_name}}! Hope you're having a magical Christmas!</p>

              <div style="background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%); border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(255,215,0,0.3);">
                <p style="color: #8b4513; font-size: 16px; margin: 0 0 10px 0;">🎁 YOUR CHRISTMAS GIFT 🎁</p>
                <p style="color: #8b0000; font-size: 52px; font-weight: bold; margin: 0;">{{discount}}% OFF</p>
                <p style="color: #8b4513; font-size: 18px; margin: 10px 0 0 0;">+ FREE Shipping on Everything!</p>
              </div>

              <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                <p style="color: #666; margin: 0;">
                  <strong>🎄 Today Only!</strong> Enjoy our biggest discount of the year as our gift to you.
                </p>
              </div>

              <div style="background: #fff3cd; border: 2px dashed #8b4513; border-radius: 10px; padding: 15px; margin-bottom: 30px;">
                <p style="color: #8b4513; margin: 0; font-size: 14px;">YOUR CHRISTMAS CODE:</p>
                <p style="color: #c41e3a; font-size: 28px; font-weight: bold; margin: 5px 0; letter-spacing: 3px;">{{code}}</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); color: white; padding: 20px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(196,30,58,0.3);">🎁 Unwrap Your Savings</a>

              <p style="color: #999; font-size: 12px; margin-top: 20px;">Offer valid December 25th only. Ho ho ho! 🎅</p>
            </div>
          </div>
        </div>
      `,
      isPremium: true,
    },
    {
      id: 'winter-wonderland',
      name: 'Winter Wonderland Sale',
      category: 'seasonal',
      description: 'Magical winter-themed promotion',
      thumbnail: '❄️',
      subject: '❄️ Winter Wonderland Sale - Cozy Deals Inside!',
      preheader: 'Warm up with our coolest deals of the season',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667db6 0%, #0082c8 50%, #667db6 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: linear-gradient(180deg, #e8f4fc 0%, #c9e4f6 100%); padding: 50px 20px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">❄️☃️❄️</div>
              <h1 style="color: #1e5799; font-size: 36px; margin: 0;">Winter Wonderland</h1>
              <p style="color: #4a90c2; font-size: 20px; margin: 10px 0 0 0;">Cozy Season Sale</p>
            </div>
            <div style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #666; font-size: 18px; margin: 0;">Bundle up with savings up to</p>
                <p style="color: #1e5799; font-size: 56px; font-weight: bold; margin: 10px 0;">{{discount}}% OFF</p>
              </div>

              <div style="display: grid; gap: 15px; margin-bottom: 30px;">
                <div style="background: #e3f2fd; border-radius: 10px; padding: 20px; display: flex; align-items: center;">
                  <span style="font-size: 30px; margin-right: 15px;">🧣</span>
                  <div>
                    <p style="margin: 0; color: #333; font-weight: bold;">Cozy Knits & Sweaters</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Up to {{percent_1}}% off</p>
                  </div>
                </div>
                <div style="background: #e3f2fd; border-radius: 10px; padding: 20px; display: flex; align-items: center;">
                  <span style="font-size: 30px; margin-right: 15px;">🧤</span>
                  <div>
                    <p style="margin: 0; color: #333; font-weight: bold;">Winter Accessories</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Up to {{percent_2}}% off</p>
                  </div>
                </div>
                <div style="background: #e3f2fd; border-radius: 10px; padding: 20px; display: flex; align-items: center;">
                  <span style="font-size: 30px; margin-right: 15px;">☕</span>
                  <div>
                    <p style="margin: 0; color: #333; font-weight: bold;">Home & Comfort</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Up to {{percent_3}}% off</p>
                  </div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #1e5799 0%, #207cca 100%); border-radius: 10px; padding: 20px; text-align: center; color: white; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-size: 14px;">❄️ WINTER CODE ❄️</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">{{code}}</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: linear-gradient(135deg, #667db6 0%, #0082c8 100%); color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">☃️ Shop Winter Sale</a>

              <p style="color: #999; text-align: center; font-size: 14px; margin-top: 20px;">Free shipping on orders over \${{min_order}} ❄️</p>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'stocking-stuffers',
      name: 'Stocking Stuffers',
      category: 'seasonal',
      description: 'Small gift ideas under budget',
      thumbnail: '🧦',
      subject: '🧦 Perfect Stocking Stuffers Under \${{price}} - Last Chance!',
      preheader: 'Small gifts, big smiles - all under budget!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #c41e3a; padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #165B33 0%, #146B3A 100%); padding: 40px 20px; text-align: center;">
              <div style="font-size: 70px; margin-bottom: 10px;">🧦</div>
              <h1 style="color: white; font-size: 32px; margin: 0;">Stocking Stuffers</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 20px; margin: 10px 0 0 0;">All Under \${{price}}!</p>
            </div>
            <div style="padding: 40px;">
              <p style="color: #333; font-size: 18px; text-align: center; margin-bottom: 30px;">
                🎄 Small gifts that make a BIG impression! 🎄
              </p>

              <div style="display: grid; gap: 15px; margin-bottom: 30px;">
                <div style="background: #ffebee; border-radius: 10px; padding: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="margin: 0; font-size: 24px;">🎁</p>
                      <p style="margin: 5px 0 0 0; color: #333; font-weight: bold;">Mini Gift Sets</p>
                    </div>
                    <p style="margin: 0; color: #c41e3a; font-size: 20px; font-weight: bold;">From \${{price_1}}</p>
                  </div>
                </div>
                <div style="background: #e8f5e9; border-radius: 10px; padding: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="margin: 0; font-size: 24px;">🍫</p>
                      <p style="margin: 5px 0 0 0; color: #333; font-weight: bold;">Treats & Sweets</p>
                    </div>
                    <p style="margin: 0; color: #2e7d32; font-size: 20px; font-weight: bold;">From \${{price_2}}</p>
                  </div>
                </div>
                <div style="background: #fff3e0; border-radius: 10px; padding: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="margin: 0; font-size: 24px;">✨</p>
                      <p style="margin: 5px 0 0 0; color: #333; font-weight: bold;">Fun Accessories</p>
                    </div>
                    <p style="margin: 0; color: #e65100; font-size: 20px; font-weight: bold;">From \${{price_3}}</p>
                  </div>
                </div>
                <div style="background: #e3f2fd; border-radius: 10px; padding: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="margin: 0; font-size: 24px;">🎮</p>
                      <p style="margin: 5px 0 0 0; color: #333; font-weight: bold;">Games & Gadgets</p>
                    </div>
                    <p style="margin: 0; color: #1565c0; font-size: 20px; font-weight: bold;">From \${{price_4}}</p>
                  </div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); border-radius: 10px; padding: 20px; text-align: center; color: white; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-size: 14px;">🧦 STOCKING SAVER CODE:</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold;">{{code}}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Extra {{discount}}% off all items under \${{price}}</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: #165B33; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">🛒 Shop Stocking Stuffers</a>

              <p style="color: #999; text-align: center; font-size: 14px; margin-top: 20px;">🎅 Order by {{deadline}} for Christmas delivery!</p>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: 'holiday-gift-card',
      name: 'Holiday Gift Card',
      category: 'seasonal',
      description: 'Gift card promotion for last-minute shoppers',
      thumbnail: '💳',
      subject: '💳 The Perfect Gift! Holiday Gift Cards + BONUS {{bonus}}%',
      preheader: 'Give the gift of choice - instant delivery, no wrapping needed!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 50px 20px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">💳✨💳</div>
              <h1 style="color: #8b4513; font-size: 36px; margin: 0;">Holiday Gift Cards</h1>
              <p style="color: #a0522d; font-size: 18px; margin: 10px 0 0 0;">The Perfect Present Every Time!</p>
            </div>
            <div style="padding: 40px; text-align: center;">
              <div style="background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); border-radius: 15px; padding: 30px; color: white; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 18px;">🎁 LIMITED TIME BONUS!</p>
                <p style="margin: 0; font-size: 48px; font-weight: bold;">+{{bonus}}% FREE</p>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Buy \${{amount}}, Get \${{bonus_amount}} FREE!</p>
              </div>

              <h3 style="color: #333; margin-bottom: 20px;">Why Give a Gift Card?</h3>

              <div style="text-align: left; margin-bottom: 30px;">
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                  <p style="margin: 0; color: #333;">⚡ <strong>Instant Delivery</strong> - Email or print instantly</p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                  <p style="margin: 0; color: #333;">🎯 <strong>Always Perfect</strong> - Let them choose what they love</p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                  <p style="margin: 0; color: #333;">📅 <strong>Never Expires</strong> - Good forever, no rush</p>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px;">
                  <p style="margin: 0; color: #333;">🎀 <strong>Beautifully Designed</strong> - Holiday themes available</p>
                </div>
              </div>

              <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">⏰ Bonus offer ends {{deadline}}</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #8b4513; padding: 18px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255,215,0,0.3);">🎁 Buy Gift Cards Now</a>

              <p style="color: #999; font-size: 14px; margin-top: 20px;">Perfect for the person who has everything! 🎄</p>
            </div>
          </div>
        </div>
      `,
      isPremium: true,
    },
    {
      id: 'post-christmas-clearance',
      name: 'Post-Christmas Clearance',
      category: 'seasonal',
      description: 'After-Christmas mega sale',
      thumbnail: '🏷️',
      subject: '🏷️ POST-CHRISTMAS CLEARANCE! Up to {{discount}}% OFF - Starts NOW!',
      preheader: 'Our biggest clearance event - everything must go!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; padding: 40px 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); padding: 50px 20px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 10px;">🏷️🔥🏷️</div>
              <h1 style="color: white; font-size: 32px; margin: 0; text-transform: uppercase;">Post-Christmas</h1>
              <h2 style="color: white; font-size: 48px; margin: 5px 0 0 0; text-transform: uppercase;">CLEARANCE</h2>
            </div>
            <div style="padding: 40px; text-align: center;">
              <div style="background: #000; border-radius: 15px; padding: 30px; margin-bottom: 30px;">
                <p style="color: #ff416c; font-size: 20px; margin: 0 0 10px 0;">EVERYTHING MUST GO!</p>
                <p style="color: white; font-size: 64px; font-weight: bold; margin: 0;">UP TO {{discount}}%</p>
                <p style="color: white; font-size: 28px; margin: 5px 0 0 0;">OFF EVERYTHING</p>
              </div>

              <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 30px; text-align: left;">
                <h3 style="color: #333; margin: 0 0 15px 0; text-align: center;">🔥 HOT DEALS:</h3>
                <div style="border-bottom: 1px solid #dee2e6; padding: 12px 0;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #333;">Holiday Decor</span>
                    <span style="color: #ff416c; font-weight: bold;">{{percent_1}}% OFF</span>
                  </div>
                </div>
                <div style="border-bottom: 1px solid #dee2e6; padding: 12px 0;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #333;">Winter Apparel</span>
                    <span style="color: #ff416c; font-weight: bold;">{{percent_2}}% OFF</span>
                  </div>
                </div>
                <div style="border-bottom: 1px solid #dee2e6; padding: 12px 0;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #333;">Gift Sets</span>
                    <span style="color: #ff416c; font-weight: bold;">{{percent_3}}% OFF</span>
                  </div>
                </div>
                <div style="padding: 12px 0;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #333;">Home & Living</span>
                    <span style="color: #ff416c; font-weight: bold;">{{percent_4}}% OFF</span>
                  </div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); border-radius: 10px; padding: 20px; color: white; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-size: 14px;">CLEARANCE CODE:</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 3px;">{{code}}</p>
              </div>

              <a href="{{shop_link}}" style="display: block; background: #000; color: white; padding: 20px; text-align: center; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 20px;">🛒 SHOP CLEARANCE NOW</a>

              <p style="color: #999; font-size: 14px; margin-top: 20px;">⚡ While supplies last - Don't wait!</p>
            </div>
          </div>
        </div>
      `,
      isPremium: false,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'promotional', name: 'Promotional' },
    { id: 'transactional', name: 'Transactional' },
    { id: 'newsletter', name: 'Newsletter' },
    { id: 'seasonal', name: 'Seasonal' },
    { id: 'onboarding', name: 'Onboarding' },
    { id: 'announcement', name: 'Announcements' },
    { id: 'retention', name: 'Re-engagement' },
    { id: 'engagement', name: 'Engagement' },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: EmailTemplate) => {
    // Store template data in localStorage and navigate
    localStorage.setItem('selectedEmailTemplate', JSON.stringify(template));
    router.push('/dashboard/email/create?template=' + template.id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Choose from professionally designed templates</p>
        </div>
        <Link href="/dashboard/email/create" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center">
              <div className="text-6xl">{template.thumbnail}</div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                {template.isPremium && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{template.description}</p>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {categories.find((c) => c.id === template.category)?.name}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500">
                  <strong>Subject:</strong> {template.subject.substring(0, 50)}...
                </div>
              </div>
              <button
                onClick={() => handleUseTemplate(template)}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition font-medium"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No templates found matching your criteria.
        </div>
      )}
    </div>
  );
}
