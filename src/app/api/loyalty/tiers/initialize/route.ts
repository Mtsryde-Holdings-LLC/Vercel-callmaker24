import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const defaultTiers = [
  {
    tier: "BRONZE",
    name: "Bronze",
    minPoints: 0,
    pointsPerDollar: 1,
    benefits: ["1 point per $1 spent"],
  },
  {
    tier: "SILVER",
    name: "Silver",
    minPoints: 500,
    pointsPerDollar: 1.5,
    benefits: ["1.5 points per $1 spent", "5% discount"],
  },
  {
    tier: "GOLD",
    name: "Gold",
    minPoints: 1500,
    pointsPerDollar: 2,
    benefits: ["2 points per $1 spent", "10% discount", "Free shipping"],
  },
  {
    tier: "PLATINUM",
    name: "Platinum",
    minPoints: 3000,
    pointsPerDollar: 2.5,
    benefits: [
      "2.5 points per $1 spent",
      "15% discount",
      "Free shipping",
      "Priority support",
    ],
  },
  {
    tier: "DIAMOND",
    name: "Diamond",
    minPoints: 5000,
    pointsPerDollar: 3,
    benefits: [
      "3 points per $1 spent",
      "20% discount",
      "Free shipping",
      "Priority support",
      "Exclusive access",
    ],
  },
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check if tiers already exist
    const existingTiers = await prisma.loyaltyTier.findMany({
      where: { organizationId }
    });

    if (existingTiers.length > 0) {
      return NextResponse.json(
        { error: 'Tiers already exist for this organization' },
        { status: 400 }
      );
    }

    // Create default tiers
    const createdTiers = await Promise.all(
      defaultTiers.map((tier) =>
        prisma.loyaltyTier.create({
          data: {
            ...tier,
            organizationId
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdTiers.length} loyalty tiers`,
      data: createdTiers
    });
  } catch (error) {
    console.error('Error initializing tiers:', error);
    return NextResponse.json(
      { error: 'Failed to initialize tiers' },
      { status: 500 }
    );
  }
}
