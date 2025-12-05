import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyCode } = await req.json()

    if (!/^\d{4}$/.test(companyCode)) {
      return NextResponse.json({ error: 'Company code must be 4 digits' }, { status: 400 })
    }

    const existing = await prisma.organization.findFirst({
      where: { companyCode, id: { not: session.user.organizationId } }
    })

    if (existing) {
      return NextResponse.json({ error: 'Company code already in use' }, { status: 400 })
    }

    await prisma.organization.update({
      where: { id: session.user.organizationId! },
      data: { companyCode }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save company code' }, { status: 500 })
  }
}
