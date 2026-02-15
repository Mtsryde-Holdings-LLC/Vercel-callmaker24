import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { ShopifyEcommerceService } from "@/services/shopify-ecommerce.service";
import { RETURN_WINDOW_DAYS, REFUND_PROCESSING_DAYS, PRICING } from "@/lib/constants";

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (
    !apiKey ||
    apiKey === "your-openai-api-key-here" ||
    apiKey === "placeholder" ||
    !apiKey.startsWith("sk-")
  ) {
    return null;
  }
  return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationId,
      widgetId,
      customerId,
      customerEmail,
      customerPhone,
    } = body;

    let customerData = null;
    let isVerified = false;

    // Verify customer identity if ID or contact info provided
    if (customerId || customerEmail || customerPhone) {
      const whereClause: any = {};
      if (customerId) whereClause.id = customerId;
      if (customerEmail) whereClause.email = customerEmail;
      if (customerPhone) whereClause.phone = customerPhone;

      customerData = await prisma.customer.findFirst({
        where: whereClause,
        include: {
          emailMessages: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          smsMessages: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          calls: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          orders: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          organization: {
            select: {
              name: true,
              settings: true,
            },
          },
        },
      });

      if (customerData) {
        isVerified = true;
      }
    }

    // Generate AI response based on customer context
    const openai = getOpenAIClient();
    let botResponse =
      "I'm here to help! Could you provide more details about your question?";

    const lowerMessage = message.toLowerCase();

    // Build context for AI
    let systemPrompt = `You are a helpful customer service assistant for ${
      customerData?.organization?.name || "CallMaker24"
    }.

CallMaker24 is a SaaS platform that offers:
- Email & SMS marketing campaigns
- Call center tools with AI
- CRM & customer management
- Social media management
- AI-powered chatbots
- IVR systems

Pricing:
- Starter: $${PRICING.STARTER.monthly}/month
- Professional: $${PRICING.PRO.monthly}/month
- Enterprise: $${PRICING.ENTERPRISE.monthly}/month

Shipping Policy:
- Standard Shipping: 5-7 business days
- Express Shipping: 2-3 business days
- Overnight Shipping: 1 business day
- Free shipping on orders over $50

Refund Policy:
- Full refund within ${RETURN_WINDOW_DAYS} days of purchase
- Items must be unused and in original packaging
- Digital products are non-refundable after download
- Processing time: ${REFUND_PROCESSING_DAYS} business days after approval
- Refunds issued to original payment method

Return Process:
1. Contact customer service with order number
2. Receive return authorization (RA) number
3. Ship item back with RA number
4. Refund processed upon receipt and inspection

Be professional, helpful, and concise. If you don't know something, admit it politely.

ECOMMERCE CAPABILITIES:
You are connected to the customer's ecommerce account (Shopify). You can:
1. Look up order status with real-time tracking information
2. Show order details including items, shipping status, and tracking numbers
3. Process return requests for eligible orders (within 30 days, items must be unused)
4. Check existing return request status

When a customer asks about orders, tracking, returns, or refunds:
- If they provide an order number, look it up directly
- If they don't, show their recent orders and ask which one they mean
- For returns, confirm the order number and reason before processing
- Always provide tracking links when available

RETURN POLICY DETAILS:
- Returns accepted within 30 days of purchase
- Items must be unused and in original packaging
- A Return Authorization (RA) number will be provided
- Customer ships item back with RA number visible
- Refund processed within 5-10 business days after receipt
- Refunds go to original payment method`;

    let userContext = "";

    // Add customer-specific context if verified
    if (isVerified && customerData) {
      systemPrompt += `\n\nIMPORTANT: This customer is VERIFIED. You have access to their account information, order history, and can perform ecommerce operations like order lookups and return requests on their behalf.`;

      const name = `${customerData.firstName || ""} ${
        customerData.lastName || ""
      }`.trim();
      userContext = `\n\nCustomer Information:
- Name: ${name || "Not provided"}
- Email: ${customerData.email || "Not provided"}
- Phone: ${customerData.phone || "Not provided"}
- Company: ${customerData.company || "Not provided"}
- Loyalty Member: ${customerData.loyaltyMember ? "Yes" : "No"}
${
  customerData.loyaltyMember
    ? `- Loyalty Tier: ${customerData.loyaltyTier || "BRONZE"}`
    : ""
}
${
  customerData.loyaltyMember
    ? `- Loyalty Points: ${customerData.loyaltyPoints || 0}`
    : ""
}
- Total Spent: $${customerData.totalSpent?.toFixed(2) || "0.00"}
- Order Count: ${customerData.orderCount || 0}
- Email opt-in: ${customerData.emailOptIn ? "Yes" : "No"}
- SMS opt-in: ${customerData.smsOptIn ? "Yes" : "No"}`;

      if (customerData.lastOrderAt) {
        userContext += `\n- Last order: ${new Date(
          customerData.lastOrderAt,
        ).toLocaleDateString()}`;
      }

      if (customerData.orders && customerData.orders.length > 0) {
        userContext += `\n\nRecent Orders (from database):`;
        customerData.orders.slice(0, 5).forEach((order: any, index: number) => {
          userContext += `\n${index + 1}. Order #${
            order.orderNumber || order.id.slice(-6)
          }
   - Status: ${order.status}
   - Financial: ${order.financialStatus || "N/A"}
   - Total: $${order.total?.toFixed(2)}
   - Date: ${new Date(order.createdAt).toLocaleDateString()}
   - Items: ${Array.isArray(order.items) ? order.items.length : "N/A"} item(s)`;
        });
      }
    } else if (
      lowerMessage.includes("my account") ||
      lowerMessage.includes("my info") ||
      lowerMessage.includes("my order") ||
      lowerMessage.includes("track") ||
      lowerMessage.includes("return") ||
      lowerMessage.includes("refund") ||
      lowerMessage.includes("where is my")
    ) {
      // Customer asking for personal/order info but not verified — try to extract email
      const emailMatch = message.match(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
      );
      if (emailMatch) {
        // Try to look up customer by extracted email
        customerData = await prisma.customer.findFirst({
          where: { email: emailMatch[1].toLowerCase() },
          include: {
            orders: { orderBy: { createdAt: "desc" }, take: 10 },
            organization: { select: { name: true, settings: true } },
          },
        });
        if (customerData) {
          isVerified = true;
          // Re-build context with the found customer
          const name =
            `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
          userContext = `\n\nCustomer verified via email. Name: ${name}, Email: ${customerData.email}`;
          if (customerData.orders?.length > 0) {
            userContext += `\nRecent Orders:`;
            customerData.orders.slice(0, 5).forEach((order: any, i: number) => {
              userContext += `\n${i + 1}. Order #${order.orderNumber || order.id.slice(-6)} — ${order.status} — $${order.total?.toFixed(2)}`;
            });
          }
        }
      }

      if (!isVerified) {
        botResponse =
          `To access your orders and account, I'll need to verify your identity.\n\n` +
          `Please provide your email address so I can look up your account.\n\n` +
          `For example: "My email is john@example.com"`;

        return NextResponse.json({
          id: Date.now().toString(),
          response: botResponse,
          message: botResponse,
          timestamp: new Date().toISOString(),
          conversationId: conversationId || `conv_${Date.now()}`,
          widgetId: widgetId || null,
          isVerified: false,
          customerName: null,
        });
      }
    }

    // Handle unsubscribe requests directly (requires database update)
    if (
      isVerified &&
      customerData &&
      (lowerMessage === "1" || lowerMessage === "2" || lowerMessage === "3")
    ) {
      const updates: any = {};
      if (lowerMessage === "1") {
        updates.emailOptIn = false;
        botResponse = "You have been unsubscribed from email communications.";
      } else if (lowerMessage === "2") {
        updates.smsOptIn = false;
        botResponse = "You have been unsubscribed from SMS communications.";
      } else if (lowerMessage === "3") {
        updates.emailOptIn = false;
        updates.smsOptIn = false;
        botResponse = "You have been unsubscribed from all communications.";
      }

      await prisma.customer.update({
        where: { id: customerData.id },
        data: updates,
      });

      return NextResponse.json({
        id: Date.now().toString(),
        response: botResponse,
        message: botResponse,
        timestamp: new Date().toISOString(),
        conversationId: conversationId || `conv_${Date.now()}`,
        widgetId: widgetId || null,
        isVerified: true,
        customerName: `${customerData.firstName || ""} ${
          customerData.lastName || ""
        }`.trim(),
      });
    }

    // === ECOMMERCE FUNCTION CALLING ===
    // Detect ecommerce-related intents and query Shopify in real-time
    if (isVerified && customerData) {
      const ecommerceResult = await handleEcommerceQuery(
        message,
        lowerMessage,
        customerData,
      );
      if (ecommerceResult) {
        userContext += `\n\n=== LIVE ECOMMERCE DATA ===\n${ecommerceResult}`;
      }
    }

    // Use OpenAI if available, otherwise fall back to rule-based
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt + userContext,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        });

        botResponse = completion.choices[0]?.message?.content || botResponse;
      } catch (error) {
        console.error("OpenAI API error:", error);
        // Fall through to rule-based response
      }
    } else {
      // Rule-based fallback responses
      if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
        botResponse =
          `Our pricing starts at $${PRICING.STARTER.monthly}/month for the Starter plan. We also offer Professional ($${PRICING.PRO.monthly}/mo) and Enterprise ($${PRICING.ENTERPRISE.monthly}/mo) plans. Would you like to see all features?`;
      } else if (lowerMessage.includes("shipping")) {
        if (
          isVerified &&
          customerData?.orders &&
          customerData.orders.length > 0
        ) {
          const recentOrder = customerData.orders[0];
          botResponse =
            `For your most recent order (#${
              recentOrder.orderNumber || recentOrder.id.slice(-6)
            }):\n\n` +
            `Status: ${recentOrder.status}\n` +
            `Total: $${recentOrder.total?.toFixed(2)}\n\n` +
            `Our shipping policy:\n` +
            `• Standard: 5-7 business days\n` +
            `• Express: 2-3 business days\n` +
            `• Overnight: 1 business day\n` +
            `• Free shipping on orders over $50`;
        } else {
          botResponse =
            `Our shipping options:\n` +
            `• Standard Shipping: 5-7 business days\n` +
            `• Express Shipping: 2-3 business days\n` +
            `• Overnight Shipping: 1 business day\n` +
            `• Free shipping on orders over $50\n\n` +
            `Need to track a specific order? Please verify your account with your email or phone number.`;
        }
      } else if (
        lowerMessage.includes("refund") ||
        lowerMessage.includes("return")
      ) {
        if (
          isVerified &&
          customerData?.orders &&
          customerData.orders.length > 0
        ) {
          botResponse =
            `Our refund policy:\n\n` +
            `✓ Full refund within ${RETURN_WINDOW_DAYS} days of purchase\n` +
            `✓ Items must be unused and in original packaging\n` +
            `✓ Processing time: ${REFUND_PROCESSING_DAYS} business days\n` +
            `✓ Refunds issued to original payment method\n\n` +
            `To start a return:\n` +
            `1. Provide your order number\n` +
            `2. Receive return authorization (RA) number\n` +
            `3. Ship item back with RA number\n\n` +
            `Which order would you like to return?`;

          if (customerData.orders.length > 0) {
            botResponse += `\n\nYour recent orders:\n`;
            customerData.orders
              .slice(0, 3)
              .forEach((order: any, index: number) => {
                botResponse += `${index + 1}. Order #${
                  order.orderNumber || order.id.slice(-6)
                } - ${order.status} - $${order.total?.toFixed(2)}\n`;
              });
          }
        } else {
          botResponse =
            `Our refund policy:\n\n` +
            `✓ Full refund within ${RETURN_WINDOW_DAYS} days of purchase\n` +
            `✓ Items must be unused and in original packaging\n` +
            `✓ Digital products are non-refundable after download\n` +
            `✓ Processing time: ${REFUND_PROCESSING_DAYS} business days\n` +
            `✓ Refunds issued to original payment method\n\n` +
            `To process a return, please verify your account by providing your email or phone number.`;
        }
      } else if (
        isVerified &&
        customerData &&
        (lowerMessage.includes("order") || lowerMessage.includes("purchase"))
      ) {
        if (customerData.orders && customerData.orders.length > 0) {
          const orderCount = customerData.orders.length;
          botResponse = `You have ${orderCount} order${
            orderCount > 1 ? "s" : ""
          } with us:\n\n`;

          customerData.orders
            .slice(0, 5)
            .forEach((order: any, index: number) => {
              const statusEmoji =
                order.status === "FULFILLED"
                  ? "✅"
                  : order.status === "PENDING"
                    ? "⏳"
                    : order.status === "PAID"
                      ? "💳"
                      : order.status === "CANCELLED"
                        ? "❌"
                        : "📦";
              botResponse += `${index + 1}. ${statusEmoji} Order #${
                order.orderNumber || order.id.slice(-6)
              }\n`;
              botResponse += `   Status: ${order.status}\n`;
              botResponse += `   Total: $${order.total?.toFixed(2)}\n`;
              botResponse += `   Date: ${new Date(
                order.createdAt,
              ).toLocaleDateString()}\n\n`;
            });

          botResponse += `Need details on a specific order? Just ask!`;
        } else {
          botResponse = `You don't have any orders with us yet. Would you like to browse our products or services?`;
        }
      } else if (lowerMessage.includes("track") && isVerified && customerData) {
        if (customerData.orders && customerData.orders.length > 0) {
          const recentOrder = customerData.orders[0];
          botResponse =
            `Your most recent order:\n\n` +
            `📦 Order #${
              recentOrder.orderNumber || recentOrder.id.slice(-6)
            }\n` +
            `Status: ${recentOrder.status}\n` +
            `Date: ${new Date(recentOrder.createdAt).toLocaleDateString()}\n` +
            `Total: $${recentOrder.total?.toFixed(2)}\n\n`;

          if (recentOrder.status === "FULFILLED") {
            botResponse += `✅ Your order has been fulfilled and shipped!`;
          } else if (recentOrder.status === "PAID") {
            botResponse += `💳 Payment received. We're preparing your order for shipment.`;
          } else if (recentOrder.status === "PENDING") {
            botResponse += `⏳ Your order is being processed.`;
          } else if (recentOrder.status === "CANCELLED") {
            botResponse += `❌ This order was cancelled.`;
          }
        } else {
          botResponse = `You don't have any orders to track yet.`;
        }
      } else if (
        lowerMessage.includes("feature") ||
        lowerMessage.includes("what can")
      ) {
        botResponse =
          "CallMaker24 offers:\n\n• Email & SMS campaigns\n• Call center tools with AI\n• CRM & customer management\n• Social media management\n• AI-powered chatbots\n• IVR systems\n\nWhich feature interests you?";
      } else if (
        lowerMessage.includes("help") ||
        lowerMessage.includes("support")
      ) {
        botResponse =
          "I'm here to help! " +
          (isVerified
            ? "As a verified customer, I can help you with account info, order history, and more. "
            : "") +
          "What do you need assistance with?";
      } else if (
        lowerMessage.includes("hello") ||
        lowerMessage.includes("hi")
      ) {
        const greeting =
          isVerified && customerData
            ? `Hello ${customerData.firstName || "there"}!`
            : "Hello!";
        botResponse = `${greeting} How can I help you today?`;
      } else if (lowerMessage.includes("thank")) {
        botResponse =
          "You're welcome! Is there anything else I can help you with?";
      } else if (
        isVerified &&
        customerData &&
        (lowerMessage.includes("my account") ||
          lowerMessage.includes("my info"))
      ) {
        const name = `${customerData.firstName || ""} ${
          customerData.lastName || ""
        }`.trim();
        botResponse =
          `Hello ${name}! Here's your account information:\n\n` +
          `📧 Email: ${customerData.email || "Not provided"}\n` +
          `📱 Phone: ${customerData.phone || "Not provided"}\n` +
          `🏢 Company: ${customerData.company || "Not provided"}\n` +
          `✉️ Email opt-in: ${customerData.emailOptIn ? "Yes" : "No"}\n` +
          `📲 SMS opt-in: ${customerData.smsOptIn ? "Yes" : "No"}\n\n` +
          `How can I help you today?`;
      } else if (
        isVerified &&
        customerData &&
        (lowerMessage.includes("my emails") ||
          lowerMessage.includes("email history"))
      ) {
        const emailCount = customerData.emailMessages?.length || 0;
        botResponse =
          `You have received ${emailCount} emails from us. ` +
          (emailCount > 0
            ? `The most recent was sent on ${new Date(
                customerData.emailMessages[0].createdAt,
              ).toLocaleDateString()}.`
            : "We haven't sent you any emails yet.");
      } else if (
        isVerified &&
        customerData &&
        (lowerMessage.includes("my calls") ||
          lowerMessage.includes("call history"))
      ) {
        const callCount = customerData.calls?.length || 0;
        botResponse =
          `You have ${callCount} call records with us. ` +
          (callCount > 0
            ? `Your last call was on ${new Date(
                customerData.calls[0].createdAt,
              ).toLocaleDateString()}.`
            : "We haven't had any calls yet.");
      } else if (
        isVerified &&
        customerData &&
        (lowerMessage.includes("unsubscribe") ||
          lowerMessage.includes("opt out"))
      ) {
        botResponse =
          `I can help you with that. Would you like to:\n\n` +
          `1. Unsubscribe from emails\n` +
          `2. Unsubscribe from SMS\n` +
          `3. Unsubscribe from both\n\n` +
          `Please reply with 1, 2, or 3.`;
      }
    }

    // Save conversation and messages to database
    if (customerData) {
      let conversation = await prisma.chatConversation.findFirst({
        where: {
          customerId: customerData.id,
          status: "OPEN",
        },
      });

      if (!conversation) {
        conversation = await prisma.chatConversation.create({
          data: {
            customerId: customerData.id,
            organizationId: customerData.organizationId,
            status: "OPEN",
            lastMessageAt: new Date(),
          },
        });
      }

      // Save customer message
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          sender: "CUSTOMER",
          content: message,
        },
      });

      // Save bot response
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          sender: "BOT",
          content: botResponse,
          aiGenerated: true,
          aiModel: openai ? "gpt-4o-mini" : "rule-based",
        },
      });

      // Log customer activity
      await prisma.customerActivity.create({
        data: {
          type: "CHAT_STARTED",
          description: `Chat message: ${message.substring(0, 50)}...`,
          customerId: customerData.id,
          metadata: { conversationId: conversation.id },
        },
      });

      // Update conversation timestamp
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    const responseData = {
      id: Date.now().toString(),
      response: botResponse,
      message: botResponse,
      timestamp: new Date().toISOString(),
      conversationId: conversationId || `conv_${Date.now()}`,
      widgetId: widgetId || null,
      isVerified,
      customerName: customerData
        ? `${customerData.firstName || ""} ${
            customerData.lastName || ""
          }`.trim()
        : null,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 },
    );
  }
}

