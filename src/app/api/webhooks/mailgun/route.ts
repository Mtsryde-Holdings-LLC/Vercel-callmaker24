import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Mailgun Webhook Handler
 * Processes email events from Mailgun (delivered, opened, clicked, bounced, complained)
 */

// Verify webhook signature from Mailgun
function verifyWebhookSignature(
  timestamp: string,
  token: string,
  signature: string
): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY
  
  if (!signingKey) {
    console.warn('MAILGUN_WEBHOOK_SIGNING_KEY not configured')
    return true // Allow in development
  }

  const encodedToken = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp + token)
    .digest('hex')

  return encodedToken === signature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature
    const signature = body.signature || {}
    const isValid = verifyWebhookSignature(
      signature.timestamp,
      signature.token,
      signature.signature
    )

    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const eventData = body['event-data'] || {}
    const event = eventData.event || 'unknown'
    const messageId = eventData.message?.headers?.['message-id']
    const recipient = eventData.recipient
    const timestamp = new Date(eventData.timestamp * 1000)

    console.log(`Mailgun webhook received: ${event}`, {
      messageId,
      recipient,
      timestamp
    })

    // Process different event types
    switch (event) {
      case 'delivered':
        await handleDelivered(messageId, recipient, eventData)
        break
      
      case 'opened':
        await handleOpened(messageId, recipient, eventData)
        break
      
      case 'clicked':
        await handleClicked(messageId, recipient, eventData)
        break
      
      case 'bounced':
        await handleBounced(messageId, recipient, eventData)
        break
      
      case 'complained':
        await handleComplained(messageId, recipient, eventData)
        break
      
      case 'unsubscribed':
        await handleUnsubscribed(messageId, recipient, eventData)
        break
      
      case 'failed':
        await handleFailed(messageId, recipient, eventData)
        break
      
      default:
        console.log(`Unhandled event type: ${event}`)
    }

    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    console.error('Mailgun webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Event handlers

async function handleDelivered(
  messageId: string,
  recipient: string,
  eventData: any
) {
  try {
    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "delivered" = "delivered" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `

    // Log the event
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(eventData.timestamp * 1000),
      }
    })
  } catch (error) {
    console.error('Error handling delivered event:', error)
  }
}

async function handleOpened(
  messageId: string,
  recipient: string,
  eventData: any
) {
  try {
    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "opened" = "opened" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `

    // Log the open event
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: 'opened',
        openedAt: new Date(eventData.timestamp * 1000),
      }
    })
  } catch (error) {
    console.error('Error handling opened event:', error)
  }
}

async function handleClicked(
  messageId: string,
  recipient: string,
  eventData: any
) {
  try {
    const clickedUrl = eventData.url

    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "clicked" = "clicked" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `

    // Log the click event
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: 'clicked',
        clickedAt: new Date(eventData.timestamp * 1000),
      }
    })

    console.log(`Email clicked: ${recipient} clicked ${clickedUrl}`)
  } catch (error) {
    console.error('Error handling clicked event:', error)
  }
}

async function handleBounced(
  messageId: string,
  recipient: string,
  eventData: any
) {
  try {
    const bounceError = eventData.error || 'Unknown bounce reason'
    const bounceCode = eventData.code || 'unknown'

    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "bounced" = "bounced" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `

    // Log the bounce
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: 'bounced',
        error: `${bounceCode}: ${bounceError}`,
      }
    })

    // Mark email as bounced in contacts
    await prisma.contact.updateMany({
      where: { email: recipient },
      data: { 
        status: 'bounced',
        notes: `Email bounced: ${bounceError}`
      }
    })

    console.log(`Email bounced: ${recipient} - ${bounceError}`)
  } catch (error) {
    console.error('Error handling bounced event:', error)
  }
}

async function handleComplained(
  messageId: string,
  recipient: string,
  eventData: any
) {
  try {
    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "complained" = "complained" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `

    // Log the complaint
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: 'complained',
        error: 'Recipient marked as spam',
      }
    })

    // Mark email as complained and unsubscribe
    await prisma.contact.updateMany({
      where: { email: recipient },
      data: { 
        status: 'unsubscribed',
        unsubscribed: true,
        notes: 'Marked email as spam'
      }
    })

    console.log(`Email complaint: ${recipient} marked email as spam`)
  } catch (error) {
    console.error('Error handling complained event:', error)
  }
}

async function handleUnsubscribed(
  messageId: string,
  recipient: string,
  eventData: any
) {
  try {
    // Mark contact as unsubscribed
    await prisma.contact.updateMany({
      where: { email: recipient },
      data: { 
        status: 'unsubscribed',
        unsubscribed: true,
        notes: 'Unsubscribed via email link'
      }
    })

    console.log(`Email unsubscribed: ${recipient}`)
  } catch (error) {
    console.error('Error handling unsubscribed event:', error)
  }
}

async function handleFailed(
  messageId: string,
  recipient: string,
  eventData: any
) {
  try {
    const errorMessage = eventData.error || 'Unknown failure reason'
    const severity = eventData.severity || 'temporary'

    // Update email campaign stats
    await prisma.$executeRaw`
      UPDATE "EmailCampaign"
      SET "failed" = "failed" + 1
      WHERE id IN (
        SELECT "campaignId"
        FROM "EmailLog"
        WHERE "messageId" = ${messageId}
      )
    `

    // Log the failure
    await prisma.emailLog.updateMany({
      where: { messageId },
      data: {
        status: 'failed',
        error: errorMessage,
      }
    })

    // If permanent failure, mark contact
    if (severity === 'permanent') {
      await prisma.contact.updateMany({
        where: { email: recipient },
        data: { 
          status: 'invalid',
          notes: `Permanent failure: ${errorMessage}`
        }
      })
    }

    console.log(`Email failed: ${recipient} - ${errorMessage}`)
  } catch (error) {
    console.error('Error handling failed event:', error)
  }
}

// Allow GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Mailgun webhook endpoint is active'
  })
}
