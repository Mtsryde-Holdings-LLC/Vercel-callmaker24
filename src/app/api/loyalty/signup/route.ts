import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, phone, birthday, orgSlug } = body

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email, organizationId: org.id },
          { phone, organizationId: org.id }
        ]
      }
    })

    if (existingCustomer) {
      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          loyaltyMember: true,
          loyaltyTier: 'BRONZE',
          birthday: birthday ? new Date(birthday) : null
        }
      })
    } else {
      const firstUser = await prisma.user.findFirst({
        where: { organizationId: org.id }
      })

      await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          birthday: birthday ? new Date(birthday) : null,
          loyaltyMember: true,
          loyaltyTier: 'BRONZE',
          organizationId: org.id,
          createdById: firstUser?.id || ''
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Loyalty signup error:', error)
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }
}
