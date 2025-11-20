require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestCustomer() {
  try {
    // Find first user with organization
    const user = await prisma.user.findFirst({
      where: {
        organizationId: { not: null }
      }
    });

    if (!user) {
      console.log('No user with organization found');
      return;
    }

    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        email: 'test@example.com',
        phone: '+18327881895',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Test Company',
        organizationId: user.organizationId,
        createdById: user.id
      }
    });

    console.log('✅ Test customer created:', customer.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCustomer();