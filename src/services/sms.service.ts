import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { checkSmsRateLimit } from "@/lib/sms-rate-limit";
import { logger } from "@/lib/logger";
import { withRetry, RETRY_CONFIGS } from "@/lib/retry";

// Lazy-init Twilio client
let _smsClient: ReturnType<typeof twilio> | null = null;
function getSmsClient() {
  if (!_smsClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("Twilio credentials not configured");
    }
    _smsClient = twilio(sid, token);
  }
  return _smsClient;
}

export interface SendSmsOptions {
  to: string;
  message: string;
  from?: string;
  mediaUrl?: string[];
}

export class SmsService {
  /**
   * Send a single SMS with customer data sync
   */
  static async send(
    options: SendSmsOptions & {
      userId?: string;
      organizationId?: string;
      campaignId?: string;
    },
  ) {
    try {
      // Format phone number to E.164
      let formattedPhone = options.to;
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+1" + formattedPhone.replace(/\D/g, "");
      }

      logger.debug("Sending SMS", {
        route: "sms-service",
      });

      // Find or create customer by phone
      let customer = await prisma.customer.findFirst({
        where: {
          phone: options.to,
          organizationId: options.organizationId,
        },
      });

      if (!customer && options.userId) {
        customer = await prisma.customer.create({
          data: {
            phone: options.to,
            firstName: "Unknown",
            lastName: "Contact",
            organizationId: options.organizationId,
            createdById: options.userId,
          },
        });
      }

      // Check rate limit if customer exists
      if (customer) {
        const rateLimit = await checkSmsRateLimit(
          customer.id,
          options.organizationId,
        );

        if (!rateLimit.allowed) {
          logger.info(`Rate limit exceeded for customer ${customer.id}`, {
            route: "sms-service",
          });
          return {
            success: false,
            error: "Rate limit exceeded",
            rateLimitInfo: {
              messagesSentToday: rateLimit.messagesSentToday,
              remainingCooldown: rateLimit.remainingCooldown,
              lastMessageAt: rateLimit.lastMessageAt,
            },
          };
        }
      }

      const messageData: any = {
        body: options.message,
        to: formattedPhone,
        mediaUrl: options.mediaUrl,
        statusCallback: `${process.env.NEXTAUTH_URL}/api/webhooks/twilio/sms/status`,
      };

      messageData.from = options.from || process.env.TWILIO_PHONE_NUMBER;

      const message = await withRetry(
        () => getSmsClient().messages.create(messageData),
        RETRY_CONFIGS.twilio,
      );

      logger.info(`SMS sent successfully: ${message.sid}`, {
        route: "sms-service",
      });

      // Log to database if successful and customer exists
      if (customer) {
        await prisma.smsMessage.create({
          data: {
            campaignId: options.campaignId,
            customerId: customer.id,
            from: message.from,
            to: message.to,
            message: options.message,
            direction: "OUTBOUND",
            status: "SENT",
            twilioSid: message.sid,
            sentAt: new Date(),
            organizationId: options.organizationId,
          },
        });

        // Log customer activity
        await prisma.customerActivity.create({
          data: {
            type: "SMS_SENT",
            description: `SMS sent: ${options.message.substring(0, 50)}...`,
            customerId: customer.id,
            metadata: { twilioSid: message.sid },
          },
        });
      }

      return {
        success: true,
        data: {
          sid: message.sid,
          status: message.status,
          to: message.to,
          from: message.from,
          customer: customer,
        },
      };
    } catch (error: any) {
      logger.error("SMS send error", { route: "sms-service" }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send batch SMS
   */
  static async sendBatch(messages: SendSmsOptions[]) {
    try {
      const promises = messages.map((msg) => this.send(msg));
      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return {
        success: true,
        total: messages.length,
        successful,
        failed,
        results,
      };
    } catch (error: any) {
      logger.error("Batch SMS error", { route: "sms-service" }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle incoming SMS webhook
   */
  static async handleIncoming(data: any) {
    try {
      const { From, To, Body, MessageSid } = data;

      // Find or create customer
      const customer = await prisma.customer.findFirst({
        where: { phone: From },
      });

      if (customer) {
        // Create SMS message record
        await prisma.smsMessage.create({
          data: {
            customerId: customer.id,
            from: From,
            to: To,
            message: Body,
            direction: "INBOUND",
            status: "DELIVERED",
            twilioSid: MessageSid,
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
        });

        // Create activity
        await prisma.customerActivity.create({
          data: {
            customerId: customer.id,
            type: "SMS_RECEIVED",
            description: `Received SMS: ${Body.substring(0, 50)}...`,
            metadata: { from: From, to: To },
          },
        });
      }

      return { success: true };
    } catch (error: any) {
      logger.error(
        "Handle incoming SMS error",
        { route: "sms-service" },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Get SMS status
   */
  static async getStatus(messageSid: string) {
    try {
      const message = await getSmsClient().messages(messageSid).fetch();

      return {
        success: true,
        data: {
          sid: message.sid,
          status: message.status,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
        },
      };
    } catch (error: any) {
      logger.error("Get SMS status error", { route: "sms-service" }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send OTP for authentication
   */
  static async sendOtp(phone: string, code: string) {
    return this.send({
      to: phone,
      message: `Your verification code is: ${code}. Valid for 10 minutes.`,
    });
  }
}
