const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setup() {
    try {
        console.log('\n🏗️  Setting up test organizations...\n');
        
        // Create Organization 1
        const org1 = await prisma.organization.create({
            data: {
                name: 'Acme Corporation',
                slug: 'acme-corp',
                domain: 'acme-corp.com',
                settings: {}
            }
        });
        console.log('✅ Created:', org1.name, `(ID: ${org1.id})`);
        
        // Create Organization 2
        const org2 = await prisma.organization.create({
            data: {
                name: 'Beta Industries',
                slug: 'beta-industries',
                domain: 'beta-ind.com',
                settings: {}
            }
        });
        console.log('✅ Created:', org2.name, `(ID: ${org2.id})`);
        
        console.log('\n👥 Assigning users to organizations...\n');
        
        // Get all users
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });
        
        // Assign first half to org1, second half to org2
        const midpoint = Math.ceil(users.length / 2);
        
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const targetOrg = i < midpoint ? org1 : org2;
            
            await prisma.user.update({
                where: { id: user.id },
                data: { organizationId: targetOrg.id }
            });
            
            console.log(`✓ ${user.email} → ${targetOrg.name}`);
        }
        
        console.log('\n========================================');
        console.log('✅ Setup complete!');
        console.log('========================================\n');
        
        console.log('Organization Summary:');
        console.log(`1. ${org1.name} (${org1.slug})`);
        console.log(`   ID: ${org1.id}`);
        console.log(`   Users: ${midpoint}`);
        console.log();
        console.log(`2. ${org2.name} (${org2.slug})`);
        console.log(`   ID: ${org2.id}`);
        console.log(`   Users: ${users.length - midpoint}`);
        console.log();
        
        console.log('Next Steps:');
        console.log('1. Run: node test-database.js (to verify)');
        console.log('2. Start dev server: npm run dev');
        console.log('3. Login with users from different orgs');
        console.log('4. Follow MANUAL_TESTING_GUIDE.md\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'P2002') {
            console.log('\n💡 Organizations may already exist. Run test-database.js to check.\n');
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

setup();
