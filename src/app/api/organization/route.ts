import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId! },
      select: { id: true, name: true, slug: true }
    })

    return NextResponse.json(org)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}
