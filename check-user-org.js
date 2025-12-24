const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUserOrg() {
  try {
    console.log("Checking user and organization setup...\n");

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });

    console.log(`Found ${users.length} user(s):`);
    users.forEach((user) => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Organization ID: ${user.organizationId || "NOT SET"}`);
      console.log("");
    });

    // Get all organizations
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionStatus: true,
      },
    });

    console.log(`\nFound ${orgs.length} organization(s):`);
    for (const org of orgs) {
      const customers = await prisma.customer.count({
        where: { organizationId: org.id },
      });
      const emails = await prisma.emailCampaign.count({
        where: { organizationId: org.id },
      });
      const sms = await prisma.smsCampaign.count({
        where: { organizationId: org.id },
      });
      const social = await prisma.socialAccount.count({
        where: { organizationId: org.id },
      });
      const users = await prisma.user.count({
        where: { organizationId: org.id },
      });

      console.log(`- ${org.name} (${org.slug})`);
      console.log(`  Status: ${org.subscriptionStatus}`);
      console.log(`  Users: ${users}`);
      console.log(`  Customers: ${customers}`);
      console.log(`  Email Campaigns: ${emails}`);
      console.log(`  SMS Campaigns: ${sms}`);
      console.log(`  Social Accounts: ${social}`);
      console.log("");
    }

    // Check for orphaned data
    const customersWithoutOrg = await prisma.customer.count({
      where: { organizationId: null },
    });
    const emailsWithoutOrg = await prisma.emailCampaign.count({
      where: { organizationId: null },
    });
    const smsWithoutOrg = await prisma.smsCampaign.count({
      where: { organizationId: null },
    });
    const socialWithoutOrg = await prisma.socialAccount.count({
      where: { organizationId: null },
    });

    if (
      customersWithoutOrg > 0 ||
      emailsWithoutOrg > 0 ||
      smsWithoutOrg > 0 ||
      socialWithoutOrg > 0
    ) {
      console.log("\n⚠️  WARNING: Found orphaned data:");
      if (customersWithoutOrg > 0)
        console.log(
          `  - ${customersWithoutOrg} customers without organization`
        );
      if (emailsWithoutOrg > 0)
        console.log(
          `  - ${emailsWithoutOrg} email campaigns without organization`
        );
      if (smsWithoutOrg > 0)
        console.log(`  - ${smsWithoutOrg} SMS campaigns without organization`);
      if (socialWithoutOrg > 0)
        console.log(
          `  - ${socialWithoutOrg} social accounts without organization`
        );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserOrg();
