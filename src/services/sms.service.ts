import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export interface SendSmsOptions {
  to: string
  message: string
  from?: string
  mediaUrl?: string[]
}

export class SmsService {
  /**
   * Send a single SMS with customer data sync
   */
  static async send(options: SendSmsOptions & { userId?: string, organizationId?: string, campaignId?: string }) {
    try {
      // Format phone number to E.164
      let formattedPhone = options.to
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
      }
      
      console.log('Sending SMS:', { to: formattedPhone, from: options.from || process.env.TWILIO_PHONE_NUMBER })
      
      // Find or create customer by phone
      let customer = await prisma.customer.findFirst({
        where: {
          phone: options.to,
          organizationId: options.organizationId
        }
      })

      if (!customer && options.userId) {
        customer = await prisma.customer.create({
          data: {
            phone: options.to,
            firstName: 'Unknown',
            lastName: 'Contact',
            organizationId: options.organizationId,
            createdById: options.userId
          }
        })
      }

      const messageData: any = {
        body: options.message,
        to: formattedPhone,
        mediaUrl: options.mediaUrl,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms/status`,
      }

      // Use Messaging Service if available, otherwise use phone number
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        messageData.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
      } else {
        messageData.from = options.from || process.env.TWILIO_PHONE_NUMBER
      }

      const message = await client.messages.create(messageData)
      
      console.log('SMS sent successfully:', message.sid)

      // Log to database if successful and customer exists
      if (customer) {
        await prisma.smsMessage.create({
          data: {
            campaignId: options.campaignId,
            customerId: customer.id,
            from: message.from,
            to: message.to,
            message: options.message,
            direction: 'OUTBOUND',
            status: 'SENT',
            twilioSid: message.sid,
            sentAt: new Date(),
            organizationId: options.organizationId
          }
        })

        // Log customer activity
        await prisma.customerActivity.create({
          data: {
            type: 'SMS_SENT',
            description: `SMS sent: ${options.message.substring(0, 50)}...`,
            customerId: customer.id,
            metadata: { twilioSid: message.sid }
          }
        })
      }

      return {
        success: true,
        data: {
          sid: message.sid,
          status: message.status,
          to: message.to,
          from: message.from,
          customer: customer
        },
      }
    } catch (error: any) {
      console.error('SMS send error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send batch SMS
   */
  static async sendBatch(messages: SendSmsOptions[]) {
    try {
      const promises = messages.map((msg) => this.send(msg))
      const results = await Promise.allSettled(promises)

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      return {
        success: true,
        total: messages.length,
        successful,
        failed,
        results,
      }
    } catch (error: any) {
      console.error('Batch SMS error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle incoming SMS webhook
   */
  static async handleIncoming(data: any) {
    try {
      const { From, To, Body, MessageSid } = data

      // Find or create customer
      const customer = await prisma.customer.findFirst({
        where: { phone: From },
      })

      if (customer) {
        // Create SMS message record
        await prisma.smsMessage.create({
          data: {
            customerId: customer.id,
            from: From,
            to: To,
            message: Body,
            direction: 'INBOUND',
            status: 'DELIVERED',
            twilioSid: MessageSid,
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
        })

        // Create activity
        await prisma.customerActivity.create({
          data: {
            customerId: customer.id,
            type: 'SMS_RECEIVED',
            description: `Received SMS: ${Body.substring(0, 50)}...`,
            metadata: { from: From, to: To },
          },
        })
      }

      return { success: true }
    } catch (error: any) {
      console.error('Handle incoming SMS error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get SMS status
   */
  static async getStatus(messageSid: string) {
    try {
      const message = await client.messages(messageSid).fetch()

      return {
        success: true,
        data: {
          sid: message.sid,
          status: message.status,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
        },
      }
    } catch (error: any) {
      console.error('Get SMS status error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send OTP for authentication
   */
  static async sendOtp(phone: string, code: string) {
    return this.send({
      to: phone,
      message: `Your verification code is: ${code}. Valid for 10 minutes.`,
    })
  }
}

// Import prisma
import { prisma } from '@/lib/prisma'
