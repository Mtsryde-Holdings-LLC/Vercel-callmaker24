import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Get campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}