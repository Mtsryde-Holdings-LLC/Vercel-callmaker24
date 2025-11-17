import { DefaultSession } from 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      organizationId?: string
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
    organizationId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    organizationId?: string
    policyAccepted?: boolean
  }
}
