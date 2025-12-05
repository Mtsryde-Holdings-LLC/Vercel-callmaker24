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

    const accounts = await prisma.socialAccount.findMany({
      where: { userId: session.user.id, organizationId: session.user.organizationId },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        isActive: true
      }
    })

    const formattedAccounts = accounts.map(acc => ({
      id: acc.id,
      platform: acc.platform,
      accountName: acc.displayName || acc.username || 'Unknown',
      isActive: acc.isActive
    }))

    return NextResponse.json({ success: true, accounts: formattedAccounts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
