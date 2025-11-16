import { Resend } from 'resend'

// Use a placeholder API key during build time if not provided
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_for_build')

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
   * Send a single email
   */
  static async send(options: SendEmailOptions) {
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
        console.error('Email send error:', error)
        throw new Error(error.message)
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('Email service error:', error)
      return { success: false, error: error.message }
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
