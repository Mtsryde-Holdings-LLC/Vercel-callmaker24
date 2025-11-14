import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Twitter webhook CRC validation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const crc_token = searchParams.get('crc_token')

  if (!crc_token) {
    return NextResponse.json({ error: 'Missing crc_token' }, { status: 400 })
  }

  const hmac = crypto
    .createHmac('sha256', process.env.TWITTER_CONSUMER_SECRET || '')
    .update(crc_token)
    .digest('base64')

  return NextResponse.json({
    response_token: `sha256=${hmac}`,
  })
}

// Twitter webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('Twitter webhook received:', JSON.stringify(body, null, 2))

    // Handle different Twitter events
    if (body.tweet_create_events) {
      // Handle new tweets (mentions, replies)
      for (const tweet of body.tweet_create_events) {
        console.log('New tweet:', tweet)
        // TODO: Process tweet mentions/replies
      }
    }

    if (body.direct_message_events) {
      // Handle direct messages
      for (const dm of body.direct_message_events) {
        console.log('New DM:', dm)
        // TODO: Process direct messages
      }
    }

    if (body.favorite_events) {
      // Handle likes
      for (const fav of body.favorite_events) {
        console.log('Tweet liked:', fav)
        // TODO: Update engagement metrics
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Twitter webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
