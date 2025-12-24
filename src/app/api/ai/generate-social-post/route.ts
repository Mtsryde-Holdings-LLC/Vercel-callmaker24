import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, platforms } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Determine platform context
    const platformContext = platforms && platforms.length > 0
      ? `for ${platforms.join(', ')}`
      : ''

    // Generate content using AI (placeholder - integrate with your AI service)
    // For now, we'll create a simple template-based response
    const content = await generateSocialContent(prompt, platforms)

    return NextResponse.json({ 
      content,
      success: true 
    })
  } catch (error: any) {
    console.error('Generate social post error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    )
  }
}

async function generateSocialContent(prompt: string, platforms: string[] = []): Promise<string> {
  // This is a placeholder function. In production, integrate with OpenAI, Claude, or your AI service
  
  // Simple template-based generation for demonstration
  const platformHashtags: Record<string, string> = {
    INSTAGRAM: '#instagood #photooftheday #love #beautiful #happy',
    FACEBOOK: '#share #like #follow',
    TWITTER: '#trending #viral',
    LINKEDIN: '#professional #business #career',
    TIKTOK: '#fyp #foryou #viral #trending'
  }

  const primaryPlatform = platforms[0] || 'INSTAGRAM'
  const hashtags = platformHashtags[primaryPlatform] || '#social #post'

  // Create a basic response based on the prompt
  const content = `${prompt}

✨ Let's make this happen! 

${hashtags}

📸 Stay tuned for more updates!`

  return content
}
