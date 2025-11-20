require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, organizationId: true }
    });
    
    console.log('Users:', users);
    
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'CallMaker24', slug: 'callmaker24' }
      });
    }
    
    console.log('Organization:', org.id);
    
    // Update all users
    await prisma.user.updateMany({
      data: { organizationId: org.id }
    });
    
    console.log('✅ All users updated');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();