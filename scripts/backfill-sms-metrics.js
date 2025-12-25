/**
 * Backfill SMS Campaign Metrics
 *
 * This script recalculates metrics for all SMS campaigns based on actual message data.
 * Run this to fix any campaigns with incorrect or zero metrics.
 *
 * Usage: node scripts/backfill-sms-metrics.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function backfillMetrics() {
  try {
    console.log("🔄 Starting SMS campaign metrics backfill...\n");

    // Get all SMS campaigns
    const campaigns = await prisma.smsCampaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        deliveredCount: true,
      },
    });

    if (campaigns.length === 0) {
      console.log("ℹ️  No SMS campaigns found.");
      return;
    }

    console.log(`Found ${campaigns.length} SMS campaign(s) to process.\n`);

    let updated = 0;
    let skipped = 0;

    for (const campaign of campaigns) {
      console.log(`📊 Processing: ${campaign.name} (${campaign.status})`);

      // Get all messages for this campaign
      const messages = await prisma.smsMessage.findMany({
        where: { campaignId: campaign.id },
        select: { status: true },
      });

      if (messages.length === 0) {
        console.log(`   ⏭️  No messages found, skipping.\n`);
        skipped++;
        continue;
      }

      // Calculate metrics
      const totalRecipients = messages.length;
      const deliveredCount = messages.filter(
        (m) => m.status === "DELIVERED"
      ).length;
      const failedCount = messages.filter(
        (m) => m.status === "FAILED" || m.status === "UNDELIVERED"
      ).length;
      const repliedCount = messages.filter(
        (m) => m.status === "REPLIED"
      ).length;
      const optOutCount = messages.filter((m) => m.status === "OPT_OUT").length;

      const deliveryRate =
        totalRecipients > 0
          ? ((deliveredCount / totalRecipients) * 100).toFixed(1)
          : 0;

      console.log(
        `   📈 Current: ${campaign.totalRecipients} sent, ${campaign.deliveredCount} delivered`
      );
      console.log(
        `   ✅ Updated: ${totalRecipients} sent, ${deliveredCount} delivered (${deliveryRate}%)`
      );
      console.log(
        `   📉 Failed: ${failedCount}, Replied: ${repliedCount}, Opted Out: ${optOutCount}`
      );

      // Update campaign
      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: {
          totalRecipients,
          deliveredCount,
          failedCount,
          repliedCount,
          optOutCount,
        },
      });

      console.log(`   ✔️  Metrics updated!\n`);
      updated++;
    }

    console.log("━".repeat(60));
    console.log(`\n✨ Backfill complete!`);
    console.log(`   Updated: ${updated} campaign(s)`);
    console.log(`   Skipped: ${skipped} campaign(s) (no messages)`);
    console.log("");
  } catch (error) {
    console.error("❌ Error during backfill:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillMetrics();
