import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
          // For OAuth providers, fetch fresh data from DB (PrismaAdapter creates the user)
          if (account?.provider === "google" || account?.provider === "facebook") {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email?.toLowerCase() || "" },
              include: { organization: true },
            });

            if (dbUser) {
              // Create organization if new OAuth user doesn't have one
              if (!dbUser.organizationId) {
                const orgName = `${dbUser.name || "My"}'s Organization`;
                const baseSlug = orgName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                let slug = baseSlug;
                let counter = 1;
                while (await prisma.organization.findUnique({ where: { slug } })) {
                  slug = `${baseSlug}-${counter}`;
                  counter++;
                }

                const org = await prisma.organization.create({
                  data: {
                    name: orgName,
                    slug,
                    subscriptionTier: "FREE",
                    subscriptionStatus: "TRIALING",
                    subscriptionStartDate: new Date(),
                  },
                });
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: {
                    organizationId: org.id,
                    role: "CORPORATE_ADMIN",
                    authProvider: account.provider.toUpperCase() as any,
                    providerId: account.providerAccountId,
                    emailVerified: new Date(),
                  },
                });
                token.organizationId = org.id;
                token.role = "ADMIN";
                logger.info("Created organization for new OAuth user", {
                  route: "auth",
                  userId: dbUser.id,
                  orgId: org.id,
                });
              } else {
                token.organizationId = dbUser.organizationId;
                token.role = dbUser.role;
              }

              token.id = dbUser.id;
              token.policyAccepted = dbUser.policyAccepted || false;
            }
          } else {
            // Credentials provider — user object already has everything
            token.id = user.id;
            token.role = user.role;
            token.organizationId = user.organizationId;
            token.policyAccepted = false;
          }

          // Update last login in background
          const userId = (token.id as string) || user.id;
          if (userId) {
            prisma.user
              .update({
                where: { id: userId },
                data: { lastLoginAt: new Date() },
              })
              .catch((err) =>
                logger.error("Failed to update lastLoginAt", { route: "auth" }, err)
              );
          }
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          const email = user.email?.toLowerCase();
          if (!email) {
            logger.warn("OAuth sign-in failed: no email from provider", { route: "auth", provider: account.provider });
            return false;
          }

          // Check if a user with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { organization: true },
          });

          if (existingUser) {
            // Link OAuth to existing user — update provider info
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                authProvider: account.provider.toUpperCase() as any,
                providerId: account.providerAccountId,
                image: user.image || existingUser.image,
                name: existingUser.name || user.name,
                emailVerified: existingUser.emailVerified || new Date(),
              },
            });

            // Ensure Account record is linked to the existing user (PrismaAdapter may create it with wrong userId)
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            });
            if (existingAccount && existingAccount.userId !== existingUser.id) {
              await prisma.account.update({
                where: { id: existingAccount.id },
                data: { userId: existingUser.id },
              });
            }

            logger.info("OAuth user linked to existing account", {
              route: "auth",
              userId: existingUser.id,
              provider: account.provider,
            });
          } else {
            // New OAuth user — PrismaAdapter creates the User + Account records automatically.
            // We need to create an organization for them after the adapter creates the user.
            // We'll handle org creation in the jwt callback (first token creation).
            logger.info("New OAuth user signing up", {
              route: "auth",
              email,
              provider: account.provider,
            });
          }

          return true;
        } catch (error) {
          logger.error("OAuth signIn callback error", { route: "auth", provider: account.provider }, error);
          return false;
        }
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
