const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserRoles() {
    try {
        console.log('\n🔧 Fixing user roles...\n');
        
        // Get all organizations
        const orgs = await prisma.organization.findMany();
        
        for (const org of orgs) {
            console.log(`\n📋 Organization: ${org.name}`);
            
            // Get all users in this organization
            const users = await prisma.user.findMany({
                where: { organizationId: org.id },
                orderBy: { createdAt: 'asc' }
            });
            
            if (users.length === 0) {
                console.log('   No users found');
                continue;
            }
            
            // Make the first user CORPORATE_ADMIN if they're not already
            const firstUser = users[0];
            if (firstUser.role !== 'CORPORATE_ADMIN' && firstUser.role !== 'SUPER_ADMIN') {
                await prisma.user.update({
                    where: { id: firstUser.id },
                    data: { role: 'CORPORATE_ADMIN' }
                });
                console.log(`   ✓ ${firstUser.email} → CORPORATE_ADMIN`);
            } else {
                console.log(`   ✓ ${firstUser.email} (already ${firstUser.role})`);
            }
            
            // Make other users AGENT if they don't have a role
            for (let i = 1; i < users.length; i++) {
                const user = users[i];
                if (!user.role || user.role === 'SUBSCRIBER') {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { role: 'AGENT' }
                    });
                    console.log(`   ✓ ${user.email} → AGENT`);
                } else {
                    console.log(`   ✓ ${user.email} (${user.role})`);
                }
            }
        }
        
        console.log('\n========================================');
        console.log('✅ User roles updated!');
        console.log('========================================\n');
        
        console.log('Summary:');
        console.log('- First user in each org = CORPORATE_ADMIN (can invite users)');
        console.log('- Other users = AGENT (can handle calls/customers)');
        console.log('\nNow you can:');
        console.log('1. Login with the first user from each org');
        console.log('2. Go to Team page (/dashboard/team)');
        console.log('3. Click "Invite User" to add team members\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

fixUserRoles();
