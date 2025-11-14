import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Try to query users table
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      userCount,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      }
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Database connection failed',
      code: error.code,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
