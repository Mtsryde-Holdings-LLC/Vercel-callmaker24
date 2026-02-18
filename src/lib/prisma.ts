import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // For serverless (Vercel), append connection_limit to prevent pool exhaustion
  let dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl && !dbUrl.includes("connection_limit")) {
    const separator = dbUrl.includes("?") ? "&" : "?";
    dbUrl = `${dbUrl}${separator}connection_limit=1&pool_timeout=20`;
  }

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  // Log slow queries in dev
  if (process.env.NODE_ENV === "development") {
    (client.$on as Function)(
      "query",
      (e: { duration: number; query: string }) => {
        if (e.duration > 200) {
          logger.warn(
            `Slow query (${e.duration}ms): ${e.query.substring(0, 100)}`,
            {
              route: "prisma",
            },
          );
        }
      },
    );
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown: disconnect Prisma on process termination
if (typeof process !== "undefined") {
  const shutdown = async () => {
    logger.info("Disconnecting Prisma client...");
    await prisma.$disconnect();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
