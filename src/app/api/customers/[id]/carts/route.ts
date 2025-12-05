import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const carts = await prisma.abandonedCart.findMany({
      where: { customerId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: carts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch carts' }, { status: 500 })
  }
}
