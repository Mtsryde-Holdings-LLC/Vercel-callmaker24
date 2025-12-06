import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const responses = await prisma.ivrResponse.findMany({
      where: { campaignId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    const stats = {
      totalResponses: responses.length,
      confirmed: responses.filter(r => r.response === '1').length,
      rescheduled: responses.filter(r => r.response === '2').length,
      cancelled: responses.filter(r => r.response === '3').length
    }

    return NextResponse.json({ responses, stats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { customerPhone, customerName, response, callSid, callDuration, responseData } = body

    const ivrResponse = await prisma.ivrResponse.create({
      data: {
        campaignId: params.id,
        customerPhone,
        customerName,
        response,
        callSid,
        callDuration,
        responseData
      }
    })

    return NextResponse.json(ivrResponse)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
