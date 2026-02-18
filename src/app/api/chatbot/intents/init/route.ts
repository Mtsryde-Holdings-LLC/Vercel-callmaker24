import { NextRequest } from "next/server";
import { withApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const DEFAULT_INTENTS = [
  {
    name: "Greeting",
    examples: ["hello", "hi", "hey", "good morning"],
    response: "Hello! How can I help you today?",
    confidence: 0.95,
    priority: 10,
  },
  {
    name: "Pricing Question",
    examples: ["how much", "pricing", "cost", "price plans"],
    response:
      "Our pricing starts at $49.99/month for the Starter plan. Would you like to see all our plans?",
    confidence: 0.92,
    priority: 5,
  },
  {
    name: "Support Request",
    examples: ["help", "support", "issue", "problem"],
    response:
      "I'm here to help! Can you describe the issue you're experiencing?",
    confidence: 0.88,
    priority: 8,
  },
  {
    name: "Feature Inquiry",
    examples: ["features", "what can you do", "capabilities"],
    response:
      "CallMaker24 offers email campaigns, SMS marketing, call center tools, IVR systems, and more!",
    confidence: 0.9,
    priority: 3,
  },
  {
    name: "Order Status",
    examples: ["where is my order", "order status", "track order", "delivery"],
    response:
      "I can help you track your order. Could you provide your order number?",
    confidence: 0.91,
    priority: 7,
  },
  {
    name: "Return Policy",
    examples: ["return", "refund", "exchange", "return policy"],
    response:
      "We offer a 30-day return policy on all items. Would you like to start a return?",
    confidence: 0.89,
    priority: 6,
  },
  {
    name: "Business Hours",
    examples: ["hours", "open", "when are you open", "business hours"],
    response:
      "Our support team is available Monday-Friday 9 AM - 6 PM EST. How can I assist you?",
    confidence: 0.93,
    priority: 4,
  },
  {
    name: "Goodbye",
    examples: ["bye", "goodbye", "thanks bye", "see you"],
    response: "Thank you for contacting us! Have a great day! 😊",
    confidence: 0.95,
    priority: 1,
  },
];

export const POST = withApiHandler(
  async (_req: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    const existing = await prisma.chatbotIntent.count({
      where: { organizationId },
    });

    if (existing > 0) {
      return apiError('Intents already initialized', {
        status: 400,
        requestId,
        meta: { count: existing },
      });
    }

    const intents = await Promise.all(
      DEFAULT_INTENTS.map((intent) =>
        prisma.chatbotIntent.create({
          data: {
            ...intent,
            organizationId,
            createdById: session.user.id,
          },
        }),
      ),
    );

    return apiSuccess({ success: true, count: intents.length, intents }, { requestId });
  },
  { route: 'POST /api/chatbot/intents/init', rateLimit: RATE_LIMITS.standard }
);
