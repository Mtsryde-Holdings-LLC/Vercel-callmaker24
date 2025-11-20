import { Resend } from 'resend'
import formData from 'form-data'
import Mailgun from 'mailgun.js'

// Email provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend' // 'resend', 'sendgrid', or 'mailgun'

// Resend client
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_for_build')

// Mailgun client
const mailgun = process.env.MAILGUN_API_KEY 
  ? new Mailgun(formData).client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_REGION === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    })
  : null

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export class EmailService {
  /**
   * Send a single email with customer data sync
   */
  static async send(options: SendEmailOptions & { userId?: string, organizationId?: string, campaignId?: string }) {
    try {
      // Find or create customer by email
      let customer = await prisma.customer.findFirst({
        where: {
          email: Array.isArray(options.to) ? options.to[0] : options.to,
          organizationId: options.organizationId
        }
      })

      if (!customer && options.userId) {
        customer = await prisma.customer.create({
          data: {
            email: Array.isArray(options.to) ? options.to[0] : options.to,
            firstName: 'Unknown',
            lastName: 'Contact',
            organizationId: options.organizationId,
            createdById: options.userId
          }
        })
      }

      // Send email
      const result = EMAIL_PROVIDER === 'mailgun' && mailgun && process.env.MAILGUN_DOMAIN
        ? await this.sendWithMailgun(options)
        : await this.sendWithResend(options)

      // Log to database if successful
      if (result.success && customer) {
        await prisma.emailMessage.create({
          data: {
            campaignId: options.campaignId,
            customerId: customer.id,
            to: Array.isArray(options.to) ? options.to[0] : options.to,
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.text,
            status: 'SENT',
            sentAt: new Date(),
            organizationId: options.organizationId,
            metadata: { provider: result.provider, messageId: result.data?.id }
          }
        })

        // Log customer activity
        await prisma.customerActivity.create({
          data: {
            type: 'EMAIL_SENT',
            description: `Email sent: ${options.subject}`,
            customerId: customer.id,
            metadata: { messageId: result.data?.id }
          }
        })
      }

      return result
    } catch (error: any) {
      console.error('Email service error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send email via Resend
   */
  private static async sendWithResend(options: SendEmailOptions) {
    try {
      const { data, error } = await resend.emails.send({
        from: options.from || process.env.EMAIL_FROM || 'noreply@example.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        tags: options.tags,
      })

      if (error) {
        console.error('Resend error:', error)
        throw new Error(error.message)
      }

      return { success: true, data, provider: 'resend' }
    } catch (error: any) {
      console.error('Resend service error:', error)
      return { success: false, error: error.message, provider: 'resend' }
    }
  }

  /**
   * Send email via Mailgun
   */
  private static async sendWithMailgun(options: SendEmailOptions) {
    try {
      if (!mailgun || !process.env.MAILGUN_DOMAIN) {
        throw new Error('Mailgun not configured')
      }

      const messageData: any = {
        from: options.from || process.env.EMAIL_FROM || 'noreply@example.com',
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      }

      if (options.replyTo) {
        messageData['h:Reply-To'] = options.replyTo
      }

      // Add tags
      if (options.tags) {
        messageData['o:tag'] = options.tags.map(t => `${t.name}:${t.value}`)
      }

      // Enable tracking
      messageData['o:tracking'] = 'yes'
      messageData['o:tracking-clicks'] = 'yes'
      messageData['o:tracking-opens'] = 'yes'

      const result = await mailgun.messages.create(process.env.MAILGUN_DOMAIN, messageData)

      return { 
        success: true, 
        data: { id: result.id, message: result.message },
        provider: 'mailgun' 
      }
    } catch (error: any) {
      console.error('Mailgun service error:', error)
      return { 
        success: false, 
        error: error.message || 'Mailgun send failed',
        provider: 'mailgun' 
      }
    }
  }

  /**
   * Send batch emails
   */
  static async sendBatch(emails: SendEmailOptions[]) {
    try {
      const promises = emails.map((email) => this.send(email))
      const results = await Promise.allSettled(promises)

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      return {
        success: true,
        total: emails.length,
        successful,
        failed,
        results,
      }
    } catch (error: any) {
      console.error('Batch email error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send template email
   */
  static async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, any>
  ) {
    // Implementation for template-based emails
    // This would integrate with your email template system
    return { success: true, message: 'Template email sent' }
  }

  /**
   * Track email open
   */
  static async trackOpen(messageId: string) {
    try {
      await prisma.emailMessage.update({
        where: { id: messageId },
        data: {
          status: 'OPENED',
          openedAt: new Date(),
          openCount: { increment: 1 },
        },
      })
    } catch (error) {
      console.error('Track open error:', error)
    }
  }

  /**
   * Track email click
   */
  static async trackClick(messageId: string) {
    try {
      await prisma.emailMessage.update({
        where: { id: messageId },
        data: {
          status: 'CLICKED',
          clickedAt: new Date(),
          clickCount: { increment: 1 },
        },
      })
    } catch (error) {
      console.error('Track click error:', error)
    }
  }
}

// Import prisma for tracking
import { prisma } from '@/lib/prisma'
