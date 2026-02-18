import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withRetry, RETRY_CONFIGS } from "@/lib/retry";

// Lazy-init Twilio client to avoid crash on missing env vars
let _twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
  if (!_twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error(
        "Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)",
      );
    }
    _twilioClient = twilio(sid, token);
  }
  return _twilioClient;
}

export interface IvrCallOptions {
  to: string;
  from?: string;
  menuId?: string;
}

export class VoiceService {
  /**
   * Initiate an outbound call with customer data sync
   */
  static async initiateCall(
    options: IvrCallOptions & { userId?: string; organizationId?: string },
  ) {
    try {
      // Find or create customer by phone number
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
            lastName: "Caller",
            organizationId: options.organizationId,
            createdById: options.userId,
          },
        });
      }

      const call = await withRetry(
        () =>
          getTwilioClient().calls.create({
            to: options.to,
            from: options.from || process.env.TWILIO_PHONE_NUMBER!,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/ivr${
              options.menuId ? `?menuId=${options.menuId}` : ""
            }`,
            statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/status`,
            statusCallbackEvent: [
              "initiated",
              "ringing",
              "answered",
              "completed",
            ],
            record: true,
          }),
        RETRY_CONFIGS.twilio,
      );

      // Create call record with customer link
      const callRecord = await prisma.call.create({
        data: {
          twilioCallSid: call.sid,
          direction: "OUTBOUND",
          status: "INITIATED",
          from: call.from,
          to: call.to,
          customerId: customer?.id,
          assignedToId: options.userId,
          organizationId: options.organizationId,
          startedAt: new Date(),
        },
      });

      // Log customer activity
      if (customer) {
        await prisma.customerActivity.create({
          data: {
            type: "CALL_MADE",
            description: `Outbound call initiated to ${options.to}`,
            customerId: customer.id,
            metadata: { callId: callRecord.id, twilioSid: call.sid },
          },
        });
      }

      return {
        success: true,
        data: {
          callSid: call.sid,
          callId: callRecord.id,
          status: call.status,
          customer: customer,
        },
      };
    } catch (error: any) {
      logger.error("Initiate call error", { route: "voice-service" }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate TwiML for IVR menu
   */
  static async generateIvrTwiml(menuId?: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse;

    try {
      let menu;
      if (menuId) {
        menu = await prisma.ivrMenu.findUnique({
          where: { id: menuId, isActive: true },
        });
      }

      const twiml = new VoiceResponse();

      if (menu) {
        const gather = twiml.gather({
          numDigits: 1,
          action: "/api/voice/handle-key",
          method: "POST",
        });

        gather.say({ voice: "alice" }, menu.welcomeText);
      } else {
        // Default menu
        const gather = twiml.gather({
          numDigits: 1,
          action: "/api/voice/handle-key",
          method: "POST",
        });

        gather.say(
          { voice: "alice" },
          "Welcome! Press 1 for sales, 2 for support, or 3 to speak with an agent.",
        );
      }

      twiml.say({ voice: "alice" }, "We did not receive any input. Goodbye!");

      return twiml.toString();
    } catch (error: any) {
      logger.error("Generate TwiML error", { route: "voice-service" }, error);
      throw error;
    }
  }

  /**
   * Handle IVR keypress
   */
  static async handleKeyPress(digit: string, callSid: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    try {
      // Update call record with IVR path
      await prisma.call.update({
        where: { twilioCallSid: callSid },
        data: {
          ivrPath: {
            push: digit,
          },
        },
      });

      switch (digit) {
        case "1":
          twiml.say({ voice: "alice" }, "Connecting you to sales.");
          twiml.dial("+1234567890"); // Sales number
          break;
        case "2":
          twiml.say({ voice: "alice" }, "Connecting you to support.");
          twiml.dial("+1234567891"); // Support number
          break;
        case "3":
          twiml.say({ voice: "alice" }, "Please hold while we connect you.");
          twiml.enqueue("AgentQueue");
          break;
        default:
          twiml.say({ voice: "alice" }, "Invalid option. Goodbye.");
          twiml.hangup();
      }

      return twiml.toString();
    } catch (error: any) {
      logger.error("Handle keypress error", { route: "voice-service" }, error);
      twiml.say({ voice: "alice" }, "An error occurred. Please try again.");
      return twiml.toString();
    }
  }

  /**
   * Update call status
   */
  static async updateCallStatus(callSid: string, status: string, data?: any) {
    try {
      const updateData: any = {
        status: status.toUpperCase().replace("-", "_"),
      };

      if (status === "completed") {
        updateData.endedAt = new Date();
        if (data?.CallDuration) {
          updateData.duration = parseInt(data.CallDuration);
        }
        if (data?.RecordingUrl) {
          updateData.recordingUrl = data.RecordingUrl;
        }
      } else if (status === "in-progress") {
        updateData.answeredAt = new Date();
      }

      await prisma.call.update({
        where: { twilioCallSid: callSid },
        data: updateData,
      });

      return { success: true };
    } catch (error: any) {
      logger.error(
        "Update call status error",
        { route: "voice-service" },
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Get call recording
   */
  static async getRecording(callSid: string) {
    try {
      const recordings = await getTwilioClient().recordings.list({
        callSid,
        limit: 1,
      });

      if (recordings.length > 0) {
        const recording = recordings[0];
        return {
          success: true,
          data: {
            url: `https://api.twilio.com${recording.uri.replace(".json", ".mp3")}`,
            duration: recording.duration,
            sid: recording.sid,
          },
        };
      }

      return { success: false, error: "No recording found" };
    } catch (error: any) {
      logger.error("Get recording error", { route: "voice-service" }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transcribe call recording
   */
  static async transcribeRecording(recordingSid: string) {
    try {
      // Use Twilio's transcription service or integrate with external service
      const recording = await getTwilioClient()
        .recordings(recordingSid)
        .fetch();

      // If transcription is available
      if ((recording as any).transcriptions) {
        return {
          success: true,
          data: (recording as any).transcriptions,
        };
      }

      return { success: false, error: "Transcription not available" };
    } catch (error: any) {
      logger.error("Transcribe error", { route: "voice-service" }, error);
      return { success: false, error: error.message };
    }
  }
}
