import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Templates GET - session:', session?.user)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!session.user.organizationId) {
      console.error('No organizationId in session for user:', session.user.id)
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const templates = await prisma.ivrTemplate.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Templates POST - session:', session?.user)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!session.user.organizationId) {
      console.error('No organizationId in session for user:', session.user.id)
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const body = await req.json()
    const { name, type, script, variables } = body

    const template = await prisma.ivrTemplate.create({
      data: {
        name,
        type,
        script,
        variables: variables || [],
        organizationId: session.user.organizationId
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