/**
 * Handle ecommerce-related queries by fetching live data from Shopify.
 * Returns additional context string to inject into the AI prompt,
 * or null if the message isn't ecommerce-related.
 */
async function handleEcommerceQuery(
  message: string,
  lowerMessage: string,
  customerData: any,
): Promise<string | null> {
  const orgId = customerData.organizationId;
  if (!orgId) return null;

  // Detect order number in message (e.g., #1042, order 1042, order number 1042)
  const orderNumMatch = message.match(
    /(?:order\s*(?:#|number|num|no\.?)?\s*|#)(\d{3,})/i,
  );
  const orderNumber = orderNumMatch ? orderNumMatch[1] : null;

  // Detect RA number (e.g., RA-ABC123)
  const raMatch = message.match(/RA-[A-Z0-9-]+/i);
  const raNumber = raMatch ? raMatch[0].toUpperCase() : null;

  // === ORDER STATUS LOOKUP ===
  if (
    orderNumber ||
    lowerMessage.includes("order status") ||
    lowerMessage.includes("where is my order") ||
    lowerMessage.includes("track") ||
    lowerMessage.includes("shipping status") ||
    lowerMessage.includes("delivery") ||
    lowerMessage.includes("when will") ||
    lowerMessage.includes("has my order")
  ) {
    try {
      const orders = await ShopifyEcommerceService.lookupOrderStatus({
        organizationId: orgId,
        customerId: customerData.id,
        customerEmail: customerData.email,
        orderNumber: orderNumber || undefined,
      });

      if (orders.length === 0) {
        return (
          "No orders found for this customer" +
          (orderNumber ? ` with order number #${orderNumber}` : "") +
          ". The customer may need to double-check the order number."
        );
      }

      let context = `LIVE ORDER DATA (fetched from Shopify in real-time):\n`;
      for (const order of orders.slice(0, 5)) {
        context += ShopifyEcommerceService.formatOrderForChat(order) + "\n";
      }

      if (orders.length > 5) {
        context += `\n... and ${orders.length - 5} more orders.`;
      }

      return context;
    } catch (error) {
      console.error("[Chatbot Ecommerce] Order lookup error:", error);
      return null;
    }
  }

  // === RETURN REQUEST ===
  if (
    lowerMessage.includes("return") ||
    lowerMessage.includes("refund") ||
    lowerMessage.includes("send back") ||
    lowerMessage.includes("exchange")
  ) {
    let context = "";

    // Check for existing return requests
    const existingReturns = await ShopifyEcommerceService.getReturnStatus({
      customerId: customerData.id,
      raNumber: raNumber || undefined,
    });

    if (existingReturns.length > 0) {
      context += `EXISTING RETURN REQUESTS:\n`;
      existingReturns.forEach((r) => {
        context += `  • ${r.raNumber} — Order #${r.orderNumber} — Status: ${r.status} — Reason: ${r.reason}\n`;
        if (r.refundAmount)
          context += `    Refund amount: $${r.refundAmount}\n`;
        if (r.resolvedAt)
          context += `    Resolved: ${new Date(r.resolvedAt).toLocaleDateString()}\n`;
      });
      context += "\n";
    }

    // Check if they want to START a return and provided an order number + reason
    const reasonPatterns = [
      /(?:because|reason|due to|for)\s+(.+?)(?:\.|$)/i,
      /(?:defective|damaged|wrong|broken|doesn'?t fit|too (?:small|big|large)|not what|changed my mind|don'?t (?:want|need|like))/i,
    ];

    let reason: string | null = null;
    for (const pattern of reasonPatterns) {
      const match = message.match(pattern);
      if (match) {
        reason = match[1] || match[0];
        break;
      }
    }

    if (
      orderNumber &&
      reason &&
      (lowerMessage.includes("return") || lowerMessage.includes("send back"))
    ) {
      // Process the return
      const result = await ShopifyEcommerceService.createReturnRequest({
        customerId: customerData.id,
        organizationId: orgId,
        orderNumber,
        reason,
      });

      if (result.success) {
        context += `RETURN REQUEST CREATED SUCCESSFULLY:\n`;
        context += `  RA Number: ${result.returnRequest!.raNumber}\n`;
        context += `  Order: #${result.returnRequest!.orderNumber}\n`;
        context += `  Reason: ${result.returnRequest!.reason}\n`;
        context += `  Status: PENDING\n`;
        context += `  Order Total: $${result.returnRequest!.orderTotal?.toFixed(2)}\n\n`;
        context += `INSTRUCTIONS TO GIVE CUSTOMER:\n`;
        context += `1. Write RA number "${result.returnRequest!.raNumber}" on the package\n`;
        context += `2. Ship the item(s) back in original packaging\n`;
        context += `3. Refund will be processed within 5-10 business days after we receive the item\n`;
      } else {
        context += `RETURN REQUEST FAILED: ${result.error}\n`;
      }
    } else if (orderNumber && !reason) {
      context += `Customer wants to return order #${orderNumber} but hasn't provided a reason yet. Ask them why they want to return the item.\n`;
    } else if (!orderNumber) {
      // Show their orders so they can pick one to return
      const orders = await ShopifyEcommerceService.lookupOrderStatus({
        organizationId: orgId,
        customerId: customerData.id,
        customerEmail: customerData.email,
      });

      if (orders.length > 0) {
        context += `Customer wants to process a return but hasn't specified which order. Here are their eligible orders:\n`;
        orders
          .filter((o) => o.status !== "CANCELLED")
          .slice(0, 5)
          .forEach((o) => {
            const orderDate = new Date(o.orderDate);
            const daysSince = Math.floor(
              (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            const eligible = daysSince <= 30;
            context += `  • Order #${o.orderNumber} — $${o.total.toFixed(2)} — ${o.status} — ${eligible ? "✅ Eligible" : "❌ Past 30-day window"}\n`;
          });
        context += `\nAsk the customer which order they want to return and the reason.\n`;
      }
    }

    return context || null;
  }

  // === CHECK RETURN STATUS ===
  if (raNumber) {
    const returns = await ShopifyEcommerceService.getReturnStatus({
      customerId: customerData.id,
      raNumber,
    });

    if (returns.length > 0) {
      let context = `RETURN REQUEST STATUS:\n`;
      returns.forEach((r) => {
        context += `  RA Number: ${r.raNumber}\n`;
        context += `  Order: #${r.orderNumber}\n`;
        context += `  Status: ${r.status}\n`;
        context += `  Reason: ${r.reason}\n`;
        if (r.refundAmount) context += `  Refund: $${r.refundAmount}\n`;
        context += `  Submitted: ${new Date(r.createdAt).toLocaleDateString()}\n`;
      });
      return context;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    // In production, fetch from database
    const mockConversation = {
      id: conversationId || "conv_1",
      messages: [
        {
          id: "1",
          text: "Hello! How can I help you today?",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return NextResponse.json(mockConversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}
