import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  getSubscriptionPlan,
  isValidSubscriptionTier,
  type SubscriptionTier,
} from "@/config/subscriptions";
import { withPublicApiHandler, ApiContext } from "@/lib/api-handler";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Helper function to generate a unique slug
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export const POST = withPublicApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json();
    const { name, email, password, phone, organizationName, subscriptionTier } =
      body;

    // Validation
    if (!name || !email || !password) {
      return apiError("Missing required fields: name, email, password", {
        status: 400,
        requestId,
      });
    }

    if (!organizationName) {
      return apiError("Organization name is required", {
        status: 400,
        requestId,
      });
    }

    if (!subscriptionTier || !isValidSubscriptionTier(subscriptionTier)) {
      return apiError(
        "Valid subscription tier is required (STARTER, ELITE, PRO, ENTERPRISE)",
        { status: 400, requestId },
      );
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters", {
        status: 400,
        requestId,
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return apiError("Invalid email address", { status: 400, requestId });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return apiError("User with this email already exists", {
        status: 400,
        requestId,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get subscription plan details
    const plan = getSubscriptionPlan(subscriptionTier as SubscriptionTier);

    // Generate unique organization slug
    const orgSlug = await generateUniqueSlug(organizationName);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the organization with TRIALING status for 30-day free trial
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: orgSlug,
          subscriptionTier: subscriptionTier as any,
          subscriptionStatus: "TRIALING", // Start with 30-day free trial
          subscriptionStartDate: new Date(),
          // Set limits based on subscription plan (will activate after trial)
          maxSubAdmins: plan.features.maxSubAdmins,
          maxAgents: plan.features.maxAgents,
          maxCustomers: plan.features.maxCustomers,
          maxCampaigns: plan.features.maxCampaigns,
          maxEmailsPerMonth: plan.features.maxEmailsPerMonth,
          maxSMSPerMonth: plan.features.maxSMSPerMonth,
          maxVoiceMinutesPerMonth: plan.features.maxVoiceMinutesPerMonth,
        },
      });

      // Create the user as CORPORATE_ADMIN of the new organization
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone: phone || null,
          emailVerified: new Date(),
          role: "CORPORATE_ADMIN", // User becomes the admin of their organization
          organizationId: organization.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          organizationId: true,
          createdAt: true,
        },
      });

      return { user, organization };
    });

    return apiSuccess(
      {
        message: "Account and organization created successfully.",
        user: result.user,
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
          subscriptionTier: result.organization.subscriptionTier,
        },
      },
      { status: 201, requestId },
    );
  },
  { route: "POST /api/auth/register", rateLimit: RATE_LIMITS.auth },
);
