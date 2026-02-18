import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Invalid credentials");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase(),
            },
            include: {
              organization: true,
            },
          });

          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            throw new Error("Invalid credentials");
          }

          logger.info("User authenticated", { route: "auth", userId: user.id });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            organizationId: user.organizationId,
          };
        } catch (error) {
          logger.warn("Authentication failed", { route: "auth" }, error);
          throw error;
        }
      },
    }),
    // Only add OAuth providers if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const base =
        baseUrl || process.env.NEXTAUTH_URL || "https://callmaker24.com";

      if (url.startsWith("/")) return `${base}${url}`;
      if (url.startsWith(base)) return url;
      return `${base}/dashboard`;
    },
    async jwt({ token, user, account, trigger, session }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.organizationId = user.organizationId;
          token.policyAccepted = false;

          // Update last login in background
          prisma.user
            .update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
            .catch((err) =>
              logger.error("Failed to update lastLoginAt", { route: "auth" }, err)
            );
        }

        // Handle session update
        if (trigger === "update" && session) {
          token = { ...token, ...session };
        }

        return token;
      } catch (error) {
        logger.error("JWT callback error", { route: "auth" }, error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.organizationId = token.organizationId as string;
        }
        return session;
      } catch (error) {
        logger.error("Session callback error", { route: "auth" }, error);
        return session;
      }
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        // Update auth provider info
        await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: account.provider.toUpperCase() as any,
            providerId: account.providerAccountId,
          },
        });
      }
      return true;
    },
  },
  events: {
    async signIn(message) {
      logger.info("User signed in", { route: "auth", userId: message.user.id });
    },
  },
};
