import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Authorize attempt for:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            throw new Error('Invalid credentials')
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              organization: true
            }
          })

          console.log('[AUTH] User found:', !!user)

          if (!user || !user.password) {
            console.log('[AUTH] User not found or no password')
            throw new Error('Invalid credentials')
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('[AUTH] Password valid:', isCorrectPassword)

          if (!isCorrectPassword) {
            throw new Error('Invalid credentials')
          }

          console.log('[AUTH] Authorization successful for:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            organizationId: user.organizationId,
          }
        } catch (error) {
          console.error('[AUTH] Authorization error:', error)
          throw error
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const base = baseUrl || process.env.NEXTAUTH_URL || 'https://callmaker24.com'
      
      if (url.startsWith('/')) return `${base}${url}`
      if (url.startsWith(base)) return url
      return `${base}/dashboard`
    },
    async jwt({ token, user, account, trigger, session }) {
      try {
        console.log('[AUTH] JWT callback - user present:', !!user)
        
        if (user) {
          token.id = user.id
          token.role = user.role
          token.organizationId = user.organizationId
          token.policyAccepted = false // Default value, can be updated later
          console.log('[AUTH] JWT token created for:', user.id)
          
          // Update last login in background (don't await to avoid blocking)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(err => console.error('[AUTH] Failed to update lastLoginAt:', err))
        }

        // Handle session update
        if (trigger === 'update' && session) {
          token = { ...token, ...session }
        }

        return token
      } catch (error) {
        console.error('[AUTH] JWT callback error:', error)
        // Return basic token instead of throwing
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string
          session.user.role = token.role as string
          session.user.organizationId = token.organizationId as string
        }

        // Only update lastLoginAt if this is a fresh signin (not every request)
        // We can detect this by checking if the token was just created
        
        return session
      } catch (error) {
        console.error('[AUTH] Session callback error:', error)
        // Return session anyway, don't fail authentication
        return session
      }
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        // Update auth provider info
        await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: account.provider.toUpperCase() as any,
            providerId: account.providerAccountId,
          },
        })
      }
      return true
    },
  },
  events: {
    async signIn(message) {
      // Log sign in event
      console.log('User signed in:', message.user.email)
    },
  },
}
