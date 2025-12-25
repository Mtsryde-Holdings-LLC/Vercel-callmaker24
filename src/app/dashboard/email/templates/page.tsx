"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const templates: EmailTemplate[] = [
    {
      id: "loyalty-invite",
      name: "Loyalty Program Invite",
      category: "promotional",
      description: "Invite customers to join your loyalty rewards program",
      thumbnail: "🏆",
      subject: "Join Our Exclusive Loyalty Rewards Program!",
      preheader: "Earn points, get rewards, and enjoy exclusive benefits",
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
      id: "welcome",
      name: "Welcome Series",
      category: "onboarding",
      description: "Warm welcome email for new subscribers",
      thumbnail: "🎉",
      subject: "Welcome to {{company_name}}! Get Started Today",
      preheader: "Thanks for joining us! Here's what to expect next.",
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
      id: "flash-sale",
      name: "Flash Sale Alert",
      category: "promotional",
      description: "Urgent limited-time offer announcement",
      thumbnail: "⚡",
      subject: "⚡ FLASH SALE: {{discount}}% OFF - Ends in {{hours}} Hours!",
      preheader: "Don't miss out on our biggest sale of the season!",
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
      id: "product-launch",
      name: "Product Launch",
      category: "announcement",
      description: "Introduce new products with style",
      thumbnail: "🚀",
      subject:
        "Introducing {{product_name}} - You've Never Seen Anything Like This",
      preheader: "The wait is over. Our newest innovation is here.",
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
      id: "newsletter",
      name: "Monthly Newsletter",
      category: "newsletter",
      description: "Keep subscribers informed and engaged",
      thumbnail: "📰",
      subject: "{{month}} Newsletter: What's New & Trending",
      preheader: "Your monthly dose of updates, tips, and exclusive content",
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
      id: "abandoned-cart",
      name: "Abandoned Cart",
      category: "transactional",
      description: "Recover lost sales with gentle reminders",
      thumbnail: "🛒",
      subject: "You left something behind... Complete your order now!",
      preheader:
        "Your items are waiting. Get {{discount}}% off if you order today.",
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
                <p style="margin: 0; color: #333; font-weight: bold; font-size: 18px;">${"$"}{{item_price}}</p>
              </div>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">Total:</p>
                <p style="margin: 0; color: #28a745; font-size: 24px; font-weight: bold;">${"$"}{{cart_total}}</p>
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
      id: "birthday",
      name: "Birthday Special",
      category: "seasonal",
      description: "Celebrate customer birthdays with offers",
      thumbnail: "🎂",
      subject: "Happy Birthday {{first_name}}! 🎉 Here's Your Special Gift",
      preheader:
        "Celebrate your special day with an exclusive birthday discount",
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
      id: "event-invite",
      name: "Event Invitation",
      category: "announcement",
      description: "Invite customers to special events",
      thumbnail: "🎟️",
      subject: "You're Invited! {{event_name}} - RSVP Now",
      preheader: "Join us for an exclusive event you won't want to miss",
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
      id: "christmas-greetings",
      name: "Christmas Greetings",
      category: "seasonal",
      description: "Heartfelt Christmas message with gratitude",
      thumbnail: "🎄",
      subject: "🎄 Merry Christmas from Our Family to Yours!",
      preheader: "Thank you for making this year so special",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header with Christmas Theme -->
          <div style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 50%, #b71c1c 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; font-size: 36px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎄 Merry Christmas! 🎄</h1>
            <p style="color: #ffe0e0; font-size: 18px; margin: 10px 0 0 0;">& Happy Holidays from All of Us!</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; line-height: 1.8;">Dear {{first_name}},</p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.8;">
              As we celebrate this wonderful season, we want to take a moment to express our heartfelt gratitude. <strong>Thank you</strong> for being an incredible part of our journey this year!
            </p>
            
            <!-- Thank You Section -->
            <div style="background: linear-gradient(to right, #fff3e0, #ffe0e0); border-left: 4px solid #d32f2f; padding: 20px; margin: 30px 0; border-radius: 5px;">
              <h3 style="color: #c62828; margin: 0 0 15px 0; font-size: 20px;">❤️ A Special Thank You</h3>
              <p style="color: #666; margin: 0; line-height: 1.8; font-size: 15px;">
                Your support, trust, and loyalty have meant the world to us. We wouldn't be here without amazing customers like you. You've made this year truly special, and we're so grateful to have you as part of our family.
              </p>
            </div>
            
            <!-- Holiday Wishes -->
            <div style="text-align: center; padding: 30px 0;">
              <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
                ✨ <strong>May your holidays be filled with:</strong> ✨
              </p>
              <div style="margin: 20px 0;">
                <p style="font-size: 16px; color: #d32f2f; line-height: 2;">
                  🎁 Joy • 🕊️ Peace • ❤️ Love • ⭐ Wonder<br>
                  🎉 Laughter • 🤗 Warmth • 🌟 Magic • 💫 Hope
                </p>
              </div>
            </div>
            
            <!-- Decorative Snowflakes -->
            <div style="text-align: center; font-size: 24px; margin: 20px 0; opacity: 0.7;">
              ❄️ ❄️ ❄️ ❄️ ❄️ ❄️ ❄️
            </div>
            
            <p style="font-size: 16px; color: #555; line-height: 1.8; text-align: center;">
              Wishing you and your loved ones a <strong>Merry Christmas</strong> and a <strong>Happy New Year</strong> filled with blessings and beautiful moments!
            </p>
            
            <!-- Signature -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #eeeeee; text-align: center;">
              <p style="font-size: 16px; color: #333; margin: 0;">
                With warmest wishes,<br>
                <strong style="color: #d32f2f; font-size: 18px;">{{company_name}} Team</strong>
              </p>
              <p style="font-size: 24px; margin: 15px 0 0 0;">🎅🎄🎁</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Thank you for being part of our community!<br>
              {{company_name}} | {{company_address}}
            </p>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: "holiday-special",
      name: "Holiday Special Offer",
      category: "seasonal",
      description: "Christmas sale with gratitude message",
      thumbnail: "🎅",
      subject: "🎁 Our Gift to You: Special Holiday Savings Inside!",
      preheader:
        "Thank you for an amazing year - enjoy exclusive holiday deals",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Festive Header -->
          <div style="background: linear-gradient(135deg, #1e7e34 0%, #28a745 50%, #5cb85c 100%); padding: 50px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; font-size: 42px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎅 Happy Holidays! 🎄</h1>
            <p style="color: #e6ffe6; font-size: 20px; margin: 15px 0 0 0;">A Special Thank You Gift Just for You!</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; line-height: 1.8;">Dear {{first_name}},</p>
            
            <!-- Gratitude Section -->
            <div style="background: linear-gradient(to bottom, #fff9e6, #ffffff); border: 2px solid #ffc107; padding: 25px; margin: 25px 0; border-radius: 10px; text-align: center;">
              <h2 style="color: #e65100; margin: 0 0 15px 0; font-size: 24px;">🙏 Thank You for an Amazing Year!</h2>
              <p style="color: #666; margin: 0; line-height: 1.8; font-size: 16px;">
                Your loyalty and support have made this year incredibly special. As our way of saying <strong>THANK YOU</strong>, we're excited to share our biggest holiday savings with you!
              </p>
            </div>
            
            <!-- Offer Box -->
            <div style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);">
              <p style="color: #ffe0e0; font-size: 16px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">🎁 Your Exclusive Gift</p>
              <h3 style="color: white; font-size: 48px; margin: 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">{{discount}}% OFF</h3>
              <p style="color: white; font-size: 20px; margin: 10px 0 0 0; font-weight: bold;">EVERYTHING IN STORE!</p>
              <div style="background: rgba(255,255,255,0.2); padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: white; margin: 0; font-size: 14px;">USE CODE:</p>
                <p style="color: white; font-size: 28px; font-weight: bold; margin: 5px 0; letter-spacing: 3px;">XMAS2025</p>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{shop_url}}" style="display: inline-block; background: linear-gradient(to right, #28a745, #5cb85c); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                🎁 Shop Holiday Deals Now
              </a>
            </div>
            
            <!-- Holiday Perks -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 20px 0; text-align: center;">✨ Plus, Enjoy These Holiday Perks:</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 10px; color: #666; font-size: 15px;">🚚 <strong>Free Shipping</strong> on orders over $50</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #666; font-size: 15px;">🎁 <strong>Gift Wrapping</strong> available at checkout</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #666; font-size: 15px;">⚡ <strong>Fast Delivery</strong> guaranteed before Christmas</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #666; font-size: 15px;">💝 <strong>Special Gifts</strong> with every purchase</td>
                </tr>
              </table>
            </div>
            
            <!-- Countdown -->
            <div style="text-align: center; background: #fff3cd; padding: 20px; border-radius: 10px; margin: 30px 0; border: 2px dashed #ffc107;">
              <p style="color: #856404; margin: 0; font-size: 16px;">⏰ <strong>Hurry! Offer ends December 31st</strong></p>
            </div>
            
            <!-- Closing Message -->
            <p style="font-size: 16px; color: #555; line-height: 1.8; text-align: center; margin: 30px 0;">
              From our family to yours, we wish you a season filled with joy, warmth, and wonderful memories. Thank you for choosing us and for being part of our community!
            </p>
            
            <!-- Signature -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #eeeeee; text-align: center;">
              <p style="font-size: 16px; color: #333; margin: 0;">
                Happy Holidays! 🎄❤️<br>
                <strong style="color: #28a745; font-size: 18px;">{{company_name}} Team</strong>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f5f5f5; padding: 25px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
              Questions? Contact us at {{support_email}} or call {{support_phone}}
            </p>
            <p style="color: #999; font-size: 12px; margin: 0;">
              {{company_name}} | {{company_address}}
            </p>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: "new-year-wishes",
      name: "Happy New Year",
      category: "seasonal",
      description: "New Year greeting with appreciation",
      thumbnail: "🎊",
      subject: "🎉 Happy New Year! Thank You for an Amazing 2025",
      preheader: "Cheers to new beginnings and continued partnership",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); padding: 50px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; font-size: 48px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎊 2026 🎊</h1>
            <p style="color: #e6f0ff; font-size: 24px; margin: 15px 0 0 0; font-weight: bold;">Happy New Year!</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; line-height: 1.8;">Dear {{first_name}},</p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.8;">
              As we bid farewell to 2025 and welcome the exciting possibilities of 2026, we want to express our deepest gratitude for your continued support and trust.
            </p>
            
            <!-- Thank You Box -->
            <div style="background: linear-gradient(to right, #fff3e0, #e1f5fe); border-left: 4px solid #6a11cb; padding: 25px; margin: 30px 0; border-radius: 5px;">
              <h3 style="color: #6a11cb; margin: 0 0 15px 0; font-size: 22px;">💙 A Heartfelt Thank You</h3>
              <p style="color: #666; margin: 0; line-height: 1.8; font-size: 15px;">
                <strong>You made 2025 extraordinary!</strong> Your loyalty, feedback, and enthusiasm have inspired us every step of the way. We're honored to have you as part of our community and excited to continue this journey together.
              </p>
            </div>
            
            <!-- New Year Wishes -->
            <div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 10px; margin: 30px 0;">
              <p style="font-size: 20px; color: #333; margin: 0 0 20px 0; font-weight: bold;">✨ Here's to 2026! ✨</p>
              <p style="font-size: 16px; color: #666; line-height: 2; margin: 0;">
                May this new year bring you:<br>
                🌟 Success • 💪 Strength • 😊 Happiness<br>
                🎯 Achievement • 💖 Love • 🌈 New Adventures
              </p>
            </div>
            
            <!-- Forward Looking -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin: 30px 0; text-align: center;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 24px;">🚀 Exciting Things Ahead!</h3>
              <p style="color: #e6e6ff; margin: 0; line-height: 1.8; font-size: 16px;">
                We have amazing surprises, new products, and exclusive offers planned for 2026. Stay tuned for what's coming - it's going to be our best year yet!
              </p>
            </div>
            
            <!-- Celebration -->
            <div style="text-align: center; font-size: 36px; margin: 30px 0;">
              🎉 🥂 🎊 🎈 🎆 🥳
            </div>
            
            <p style="font-size: 16px; color: #555; line-height: 1.8; text-align: center;">
              Thank you for being an incredible part of our story. Here's to health, happiness, and prosperity in the new year!
            </p>
            
            <!-- Signature -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #eeeeee; text-align: center;">
              <p style="font-size: 16px; color: #333; margin: 0;">
                Cheers to 2026! 🥂<br>
                <strong style="color: #6a11cb; font-size: 18px;">The {{company_name}} Family</strong>
              </p>
              <p style="font-size: 14px; color: #999; margin: 15px 0 0 0; font-style: italic;">
                "Thank you for making every day brighter!"
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              {{company_name}} | Wishing you a prosperous 2026!
            </p>
          </div>
        </div>
      `,
      isPremium: false,
    },
    {
      id: "referral",
      name: "Referral Program",
      category: "promotional",
      description: "Encourage customers to refer friends",
      thumbnail: "🎁",
      subject: "Give ${{amount}}, Get ${{amount}} - Share the Love!",
      preheader: "Refer a friend and you both get rewarded",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 72px; margin-bottom: 20px;">🎁</div>
            <h1 style="color: #333; font-size: 36px; margin: 0;">Share the Love!</h1>
            <p style="color: #666; font-size: 18px; margin-top: 10px;">Give ${"$"}{{amount}}, Get ${"$"}{{amount}}</p>
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
                <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6;">They get ${"$"}{{amount}} off their first purchase</p>
              </div>
              <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px;">
                <p style="margin: 0; font-size: 32px;">3️⃣</p>
                <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6;">You get ${"$"}{{amount}} credit after their purchase</p>
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
      id: "re-engagement",
      name: "We Miss You",
      category: "retention",
      description: "Win back inactive customers",
      thumbnail: "💙",
      subject:
        "We Miss You {{first_name}}! Here's {{discount}}% Off to Come Back",
      preheader: "It's been a while. Let's reconnect with a special offer.",
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
      id: "survey",
      name: "Customer Feedback",
      category: "engagement",
      description: "Gather valuable customer insights",
      thumbnail: "📊",
      subject: "We Value Your Opinion - Quick 2-Minute Survey",
      preheader:
        "Help us improve! Complete our survey and get a special thank you.",
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
      id: "seasonal-holiday",
      name: "Holiday Sale",
      category: "seasonal",
      description: "Festive holiday promotions",
      thumbnail: "🎄",
      subject: "🎄 Holiday Sale: Up to {{discount}}% OFF Everything!",
      preheader: "Celebrate the season with our biggest sale of the year",
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
      id: "thank-you",
      name: "Thank You",
      category: "transactional",
      description: "Show appreciation after purchase",
      thumbnail: "💜",
      subject: "Thank You for Your Order #{{order_number}}",
      preheader: "Your order is confirmed and on its way!",
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
                <p style="margin: 0; color: #333;">${"$"}{{subtotal}}</p>
              </div>
            </div>
            <div style="border-bottom: 1px solid #dee2e6; padding: 15px 0;">
              <div style="display: flex; justify-content: space-between;">
                <p style="margin: 0; color: #666;">Shipping:</p>
                <p style="margin: 0; color: #333;">${"$"}{{shipping}}</p>
              </div>
            </div>
            <div style="padding: 15px 0;">
              <div style="display: flex; justify-content: space-between;">
                <p style="margin: 0; color: #333; font-weight: bold; font-size: 18px;">Total:</p>
                <p style="margin: 0; color: #667eea; font-weight: bold; font-size: 18px;">${"$"}{{total}}</p>
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
  ];

  const categories = [
    { id: "all", name: "All Templates" },
    { id: "promotional", name: "Promotional" },
    { id: "transactional", name: "Transactional" },
    { id: "newsletter", name: "Newsletter" },
    { id: "seasonal", name: "Seasonal" },
    { id: "onboarding", name: "Onboarding" },
    { id: "announcement", name: "Announcements" },
    { id: "retention", name: "Re-engagement" },
    { id: "engagement", name: "Engagement" },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: EmailTemplate) => {
    // Store template data in localStorage and navigate
    localStorage.setItem("selectedEmailTemplate", JSON.stringify(template));
    router.push("/dashboard/email/create?template=" + template.id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">
            Choose from professionally designed templates
          </p>
        </div>
        <Link
          href="/dashboard/email/create"
          className="text-gray-600 hover:text-gray-900"
        >
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
                <h3 className="font-bold text-lg text-gray-900">
                  {template.name}
                </h3>
                {template.isPremium && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {template.description}
              </p>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {categories.find((c) => c.id === template.category)?.name}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500">
                  <strong>Subject:</strong> {template.subject.substring(0, 50)}
                  ...
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
