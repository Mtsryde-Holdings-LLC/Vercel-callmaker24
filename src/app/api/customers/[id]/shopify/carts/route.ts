import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId }
    })

    if (!customer?.shopifyId) {
      return NextResponse.json({ success: true, data: [] })
    }

    const integration = await prisma.integration.findFirst({
      where: { organizationId: session.user.organizationId, platform: 'shopify' }
    })

    if (!integration) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { shop, accessToken } = integration.credentials as any

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/checkouts.json?customer_id=${customer.shopifyId}&status=open`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      return NextResponse.json({ success: true, data: [] })
    }

    const data = await response.json()
    
    const carts = data.checkouts.map((checkout: any) => ({
      id: checkout.id,
      total: parseFloat(checkout.total_price),
      items: checkout.line_items,
      createdAt: checkout.created_at,
      recovered: false
    }))

    return NextResponse.json({ success: true, data: carts })
  } catch (error) {
    console.error('Shopify carts error:', error)
    return NextResponse.json({ success: true, data: [] })
  }
}
