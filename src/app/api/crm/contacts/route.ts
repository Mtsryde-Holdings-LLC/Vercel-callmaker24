import { NextRequest, NextResponse } from 'next/server'

// Mock data - in production, this would query the database
const mockContacts = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corp',
    status: 'active',
    lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dealValue: 50000
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@techstart.com',
    phone: '+1 (555) 234-5678',
    company: 'TechStart Inc',
    status: 'prospect',
    lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dealValue: 75000
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'mbrown@innovate.co',
    phone: '+1 (555) 345-6789',
    company: 'Innovate Co',
    status: 'active',
    lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dealValue: 120000
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@growth.io',
    phone: '+1 (555) 456-7890',
    company: 'Growth.io',
    status: 'closed',
    lastContact: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dealValue: 35000
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'dwilson@enterprise.com',
    phone: '+1 (555) 567-8901',
    company: 'Enterprise LLC',
    status: 'active',
    lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dealValue: 200000
  }
]

export async function GET(request: NextRequest) {
  try {
    // In production, query database with filters
    // const { searchParams } = new URL(request.url)
    // const status = searchParams.get('status')
    
    return NextResponse.json(mockContacts)
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
    const body = await request.json()
    
    // In production, validate and save to database
    const newContact = {
      id: Date.now().toString(),
      ...body,
      lastContact: new Date().toISOString()
    }
    
    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
