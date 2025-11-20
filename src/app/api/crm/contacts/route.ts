import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json([]) // Return empty array if no organization
    }

    // Fetch contacts from database
    const contacts = await prisma.customer.findMany({
      where: {
        organizationId: user.organizationId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        updatedAt: true,
        customFields: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform to match frontend format
    const transformedContacts = contacts.map(contact => ({
      id: contact.id,
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'N/A',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      status: 'active',
      lastContact: contact.updatedAt.toISOString(),
      dealValue: 0 // Can be extended with deals table later
    }))
    
    return NextResponse.json(transformedContacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }
    
    // Create contact in database
    const newContact = await prisma.customer.create({
      data: {
        firstName: body.name?.split(' ')[0] || '',
        lastName: body.name?.split(' ').slice(1).join(' ') || '',
        email: body.email,
        phone: body.phone,
        company: body.company,
        status: 'ACTIVE',
        organizationId: user.organizationId,
        createdById: session.user.id
      }
    })
    
    return NextResponse.json({
      id: newContact.id,
      name: `${newContact.firstName} ${newContact.lastName}`.trim(),
      email: newContact.email,
      phone: newContact.phone,
      company: newContact.company,
      status: 'active',
      lastContact: newContact.createdAt.toISOString(),
      dealValue: 0
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
