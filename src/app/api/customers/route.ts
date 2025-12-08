import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const customerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
});

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    console.log("[CUSTOMERS API] Fetching customers...");
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("[CUSTOMERS API] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CUSTOMERS API] Session user:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    console.log(
      "[CUSTOMERS API] User found:",
      !!user,
      "OrgId:",
      user?.organizationId
    );
    const organizationId = user?.organizationId || "cmi6rkqbo0001kn0xyo8383o9";

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "1000");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {
      organizationId: organizationId,
    };

    // Create test customer if none exist
    const customerCount = await prisma.customer.count({ where });
    if (customerCount === 0) {
      await prisma.customer.create({
        data: {
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+18327881895",
          organizationId: organizationId,
          createdById: user?.id || "cmi6rkqbx0003kn0x6mitf439",
        },
      });
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tags: true,
          _count: {
            select: {
              emailMessages: true,
              smsMessages: true,
              calls: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    console.log(
      "[CUSTOMERS API] Found",
      customers.length,
      "customers, total:",
      total
    );
    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[CUSTOMERS API] GET error:", error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    const organizationId = user?.organizationId || "cmi6rkqbo0001kn0xyo8383o9";
    const userId = user?.id || "cmi6rkqbx0003kn0x6mitf439";

    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Check if customer already exists in this organization
    if (validatedData.email) {
      const existing = await prisma.customer.findFirst({
        where: {
          email: validatedData.email,
          organizationId: organizationId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    const { tags, ...customerData } = validatedData;

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        createdById: userId,
        organizationId: organizationId,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    console.error("POST customer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
