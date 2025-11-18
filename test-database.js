const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('\n========================================');
        console.log('Multi-Tenant Database Verification');
        console.log('========================================\n');
        
        // Check organizations
        const orgs = await prisma.organization.findMany({
            include: { 
                _count: { 
                    select: { users: true, customers: true, emailCampaigns: true, smsCampaigns: true } 
                } 
            }
        });
        
        console.log(`📊 Organizations: ${orgs.length}\n`);
        orgs.forEach((org, i) => {
            console.log(`${i + 1}. ${org.name} (${org.slug})`);
            console.log(`   ID: ${org.id}`);
            console.log(`   Users: ${org._count.users}`);
            console.log(`   Customers: ${org._count.customers}`);
            console.log(`   Email Campaigns: ${org._count.emailCampaigns}`);
            console.log(`   SMS Campaigns: ${org._count.smsCampaigns}\n`);
        });
        
        // Check customers
        const totalCustomers = await prisma.customer.count();
        const customersWithOrg = await prisma.customer.count({ 
            where: { organizationId: { not: null } } 
        });
        const custPercent = totalCustomers > 0 ? Math.round((customersWithOrg / totalCustomers) * 100) : 0;
        console.log(`👥 Customers: ${totalCustomers} total, ${customersWithOrg} with organizationId (${custPercent}%)`);
        
        // Check email campaigns
        const emailCampaigns = await prisma.emailCampaign.count();
        const emailWithOrg = await prisma.emailCampaign.count({ 
            where: { organizationId: { not: null } } 
        });
        const emailPercent = emailCampaigns > 0 ? Math.round((emailWithOrg / emailCampaigns) * 100) : 0;
        console.log(`📧 Email Campaigns: ${emailCampaigns} total, ${emailWithOrg} with organizationId (${emailPercent}%)`);
        
        // Check SMS campaigns  
        const smsCampaigns = await prisma.smsCampaign.count();
        const smsWithOrg = await prisma.smsCampaign.count({ 
            where: { organizationId: { not: null } } 
        });
        const smsPercent = smsCampaigns > 0 ? Math.round((smsWithOrg / smsCampaigns) * 100) : 0;
        console.log(`📱 SMS Campaigns: ${smsCampaigns} total, ${smsWithOrg} with organizationId (${smsPercent}%)`);
        
        // Check users
        console.log('\n👤 Users:\n');
        const users = await prisma.user.findMany({
            include: {
                organization: { select: { name: true, slug: true } }
            },
            take: 5
        });
        
        users.forEach((user, i) => {
            const orgName = user.organization ? user.organization.name : 'NO ORGANIZATION';
            const status = user.organizationId ? '✓' : '✗';
            console.log(`${status} ${i + 1}. ${user.email} - ${orgName}`);
        });
        
        if (users.length === 0) {
            console.log('  No users found');
        }
        
        const usersWithoutOrg = await prisma.user.count({ 
            where: { organizationId: null } 
        });
        
        if (usersWithoutOrg > 0) {
            console.log(`\n⚠️  ${usersWithoutOrg} user(s) need organizationId assigned!`);
        }
        
        console.log('\n========================================');
        console.log('✅ Database check complete!');
        console.log('========================================\n');
        
        console.log('Next steps:');
        console.log('1. Open Prisma Studio: http://localhost:5556');
        console.log('2. Review MANUAL_TESTING_GUIDE.md');
        console.log('3. Test with browser (two different org users)\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

test();
