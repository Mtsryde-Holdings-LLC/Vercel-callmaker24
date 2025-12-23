import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron Job: Auto-sync Shopify customers
 * This endpoint should be called periodically (e.g., every hour) by Vercel Cron or external scheduler
 *
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/shopify-sync",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[SHOPIFY CRON] Starting automatic sync...");

    // Get all active Shopify integrations
    const integrations = await prisma.integration.findMany({
      where: {
        platform: "SHOPIFY",
        isActive: true,
      },
      include: {
        organization: {
          include: {
            users: {
              where: { role: { in: ["CORPORATE_ADMIN", "SUPER_ADMIN"] } },
              take: 1,
            },
          },
        },
      },
    });

    console.log(
      `[SHOPIFY CRON] Found ${integrations.length} active integrations`
    );

    const results = [];

    for (const integration of integrations) {
      try {
        const { shop, accessToken } = integration.credentials as any;
        const organizationId = integration.organizationId;
        const adminUser = integration.organization?.users?.[0];

        if (!shop || !accessToken || !organizationId || !adminUser) {
          console.error(
            `[SHOPIFY CRON] Invalid integration config: ${integration.id}`
          );
          results.push({
            integrationId: integration.id,
            organizationId,
            success: false,
            error: "Missing configuration",
          });
          continue;
        }

        // Check if sync is needed (only sync if last sync was > 30 minutes ago)
        const lastSync = integration.lastSyncAt;
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        if (lastSync && lastSync > thirtyMinutesAgo) {
          console.log(
            `[SHOPIFY CRON] Skipping ${shop}, last synced ${lastSync}`
          );
          results.push({
            integrationId: integration.id,
            organizationId,
            success: true,
            skipped: true,
            message: "Recently synced",
          });
          continue;
        }

        console.log(`[SHOPIFY CRON] Syncing customers for ${shop}...`);

        // Sync only new/updated customers since last sync
        let syncedCustomers = 0;
        let updatedSince = lastSync ? lastSync.toISOString() : undefined;

        // Build URL with updated_at_min filter for incremental sync
        const baseUrl = `https://${shop}/admin/api/2024-01/customers.json`;
        const params = new URLSearchParams({
          limit: "250",
          ...(updatedSince && { updated_at_min: updatedSince }),
        });
        const url = `${baseUrl}?${params.toString()}`;

        const response = await fetch(url, {
          headers: { "X-Shopify-Access-Token": accessToken },
        });

        if (!response.ok) {
          throw new Error(`Shopify API error: ${response.status}`);
        }

        const data = await response.json();
        const customers = data.customers || [];

        console.log(
          `[SHOPIFY CRON] Found ${customers.length} customers to sync for ${shop}`
        );

        // Upsert customers
        for (const customer of customers) {
          try {
            await prisma.customer.upsert({
              where: {
                shopifyId_organizationId: {
                  shopifyId: customer.id.toString(),
                  organizationId,
                },
              },
              create: {
                shopifyId: customer.id.toString(),
                externalId: customer.id.toString(),
                source: "SHOPIFY",
                email: customer.email || null,
                firstName: customer.first_name || "Unknown",
                lastName: customer.last_name || "",
                phone: customer.phone,
                totalSpent: parseFloat(customer.total_spent || "0"),
                orderCount: customer.orders_count || 0,
                emailOptIn: customer.accepts_marketing ?? true,
                smsOptIn:
                  customer.sms_marketing_consent?.state === "subscribed",
                organizationId,
                createdById: adminUser.id,
              },
              update: {
                email: customer.email || null,
                firstName: customer.first_name || "Unknown",
                lastName: customer.last_name || "",
                phone: customer.phone,
                totalSpent: parseFloat(customer.total_spent || "0"),
                orderCount: customer.orders_count || 0,
                emailOptIn: customer.accepts_marketing ?? true,
                smsOptIn:
                  customer.sms_marketing_consent?.state === "subscribed",
              },
            });
            syncedCustomers++;
          } catch (err: any) {
            console.error(`[SHOPIFY CRON] Customer error:`, err.message);
          }
        }

        // Update lastSyncAt
        await prisma.integration.update({
          where: { id: integration.id },
          data: { lastSyncAt: new Date() },
        });

        console.log(
          `[SHOPIFY CRON] Synced ${syncedCustomers} customers for ${shop}`
        );

        results.push({
          integrationId: integration.id,
          organizationId,
          shop,
          success: true,
          synced: syncedCustomers,
        });
      } catch (error: any) {
        console.error(
          `[SHOPIFY CRON] Error syncing integration ${integration.id}:`,
          error
        );
        results.push({
          integrationId: integration.id,
          organizationId: integration.organizationId,
          success: false,
          error: error.message,
        });
      }
    }

    console.log("[SHOPIFY CRON] Sync completed");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      total: integrations.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error: any) {
    console.error("[SHOPIFY CRON] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}
