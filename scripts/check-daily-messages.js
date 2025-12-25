const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDailyMessages() {
  try {
    console.log("📊 Analyzing SMS message volume...\n");

    // Get all SMS messages with their timestamps
    const messages = await prisma.smsMessage.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        campaign: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (messages.length === 0) {
      console.log("❌ No SMS messages found in database.");
      return;
    }

    // Group by date
    const messagesByDate = {};
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    messages.forEach((msg) => {
      const date = msg.createdAt.toISOString().split("T")[0];
      if (!messagesByDate[date]) {
        messagesByDate[date] = {
          total: 0,
          delivered: 0,
          failed: 0,
          pending: 0,
          byCampaign: {},
        };
      }
      messagesByDate[date].total++;

      if (msg.status === "DELIVERED") messagesByDate[date].delivered++;
      else if (msg.status === "FAILED") messagesByDate[date].failed++;
      else if (msg.status === "SENT" || msg.status === "PENDING")
        messagesByDate[date].pending++;

      const campaignName = msg.campaign?.name || "Unknown";
      if (!messagesByDate[date].byCampaign[campaignName]) {
        messagesByDate[date].byCampaign[campaignName] = 0;
      }
      messagesByDate[date].byCampaign[campaignName]++;
    });

    // Calculate daily average
    const dates = Object.keys(messagesByDate).sort().reverse();
    const totalMessages = messages.length;
    const daysWithActivity = dates.length;
    const avgPerDay =
      daysWithActivity > 0 ? (totalMessages / daysWithActivity).toFixed(1) : 0;

    console.log("📈 OVERALL STATISTICS");
    console.log("═══════════════════════════════════════");
    console.log(`Total Messages: ${totalMessages}`);
    console.log(`Days with Activity: ${daysWithActivity}`);
    console.log(`Average per Day: ${avgPerDay} messages`);
    console.log("");

    // Show last 30 days
    console.log("📅 DAILY BREAKDOWN (Last 30 Days)");
    console.log("═══════════════════════════════════════");

    const recentDates = dates.filter((date) => {
      const msgDate = new Date(date);
      return msgDate >= last30Days;
    });

    if (recentDates.length === 0) {
      console.log("❌ No messages in last 30 days");
    } else {
      recentDates.forEach((date) => {
        const data = messagesByDate[date];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
        });

        console.log(`\n${date} (${dayName})`);
        console.log(`  Total: ${data.total} messages`);
        console.log(`  ✓ Delivered: ${data.delivered}`);
        console.log(`  ✗ Failed: ${data.failed}`);
        console.log(`  ⏳ Pending: ${data.pending}`);

        if (Object.keys(data.byCampaign).length > 0) {
          console.log(`  Campaigns:`);
          Object.entries(data.byCampaign).forEach(([campaign, count]) => {
            console.log(`    - ${campaign}: ${count} messages`);
          });
        }
      });
    }

    // Show today's activity
    console.log("\n\n🔥 TODAY'S ACTIVITY");
    console.log("═══════════════════════════════════════");
    const today = now.toISOString().split("T")[0];
    if (messagesByDate[today]) {
      const todayData = messagesByDate[today];
      console.log(`Total: ${todayData.total} messages sent today`);
      console.log(`✓ Delivered: ${todayData.delivered}`);
      console.log(`✗ Failed: ${todayData.failed}`);
      console.log(`⏳ Pending: ${todayData.pending}`);

      if (Object.keys(todayData.byCampaign).length > 0) {
        console.log(`\nCampaigns Today:`);
        Object.entries(todayData.byCampaign).forEach(([campaign, count]) => {
          console.log(`  - ${campaign}: ${count} messages`);
        });
      }
    } else {
      console.log("❌ No messages sent today");
    }

    // Show campaign breakdown
    console.log("\n\n📧 MESSAGES BY CAMPAIGN (All Time)");
    console.log("═══════════════════════════════════════");
    const campaignTotals = {};
    messages.forEach((msg) => {
      const campaignName = msg.campaign?.name || "Unknown";
      if (!campaignTotals[campaignName]) {
        campaignTotals[campaignName] = { total: 0, delivered: 0, failed: 0 };
      }
      campaignTotals[campaignName].total++;
      if (msg.status === "DELIVERED") campaignTotals[campaignName].delivered++;
      if (msg.status === "FAILED") campaignTotals[campaignName].failed++;
    });

    Object.entries(campaignTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([campaign, stats]) => {
        const deliveryRate =
          stats.total > 0
            ? ((stats.delivered / stats.total) * 100).toFixed(1)
            : 0;
        console.log(`\n${campaign}`);
        console.log(`  Total: ${stats.total}`);
        console.log(`  Delivered: ${stats.delivered} (${deliveryRate}%)`);
        console.log(`  Failed: ${stats.failed}`);
      });

    // Check for automated vs manual
    console.log("\n\n🤖 CAMPAIGN TYPE BREAKDOWN");
    console.log("═══════════════════════════════════════");
    const campaigns = await prisma.smsCampaign.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    const automated = campaigns.filter((c) => c.type === "AUTOMATED");
    const manual = campaigns.filter((c) => c.type === "MANUAL");

    const automatedCount = automated.reduce(
      (sum, c) => sum + c._count.messages,
      0
    );
    const manualCount = manual.reduce((sum, c) => sum + c._count.messages, 0);

    console.log(`Automated Campaigns: ${automated.length}`);
    console.log(`  Total Messages: ${automatedCount}`);
    console.log(`\nManual Campaigns: ${manual.length}`);
    console.log(`  Total Messages: ${manualCount}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDailyMessages();
