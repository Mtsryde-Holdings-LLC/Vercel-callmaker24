import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    
    const formData = await req.formData()
    const transcription = formData.get('TranscriptionText') as string
    const callSid = formData.get('CallSid') as string

    const org = await prisma.organization.findUnique({
      where: { id: orgId! },
      select: { name: true }
    })

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI phone assistant for ${org?.name}. Analyze the caller's request and determine:
1. Can you help them directly? (simple questions, hours, location, etc)
2. Do they need a live agent? (complex issues, complaints, sales)
3. Which department? (Sales, Support, Billing, General)

Respond in JSON: {"canHandle": boolean, "department": string, "response": string, "needsAgent": boolean}`
        },
        { role: 'user', content: transcription }
      ]
    })

    const analysis = JSON.parse(aiResponse.choices[0].message.content || '{}')

    await prisma.call.upsert({
      where: { twilioCallSid: callSid },
      update: {
        transcription,
        metadata: { aiAnalysis: analysis }
      },
      create: {
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'IN_PROGRESS',
        from: formData.get('From') as string,
        to: formData.get('To') as string,
        transcription,
        organizationId: orgId!,
        metadata: { aiAnalysis: analysis }
      }
    })

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('AI process error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
