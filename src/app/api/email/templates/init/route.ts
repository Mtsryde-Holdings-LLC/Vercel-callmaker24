import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_EMAIL_TEMPLATES = [
  {
    name: "Loyalty Program Invite",
    category: "promotional",
    description: "Invite customers to join your loyalty rewards program",
    thumbnail: "🏆",
    subject: "Join Our Exclusive Loyalty Rewards Program!",
    preheader: "Earn points, get rewards, and enjoy exclusive benefits",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #7c3aed; text-align: center;">🏆 You're Invited!</h1><h2 style="text-align: center; color: #333;">Join Our Loyalty Rewards Program</h2><p style="font-size: 16px; line-height: 1.6; color: #555;">Dear Valued Customer,</p><p style="font-size: 16px; line-height: 1.6; color: #555;">We're excited to invite you to join our exclusive Loyalty Rewards Program!</p><div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;"><ul style="list-style: none; padding: 0;"><li style="padding: 10px 0; font-size: 16px;">✅ Earn points on every purchase</li><li style="padding: 10px 0; font-size: 16px;">✅ Exclusive member-only discounts</li><li style="padding: 10px 0; font-size: 16px;">🎂 Birthday rewards and special occasion bonuses</li><li style="padding: 10px 0; font-size: 16px;">✅ Early access to sales and new products</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="{{loyalty_signup_url}}" style="background: linear-gradient(to right, #7c3aed, #3b82f6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">Join Now - It's Free!</a></div></div>`,
    isPremium: false,
  },
  {
    name: "Welcome Series",
    category: "onboarding",
    description: "Warm welcome email for new subscribers",
    thumbnail: "🎉",
    subject: "Welcome to {{company_name}}! Get Started Today",
    preheader: "Thanks for joining us! Here's what to expect next.",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;"><div style="background: white; border-radius: 10px; padding: 40px;"><h1 style="color: #667eea; font-size: 32px; margin-bottom: 20px;">Welcome Aboard! 🎉</h1><p style="font-size: 18px; color: #333; line-height: 1.6;">Hi {{first_name}},</p><p style="font-size: 16px; color: #666; line-height: 1.8;">We're thrilled to have you as part of our community!</p><div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;"><h3 style="color: #333; margin-bottom: 15px;">What's Next?</h3><ul style="list-style: none; padding: 0;"><li style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">✓ Complete your profile</li><li style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">✓ Explore our features</li><li style="padding: 10px 0;">✓ Join our community</li></ul></div><a href="{{cta_link}}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Get Started</a></div></div>`,
    isPremium: false,
  },
  {
    name: "Flash Sale Alert",
    category: "promotional",
    description: "Urgent limited-time offer announcement",
    thumbnail: "⚡",
    subject: "⚡ FLASH SALE: {{discount}}% OFF - Ends in {{hours}} Hours!",
    preheader: "Don't miss out on our biggest sale of the season!",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; padding: 40px 20px;"><div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; padding: 40px; text-align: center;"><h1 style="color: white; font-size: 42px; margin: 20px 0; text-transform: uppercase;">Flash Sale!</h1><div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 30px; margin: 30px 0;"><p style="color: white; font-size: 64px; font-weight: bold; margin: 0;">{{discount}}% OFF</p><p style="color: white; font-size: 24px; margin: 10px 0;">Everything Store-Wide</p></div><div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 20px; margin: 20px 0;"><p style="color: #f5576c; font-size: 18px; font-weight: bold; margin: 0;">⏰ Ends in {{hours}} Hours!</p></div><a href="{{shop_link}}" style="display: inline-block; background: white; color: #f5576c; padding: 20px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0;">SHOP NOW</a></div></div>`,
    isPremium: false,
  },
  {
    name: "Product Launch",
    category: "announcement",
    description: "Introduce new products with style",
    thumbnail: "🚀",
    subject:
      "Introducing {{product_name}} - You've Never Seen Anything Like This",
    preheader: "The wait is over. Our newest innovation is here.",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 0;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 20px; text-align: center;"><h1 style="color: white; font-size: 48px; margin: 0; text-transform: uppercase;">New Launch 🚀</h1></div><div style="background: white; padding: 40px;"><h2 style="color: #333; font-size: 32px; margin-bottom: 20px;">Introducing {{product_name}}</h2><p style="font-size: 18px; color: #666; line-height: 1.8;">{{product_description}}</p><div style="background: #667eea; color: white; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;"><p style="font-size: 16px; margin: 0 0 10px 0;">Special Launch Price</p><p style="font-size: 48px; font-weight: bold; margin: 0;">$\{{price}}</p></div><a href="{{product_link}}" style="display: block; background: #667eea; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Pre-Order Now</a></div></div>`,
    isPremium: false,
  },
  {
    name: "Monthly Newsletter",
    category: "newsletter",
    description: "Keep subscribers informed and engaged",
    thumbnail: "📰",
    subject: "{{month}} Newsletter: What's New & Trending",
    preheader: "Your monthly dose of updates, tips, and exclusive content",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;"><div style="background: #2c3e50; padding: 30px; text-align: center;"><h1 style="color: white; font-size: 36px; margin: 0;">📰 {{month}} Newsletter</h1><p style="color: #ecf0f1; margin: 10px 0 0 0;">{{company_name}} Monthly Update</p></div><div style="padding: 40px 20px;"><h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">What's New This Month</h2><div style="margin: 30px 0;"><h3 style="color: #3498db; font-size: 20px;">📌 Feature Update</h3><p style="color: #666; line-height: 1.8;">{{feature_description}}</p></div><div style="margin: 30px 0;"><h3 style="color: #3498db; font-size: 20px;">💡 Tips & Tricks</h3><p style="color: #666; line-height: 1.8;">{{tips_content}}</p></div></div></div>`,
    isPremium: false,
  },
  {
    name: "Abandoned Cart",
    category: "transactional",
    description: "Recover lost sales with gentle reminders",
    thumbnail: "🛒",
    subject: "You left something behind... Complete your order now!",
    preheader:
      "Your items are waiting. Get {{discount}}% off if you order today.",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 40px;"><div style="font-size: 64px;">🛒</div><h1 style="color: #333; font-size: 32px; margin: 20px 0;">Don't Forget Your Items!</h1><p style="color: #666; font-size: 18px;">Hi {{first_name}}, you left some great items in your cart.</p></div><div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; padding: 20px; text-align: center; color: white; margin: 30px 0;"><p style="margin: 0; font-size: 20px; font-weight: bold;">🎁 SPECIAL OFFER</p><p style="margin: 10px 0 0 0; font-size: 16px;">Complete your order in the next 24 hours and get {{discount}}% OFF!</p></div><a href="{{checkout_link}}" style="display: block; background: #28a745; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Complete Your Purchase</a></div>`,
    isPremium: false,
  },
  {
    name: "Birthday Special",
    category: "seasonal",
    description: "Celebrate customer birthdays with offers",
    thumbnail: "🎂",
    subject: "Happy Birthday {{first_name}}! 🎉 Here's Your Special Gift",
    preheader: "Celebrate your special day with an exclusive birthday discount",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 40px 20px;"><div style="background: white; border-radius: 15px; padding: 40px; text-align: center;"><div style="font-size: 80px; margin-bottom: 20px;">🎂</div><h1 style="color: #ff6b6b; font-size: 36px; margin: 20px 0;">Happy Birthday {{first_name}}! 🎉</h1><p style="color: #666; font-size: 18px; line-height: 1.8;">We hope your special day is filled with joy!</p><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 40px; margin: 30px 0; color: white;"><p style="margin: 0 0 10px 0; font-size: 18px;">🎁 Your Birthday Gift</p><p style="margin: 0; font-size: 56px; font-weight: bold;">{{discount}}% OFF</p><p style="margin: 10px 0 0 0; font-size: 16px;">+ Free Shipping on Any Order</p></div><a href="{{shop_link}}" style="display: inline-block; background: #ff6b6b; color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0;">Claim Your Gift</a></div></div>`,
    isPremium: false,
  },
  {
    name: "Event Invitation",
    category: "announcement",
    description: "Invite customers to special events",
    thumbnail: "🎟️",
    subject: "You're Invited! {{event_name}} - RSVP Now",
    preheader: "Join us for an exclusive event you won't want to miss",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px 20px;"><div style="background: white; border-radius: 10px; overflow: hidden;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 20px; text-align: center; color: white;"><div style="font-size: 64px; margin-bottom: 20px;">🎟️</div><h1 style="margin: 0; font-size: 32px;">YOU'RE INVITED</h1></div><div style="padding: 40px;"><h2 style="color: #333; font-size: 28px; text-align: center; margin-bottom: 30px;">{{event_name}}</h2><div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;"><p style="color: #667eea; font-weight: bold; margin: 0; font-size: 14px;">📅 DATE & TIME</p><p style="color: #333; margin: 5px 0 0 0; font-size: 18px;">{{event_date}} at {{event_time}}</p></div><a href="{{rsvp_link}}" style="display: block; background: #667eea; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">RSVP Now</a></div></div></div>`,
    isPremium: false,
  },
  {
    name: "Christmas Greetings",
    category: "seasonal",
    description: "Heartfelt Christmas message with gratitude",
    thumbnail: "🎄",
    subject: "🎄 Merry Christmas from Our Family to Yours!",
    preheader: "Thank you for making this year so special",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 50%, #b71c1c 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; font-size: 36px; margin: 0;">🎄 Merry Christmas! 🎄</h1><p style="color: #ffe0e0; font-size: 18px; margin: 10px 0 0 0;">& Happy Holidays from All of Us!</p></div><div style="background: white; padding: 40px 30px;"><p style="font-size: 18px; color: #333; line-height: 1.8;">Dear {{first_name}},</p><p style="font-size: 16px; color: #555; line-height: 1.8;">As we celebrate this wonderful season, we want to express our heartfelt gratitude. Thank you for being an incredible part of our journey this year!</p><div style="text-align: center; padding: 30px 0;"><p style="font-size: 16px; color: #d32f2f; line-height: 2;">🎁 Joy • 🕊️ Peace • ❤️ Love • ⭐ Wonder</p></div><div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #eeeeee; text-align: center;"><p style="font-size: 16px; color: #333; margin: 0;">With warmest wishes,<br><strong style="color: #d32f2f; font-size: 18px;">{{company_name}} Team</strong></p></div></div></div>`,
    isPremium: false,
  },
  {
    name: "Holiday Special Offer",
    category: "seasonal",
    description: "Christmas sale with gratitude message",
    thumbnail: "🎅",
    subject: "🎁 Our Gift to You: Special Holiday Savings Inside!",
    preheader: "Thank you for an amazing year - enjoy exclusive holiday deals",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #1e7e34 0%, #28a745 50%, #5cb85c 100%); padding: 50px 20px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; font-size: 42px; margin: 0;">🎅 Happy Holidays! 🎄</h1><p style="color: #e6ffe6; font-size: 20px; margin: 15px 0 0 0;">A Special Thank You Gift Just for You!</p></div><div style="background: white; padding: 40px 30px;"><div style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0;"><p style="color: #ffe0e0; font-size: 16px; margin: 0 0 10px 0;">🎁 Your Exclusive Gift</p><h3 style="color: white; font-size: 48px; margin: 10px 0;">{{discount}}% OFF</h3><p style="color: white; font-size: 20px; margin: 10px 0 0 0; font-weight: bold;">EVERYTHING IN STORE!</p></div><div style="text-align: center; margin: 40px 0;"><a href="{{shop_url}}" style="display: inline-block; background: linear-gradient(to right, #28a745, #5cb85c); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 20px; font-weight: bold;">🎁 Shop Holiday Deals Now</a></div></div></div>`,
    isPremium: false,
  },
  {
    name: "Happy New Year",
    category: "seasonal",
    description: "New Year greeting with appreciation",
    thumbnail: "🎊",
    subject: "🎉 Happy New Year! Thank You for an Amazing Year",
    preheader: "Cheers to new beginnings and continued partnership",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); padding: 50px 20px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; font-size: 48px; margin: 0;">🎊 2026 🎊</h1><p style="color: #e6f0ff; font-size: 24px; margin: 15px 0 0 0; font-weight: bold;">Happy New Year!</p></div><div style="background: white; padding: 40px 30px;"><p style="font-size: 18px; color: #333; line-height: 1.8;">Dear {{first_name}},</p><p style="font-size: 16px; color: #555; line-height: 1.8;">As we welcome the exciting possibilities of the new year, we want to express our deepest gratitude for your continued support and trust.</p><div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 10px; margin: 30px 0;"><p style="font-size: 16px; color: #666; line-height: 2; margin: 0;">🌟 Success • 💪 Strength • 😊 Happiness • 🎯 Achievement • 💖 Love • 🌈 New Adventures</p></div><div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #eeeeee; text-align: center;"><p style="font-size: 16px; color: #333; margin: 0;">Cheers! 🥂<br><strong style="color: #6a11cb; font-size: 18px;">The {{company_name}} Family</strong></p></div></div></div>`,
    isPremium: false,
  },
  {
    name: "Referral Program",
    category: "promotional",
    description: "Encourage customers to refer friends",
    thumbnail: "🎁",
    subject: "Give & Get - Share the Love!",
    preheader: "Refer a friend and you both get rewarded",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 40px;"><div style="font-size: 72px; margin-bottom: 20px;">🎁</div><h1 style="color: #333; font-size: 36px; margin: 0;">Share the Love!</h1></div><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 40px; color: white; margin: 30px 0;"><h2 style="margin: 0 0 20px 0; font-size: 24px; text-align: center;">Here's How It Works</h2><p style="margin: 10px 0; font-size: 16px;">1️⃣ Share your unique referral link with friends</p><p style="margin: 10px 0; font-size: 16px;">2️⃣ They get a discount on their first purchase</p><p style="margin: 10px 0; font-size: 16px;">3️⃣ You get credit after their purchase</p></div><div style="text-align: center;"><a href="{{share_link}}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">Share Now</a></div></div>`,
    isPremium: true,
  },
  {
    name: "We Miss You",
    category: "retention",
    description: "Win back inactive customers",
    thumbnail: "💙",
    subject:
      "We Miss You {{first_name}}! Here's {{discount}}% Off to Come Back",
    preheader: "It's been a while. Let's reconnect with a special offer.",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 40px 20px;"><div style="background: white; border-radius: 15px; padding: 40px; text-align: center;"><div style="font-size: 80px; margin-bottom: 20px;">💙</div><h1 style="color: #333; font-size: 36px; margin: 20px 0;">We Miss You!</h1><p style="color: #666; font-size: 18px; line-height: 1.8;">Hey {{first_name}}, it's been a while since we last saw you.</p><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; color: white; margin: 30px 0;"><p style="margin: 0 0 10px 0; font-size: 18px;">Welcome Back Offer</p><p style="margin: 0; font-size: 48px; font-weight: bold;">{{discount}}% OFF</p></div><a href="{{shop_link}}" style="display: inline-block; background: #667eea; color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0;">Come Back & Save</a></div></div>`,
    isPremium: true,
  },
  {
    name: "Thank You",
    category: "transactional",
    description: "Show appreciation after purchase",
    thumbnail: "💜",
    subject: "Thank You for Your Order #{{order_number}}",
    preheader: "Your order is confirmed and on its way!",
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;"><div style="text-align: center; margin-bottom: 40px;"><div style="font-size: 80px; margin-bottom: 20px;">💜</div><h1 style="color: #333; font-size: 36px; margin: 0;">Thank You!</h1><p style="color: #666; font-size: 18px; margin-top: 10px;">Your order has been confirmed</p></div><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; color: white; margin: 30px 0; text-align: center;"><p style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Order Number</p><p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;">{{order_number}}</p></div><a href="{{tracking_link}}" style="display: block; background: #667eea; color: white; padding: 18px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 30px 0;">Track Your Order</a></div>`,
    isPremium: true,
  },
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Check if templates already exist
    const existing = await prisma.emailTemplate.count({
      where: { organizationId: session.user.organizationId },
    });

    if (existing > 0) {
      return NextResponse.json(
        { error: "Templates already initialized", count: existing },
        { status: 400 },
      );
    }

    const templates = await Promise.all(
      DEFAULT_EMAIL_TEMPLATES.map((template) =>
        prisma.emailTemplate.create({
          data: {
            ...template,
            isDefault: true,
            organizationId: session.user.organizationId!,
            createdById: session.user.id,
          },
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    console.error("Email Templates init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize templates" },
      { status: 500 },
    );
  }
}
