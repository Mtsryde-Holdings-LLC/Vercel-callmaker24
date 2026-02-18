import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const DEFAULT_SMS_TEMPLATES = [
  {
    name: "Flash Sale Alert",
    category: "promotional",
    description: "Urgent limited-time offer",
    message:
      "⚡ FLASH SALE! Get {{discount}}% OFF everything for the next {{hours}} hours! Use code: {{code}} 🛍️ Shop now: {{link}}",
    emoji: "⚡",
    tags: ["urgent", "discount", "limited-time"],
  },
  {
    name: "New Arrival",
    category: "promotional",
    description: "Announce new products",
    message:
      "🎉 NEW ARRIVAL! {{product_name}} just dropped! Be the first to get yours 👉 {{link}}",
    emoji: "🎉",
    tags: ["new", "product", "announcement"],
  },
  {
    name: "Cart Reminder",
    category: "transactional",
    description: "Recover abandoned carts",
    message:
      "🛒 Oops! You left {{item_count}} item(s) behind. Complete your order now & get {{discount}}% off! {{link}}",
    emoji: "🛒",
    tags: ["cart", "reminder", "discount"],
  },
  {
    name: "Order Shipped",
    category: "transactional",
    description: "Shipping confirmation",
    message:
      "📦 Great news {{first_name}}! Your order #{{order_number}} is on its way! Track it here: {{tracking_link}}",
    emoji: "📦",
    tags: ["shipping", "confirmation", "tracking"],
  },
  {
    name: "Appointment Reminder",
    category: "reminder",
    description: "Upcoming appointment alert",
    message:
      "⏰ Reminder: Your appointment is tomorrow at {{time}}! Reply YES to confirm or call us at {{phone}} 📞",
    emoji: "⏰",
    tags: ["appointment", "reminder", "confirmation"],
  },
  {
    name: "Birthday Wish",
    category: "seasonal",
    description: "Birthday greeting with offer",
    message:
      "🎂 Happy Birthday {{first_name}}! 🎉 Here's {{discount}}% OFF as our gift to you! Valid for {{days}} days 🎁 {{link}}",
    emoji: "🎂",
    tags: ["birthday", "special", "discount"],
  },
  {
    name: "Thank You",
    category: "engagement",
    description: "Show appreciation",
    message:
      "💙 Thank you for your purchase! We appreciate you! Here's {{reward_points}} bonus points for your next order 🎁",
    emoji: "💙",
    tags: ["thanks", "loyalty", "appreciation"],
  },
  {
    name: "VIP Exclusive",
    category: "promotional",
    description: "Exclusive VIP offer",
    message:
      "👑 VIP ONLY! Early access to our sale starts NOW! Get {{discount}}% off before everyone else 🔥 {{link}}",
    emoji: "👑",
    tags: ["vip", "exclusive", "early-access"],
  },
  {
    name: "Contest Winner",
    category: "engagement",
    description: "Contest winner notification",
    message:
      "🎊 CONGRATULATIONS {{first_name}}! You're our winner! 🏆 Claim your prize: {{prize}} Reply NOW to collect! 🎉",
    emoji: "🎊",
    tags: ["winner", "contest", "prize"],
  },
  {
    name: "Welcome Message",
    category: "onboarding",
    description: "Welcome new subscribers",
    message:
      "👋 Welcome to {{company_name}}! Get {{discount}}% off your first order with code: {{code}} 🎁 Start shopping: {{link}}",
    emoji: "👋",
    tags: ["welcome", "new-customer", "discount"],
  },
  {
    name: "Last Chance",
    category: "promotional",
    description: "Urgency-driven final notice",
    message:
      "⏳ LAST CHANCE! Sale ends in {{hours}} hours! Don't miss out on {{discount}}% OFF everything! 🏃 {{link}}",
    emoji: "⏳",
    tags: ["urgent", "last-chance", "fomo"],
  },
  {
    name: "Event Reminder",
    category: "reminder",
    description: "Upcoming event notification",
    message:
      "🎪 Don't forget! {{event_name}} is {{when}}! We saved your spot 🎟️ Details: {{link}} See you there! 🙌",
    emoji: "🎪",
    tags: ["event", "reminder", "rsvp"],
  },
  {
    name: "Feedback Request",
    category: "engagement",
    description: "Ask for customer review",
    message:
      "⭐ Hey {{first_name}}! How was your experience? Rate us in 30 seconds & get {{reward}} 🎁 {{survey_link}}",
    emoji: "⭐",
    tags: ["feedback", "review", "survey"],
  },
  {
    name: "Back in Stock",
    category: "promotional",
    description: "Product availability alert",
    message:
      "🚨 BACK IN STOCK! {{product_name}} is available again! Grab yours before it's gone 🏃💨 {{link}}",
    emoji: "🚨",
    tags: ["restock", "product", "alert"],
  },
  {
    name: "Referral Program",
    category: "engagement",
    description: "Encourage referrals",
    message:
      "🎁 Share the love! Refer a friend & you both get {{reward}}! Your unique link: {{referral_link}} 💸",
    emoji: "🎁",
    tags: ["referral", "reward", "sharing"],
  },
  {
    name: "Weekend Special",
    category: "promotional",
    description: "Weekend-only promotion",
    message:
      "🌞 WEEKEND VIBES! This weekend only: {{discount}}% OFF + FREE shipping! 📦 No code needed 👉 {{link}}",
    emoji: "🌞",
    tags: ["weekend", "special", "limited-time"],
  },
  {
    name: "Loyalty Reward",
    category: "engagement",
    description: "Reward loyal customers",
    message:
      "💎 You're a VIP now! Enjoy {{discount}}% OFF for life + exclusive perks 🎁 Welcome to the club! {{link}}",
    emoji: "💎",
    tags: ["loyalty", "vip", "reward"],
  },
  {
    name: "Double Points",
    category: "promotional",
    description: "Points multiplier promotion",
    message:
      "⚡ 2X POINTS TODAY! Every purchase earns double rewards 🎯 Shop now & watch your points grow! {{link}}",
    emoji: "⚡",
    tags: ["points", "rewards", "double"],
  },
  {
    name: "Christmas Greetings",
    category: "seasonal",
    description: "Merry Christmas with thank you message",
    message:
      "🎄 Merry Christmas {{first_name}}! Thank you for being part of our family this year. Wishing you joy, peace & love! 🎁❤️",
    emoji: "🎄",
    tags: ["christmas", "holiday", "gratitude"],
  },
  {
    name: "Holiday Thank You",
    category: "seasonal",
    description: "Holiday appreciation message",
    message:
      "✨ Happy Holidays from all of us! 🎉 Thank you for your incredible support this year. Here's to an amazing 2026! 🥂",
    emoji: "✨",
    tags: ["holidays", "thanks", "new-year"],
  },
  {
    name: "Christmas Special Offer",
    category: "seasonal",
    description: "Christmas sale with gratitude",
    message:
      "🎅 Merry Christmas! As a thank you, enjoy {{discount}}% OFF our Christmas sale! 🎁 Use code: XMAS2025 Shop: {{link}} ❄️",
    emoji: "🎅",
    tags: ["christmas", "sale", "discount"],
  },
  {
    name: "Free Shipping",
    category: "promotional",
    description: "Free shipping promotion",
    message:
      "🚚 FREE SHIPPING alert! No minimum purchase required today only! Stock up now 📦 {{link}}",
    emoji: "🚚",
    tags: ["free-shipping", "limited-time", "promotion"],
  },
  {
    name: "Mystery Discount",
    category: "promotional",
    description: "Gamified discount offer",
    message:
      "🎰 SPIN TO WIN! Your mystery discount is waiting: {{discount_range}}% OFF! Reveal it now 🎲 {{link}}",
    emoji: "🎰",
    tags: ["gamification", "mystery", "fun"],
  },
  {
    name: "Holiday Sale",
    category: "seasonal",
    description: "Holiday promotion",
    message:
      "🎄 HOLIDAY MAGIC! Celebrate with {{discount}}% OFF sitewide! Limited time only 🎅 Shop: {{link}}",
    emoji: "🎄",
    tags: ["holiday", "seasonal", "christmas"],
  },
  {
    name: "Payment Due",
    category: "transactional",
    description: "Friendly payment reminder",
    message:
      "💳 Friendly reminder: Payment of ${{amount}} is due {{date}}. Pay now to avoid late fees 👉 {{payment_link}}",
    emoji: "💳",
    tags: ["payment", "billing", "reminder"],
  },
  {
    name: "Delivery Today",
    category: "transactional",
    description: "Same-day delivery notification",
    message:
      "🚗 Heads up! Your order arrives TODAY between {{time_range}}! Make sure someone's home 🏠 Track: {{link}}",
    emoji: "🚗",
    tags: ["delivery", "urgent", "tracking"],
  },
  {
    name: "Price Drop Alert",
    category: "promotional",
    description: "Wishlist price reduction",
    message:
      "💰 PRICE DROP! {{product_name}} just got cheaper! Now ${{new_price}} (was ${{old_price}}) 🔥 {{link}}",
    emoji: "💰",
    tags: ["price-drop", "wishlist", "deal"],
  },
  {
    name: "Low Stock Alert",
    category: "promotional",
    description: "Scarcity-driven urgency",
    message:
      "⚠️ ALMOST GONE! Only {{quantity}} left of {{product_name}}! Don't miss out 🏃 Order now: {{link}}",
    emoji: "⚠️",
    tags: ["scarcity", "urgent", "low-stock"],
  },
  {
    name: "Customer Anniversary",
    category: "seasonal",
    description: "Celebrate customer loyalty",
    message:
      "🎊 It's been {{years}} amazing year(s) together! Here's {{discount}}% OFF to celebrate YOU 💜 {{link}}",
    emoji: "🎊",
    tags: ["anniversary", "loyalty", "milestone"],
  },
  {
    name: "Flash Giveaway",
    category: "engagement",
    description: "Quick contest entry",
    message:
      '🎁 FLASH GIVEAWAY! Reply "YES" in the next hour to enter & win {{prize}}! Act fast ⚡ Winners announced at {{time}}',
    emoji: "🎁",
    tags: ["giveaway", "contest", "interactive"],
  },
  {
    name: "Order Ready",
    category: "transactional",
    description: "Pickup notification",
    message:
      "✅ {{first_name}}, your order #{{order_number}} is ready for pickup! Come get it at {{location}} 📍 Hours: {{hours}}",
    emoji: "✅",
    tags: ["pickup", "ready", "local"],
  },
  {
    name: "Subscription Reminder",
    category: "transactional",
    description: "Renewal notification",
    message:
      "🔔 Your {{plan_name}} subscription renews on {{date}} for ${{amount}}. Update payment: {{link}} Questions? Reply!",
    emoji: "🔔",
    tags: ["subscription", "renewal", "billing"],
  },
  {
    name: "Members Only",
    category: "promotional",
    description: "Exclusive member offer",
    message:
      "🌟 MEMBERS ONLY! Secret sale just for you: {{discount}}% OFF + early access! Don't tell anyone 🤫 {{link}}",
    emoji: "🌟",
    tags: ["members", "exclusive", "secret"],
  },
  {
    name: "Quick Survey",
    category: "engagement",
    description: "Short feedback with reward",
    message:
      "📋 Quick favor! Take our 2-minute survey & get ${{reward}} off your next order 💰 {{survey_link}} Thanks!",
    emoji: "📋",
    tags: ["survey", "feedback", "incentive"],
  },
];

export const POST = withApiHandler(
  async (
    req: NextRequest,
    { session, organizationId, requestId }: ApiContext,
  ) => {
    // Check if templates already exist
    const existing = await prisma.smsTemplate.count({
      where: { organizationId },
    });

    if (existing > 0) {
      return apiError("Templates already initialized", {
        status: 400,
        meta: { count: existing },
        requestId,
      });
    }

    const templates = await Promise.all(
      DEFAULT_SMS_TEMPLATES.map((template) =>
        prisma.smsTemplate.create({
          data: {
            ...template,
            isDefault: true,
            organizationId,
            createdById: session.user.id,
          },
        }),
      ),
    );

    return apiSuccess({ count: templates.length, templates }, { requestId });
  },
  { route: "POST /api/sms/templates/init" },
);
