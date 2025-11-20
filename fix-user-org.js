require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserOrganization() {
  try {
    // Find or create organization
    let org = await prisma.organization.findFirst();
    
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'CallMaker24',
          slug: 'callmaker24'
        }
      });
      console.log('✅ Created organization:', org.name);
    }

    // Update all users without organization
    const result = await prisma.user.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    });

    console.log(`✅ Updated ${result.count} users with organization`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserOrganization();