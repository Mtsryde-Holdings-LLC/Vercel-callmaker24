import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic"; // Don't pre-render

export async function GET() {
  try {
    // Restrict to development or authenticated admin users
    if (process.env.NODE_ENV === "production") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
      });

      if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Test database connection
    await prisma.$connect();

    // Try to query users table
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      userCount,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
      },
    });
  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Database connection failed",
        code: error.code,
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasDirectUrl: !!process.env.DIRECT_URL,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
