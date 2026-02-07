/**
 * Fix Missing organizationId in Orders and Discounts
 *
 * This script identifies and fixes records that are missing organizationId
 * by looking up the customer's organization.
 *
 * Run: node scripts/fix-missing-organizationid.js
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixMissingOrganizationIds() {
  console.log("\n========================================");
  console.log("Fixing Missing organizationId");
  console.log("========================================\n");

  try {
    // 1. Fix Orders missing organizationId
    console.log("📦 Checking Orders...\n");

    const ordersWithoutOrg = await prisma.order.findMany({
      where: {
        organizationId: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            organizationId: true,
          },
        },
      },
    });

    console.log(
      `Found ${ordersWithoutOrg.length} orders without organizationId`,
    );

    let ordersFixed = 0;
    let ordersSkipped = 0;

    for (const order of ordersWithoutOrg) {
      if (order.customer?.organizationId) {
        await prisma.order.update({
          where: { id: order.id },
          data: { organizationId: order.customer.organizationId },
        });
        ordersFixed++;
        console.log(
          `✅ Fixed order ${order.orderNumber || order.id} -> org: ${order.customer.organizationId}`,
        );
      } else {
        ordersSkipped++;
        console.log(
          `⚠️  Skipped order ${order.orderNumber || order.id} - customer has no org`,
        );
      }
    }

    console.log(`\n✅ Fixed ${ordersFixed} orders`);
    if (ordersSkipped > 0) {
      console.log(
        `⚠️  Skipped ${ordersSkipped} orders (customer has no organization)`,
      );
    }

    // 2. Fix DiscountUsage missing organizationId
    console.log("\n💰 Checking Discount Usage...\n");

    const discountsWithoutOrg = await prisma.discountUsage.findMany({
      where: {
        organizationId: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            organizationId: true,
          },
        },
      },
    });

    console.log(
      `Found ${discountsWithoutOrg.length} discounts without organizationId`,
    );

    let discountsFixed = 0;
    let discountsSkipped = 0;

    for (const discount of discountsWithoutOrg) {
      if (discount.customer?.organizationId) {
        await prisma.discountUsage.update({
          where: { id: discount.id },
          data: { organizationId: discount.customer.organizationId },
        });
        discountsFixed++;
        console.log(
          `✅ Fixed discount ${discount.code} -> org: ${discount.customer.organizationId}`,
        );
      } else {
        discountsSkipped++;
        console.log(
          `⚠️  Skipped discount ${discount.code} - customer has no org`,
        );
      }
    }

    console.log(`\n✅ Fixed ${discountsFixed} discounts`);
    if (discountsSkipped > 0) {
      console.log(
        `⚠️  Skipped ${discountsSkipped} discounts (customer has no organization)`,
      );
    }

    // 3. Check for customers without organizationId
    console.log("\n👥 Checking Customers...\n");

    const customersWithoutOrg = await prisma.customer.count({
      where: {
        organizationId: null,
      },
    });

    if (customersWithoutOrg > 0) {
      console.log(
        `⚠️  WARNING: Found ${customersWithoutOrg} customers without organizationId`,
      );
      console.log(
        "   These customers need to be assigned to an organization manually.",
      );
      console.log("   Run: node scripts/fix-user-org.js\n");
    } else {
      console.log("✅ All customers have organizationId\n");
    }

    // 4. Summary
    console.log("\n========================================");
    console.log("Summary");
    console.log("========================================\n");
    console.log(`Orders fixed: ${ordersFixed}`);
    console.log(`Discounts fixed: ${discountsFixed}`);
    console.log(`Total fixed: ${ordersFixed + discountsFixed}`);

    if (ordersSkipped + discountsSkipped > 0) {
      console.log(
        `\n⚠️  Warning: ${ordersSkipped + discountsSkipped} records skipped due to missing customer organization`,
      );
    }

    console.log("\n✅ Migration complete!\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingOrganizationIds();
