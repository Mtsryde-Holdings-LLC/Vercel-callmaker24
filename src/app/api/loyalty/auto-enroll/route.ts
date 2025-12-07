import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.organizationId

    // Get organization's Shopify integration
    const integration = await prisma.integration.findFirst({
      where: {
        organizationId: orgId,
        platform: 'shopify',
        isActive: true
      }
    })

    if (!integration) {
      return NextResponse.json({ error: 'Shopify not connected' }, { status: 400 })
    }

    const credentials = integration.credentials as any
    const shopDomain = credentials.shop
    const accessToken = credentials.accessToken

    // Get all customers with email or phone
    const customers = await prisma.customer.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { email: { not: null } },
          { phone: { not: null } }
        ]
      }
    })

    let enrolled = 0
    let pointsAllocated = 0

    for (const customer of customers) {
      let totalSpent = customer.totalSpent || 0
      let orderCount = customer.orderCount || 0
      let points = 0

      // Try to fetch Shopify data if customer has shopifyId
      if (customer.shopifyId && integration) {
        try {
          const ordersUrl = `https://${shopDomain}/admin/api/2024-01/customers/${customer.shopifyId}/orders.json`
          const ordersRes = await fetch(ordersUrl, {
            headers: { 'X-Shopify-Access-Token': accessToken }
          })

          if (ordersRes.ok) {
            const ordersData = await ordersRes.json()
            const orders = ordersData.orders || []

            totalSpent = orders.reduce((sum: number, order: any) => 
              sum + parseFloat(order.total_price || 0), 0
            )
            orderCount = orders.length
          }
        } catch (err) {
          console.error(`Failed to fetch orders for customer ${customer.id}:`, err)
        }
      }

      // Calculate points (1 point per dollar)
      points = Math.floor(totalSpent)

      // Update customer with loyalty status
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyMember: true,
          loyaltyTier: points >= 5000 ? 'DIAMOND' :
                       points >= 3000 ? 'PLATINUM' :
                       points >= 1500 ? 'GOLD' :
                       points >= 500 ? 'SILVER' : 'BRONZE',
          loyaltyPoints: points,
          totalSpent,
          orderCount
        }
      })

      enrolled++
      pointsAllocated += points
    }

    return NextResponse.json({
      success: true,
      enrolled,
      pointsAllocated
    })
  } catch (error) {
    console.error('Auto-enroll error:', error)
    return NextResponse.json({ error: 'Failed to auto-enroll' }, { status: 500 })
  }
}
