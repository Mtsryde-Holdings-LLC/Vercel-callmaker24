import { NextRequest, NextResponse } from 'next/server'

// Facebook webhook verification and handling
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Facebook webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('Facebook webhook received:', JSON.stringify(body, null, 2))

    // Handle Facebook webhook events (comments, messages, etc.)
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const { field, value } = change

          console.log(`Facebook ${field} event:`, value)

          // TODO: Process Facebook events
          // - Handle comments on posts
          // - Handle messages
          // - Handle reactions
          // - Update engagement metrics
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Facebook webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
