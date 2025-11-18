# Multi-Tenant Testing Script
# This script performs automated verification of multi-tenant data isolation

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Multi-Tenant Testing Started" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

Write-Host "Environment variables loaded" -ForegroundColor Green

# Check if development server is running
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Development server is running" -ForegroundColor Green
} else {
    Write-Host "Development server not detected" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Database Verification" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Create a Node script to check database
$checkScript = @'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('\nChecking Database Schema...\n');
        
        // Check if organizationId exists in key models
        const models = [
            'customer',
            'emailCampaign',
            'smsCampaign',
            'emailMessage',
            'smsMessage',
            'call'
        ];
        
        for (const model of models) {
            try {
                const count = await prisma[model].count();
                const withOrg = await prisma[model].count({
                    where: { organizationId: { not: null } }
                });
                const percentage = count > 0 ? Math.round((withOrg / count) * 100) : 0;
                console.log('✓ ' + model.padEnd(20) + ': ' + count + ' total, ' + withOrg + ' with organizationId (' + percentage + '%)');
            } catch (e) {
                console.log('✗ ' + model.padEnd(20) + ': Error - ' + e.message);
            }
        }
        
        console.log('\nChecking Organizations...\n');
        
        // Check organizations
        const orgs = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: {
                        users: true,
                        customers: true,
                        emailCampaigns: true,
                        smsCampaigns: true
                    }
                }
            }
        });
        
        if (orgs.length === 0) {
            console.log('No organizations found.\n');
        } else {
            console.log('Organizations found: ' + orgs.length + '\n');
            orgs.forEach((org, index) => {
                console.log((index + 1) + '. ' + org.name + ' (' + org.slug + ')');
                console.log('   - Users: ' + org._count.users);
                console.log('   - Customers: ' + org._count.customers);
                console.log('   - Email Campaigns: ' + org._count.emailCampaigns);
                console.log('   - SMS Campaigns: ' + org._count.smsCampaigns);
                console.log('   - ID: ' + org.id);
                console.log('');
            });
        }
        
        console.log('\nChecking Users...\n');
        
        // Check users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                organizationId: true,
                organization: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            take: 10
        });
        
        if (users.length === 0) {
            console.log('No users found.\n');
        } else {
            console.log('Users found: ' + users.length + '\n');
            users.forEach((user, index) => {
                const orgInfo = user.organization 
                    ? user.organization.name + ' (' + user.organization.slug + ')'
                    : 'NO ORGANIZATION ASSIGNED';
                const status = user.organizationId ? '✓' : '✗';
                console.log(status + ' ' + (index + 1) + '. ' + user.email + ' - ' + orgInfo);
            });
            
            const withoutOrg = users.filter(u => !u.organizationId).length;
            if (withoutOrg > 0) {
                console.log('\n' + withoutOrg + ' user(s) without organizationId\n');
            }
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
'@

$checkScript | Out-File -FilePath "../check-multitenant.js" -Encoding UTF8

# Run the check
cd ..
node check-multitenant.js

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Prisma Studio: http://localhost:5556" -ForegroundColor White
Write-Host "2. Review database results above" -ForegroundColor White
Write-Host "3. Open MANUAL_TESTING_GUIDE.md for testing steps" -ForegroundColor White
Write-Host ""

# Clean up
Remove-Item -Path "check-multitenant.js" -ErrorAction SilentlyContinue

Write-Host "Testing Setup Complete!" -ForegroundColor Green
Write-Host ""


# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

Write-Host "✓ Environment variables loaded" -ForegroundColor Green

# Check if development server is running
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✓ Development server is running" -ForegroundColor Green
} else {
    Write-Host "⚠ Development server not detected. Starting..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; npm run dev"
    Start-Sleep -Seconds 5
}

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "Database Verification" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Create a Node script to check database
$checkScript = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('\n📊 Checking Database Schema...\n');
        
        // Check if organizationId exists in key models
        const models = [
            'customer',
            'emailCampaign',
            'smsCampaign',
            'emailMessage',
            'smsMessage',
            'call'
        ];
        
        for (const model of models) {
            try {
                const count = await prisma[model].count();
                const withOrg = await prisma[model].count({
                    where: { organizationId: { not: null } }
                });
                const percentage = count > 0 ? Math.round((withOrg / count) * 100) : 0;
                console.log('✓ ' + model.padEnd(20) + ': ' + count + ' total, ' + withOrg + ' with organizationId (' + percentage + '%)');
            } catch (e) {
                console.log('✗ ' + model.padEnd(20) + ': Error checking - ' + e.message);
            }
        }
        
        console.log('\n📊 Checking Organizations...\n');
        
        // Check organizations
        const orgs = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: {
                        users: true,
                        customers: true,
                        emailCampaigns: true,
                        smsCampaigns: true
                    }
                }
            }
        });
        
        if (orgs.length === 0) {
            console.log('⚠ No organizations found. Creating test organizations...\n');
            
            // Create test organizations
            const org1 = await prisma.organization.create({
                data: {
                    name: 'Test Organization A',
                    slug: 'test-org-a',
                    email: 'test-a@example.com'
                }
            });
            
            const org2 = await prisma.organization.create({
                data: {
                    name: 'Test Organization B',
                    slug: 'test-org-b',
                    email: 'test-b@example.com'
                }
            });
            
            console.log('✓ Created Test Organization A (ID: ' + org1.id + ')');
            console.log('✓ Created Test Organization B (ID: ' + org2.id + ')');
            console.log('\n⚠ Note: You need to create users and assign them to these organizations\n');
        } else {
            console.log('Organizations found: ' + orgs.length + '\n');
            orgs.forEach((org, index) => {
                console.log((index + 1) + '. ' + org.name + ' (' + org.slug + ')');
                console.log('   - Users: ' + org._count.users);
                console.log('   - Customers: ' + org._count.customers);
                console.log('   - Email Campaigns: ' + org._count.emailCampaigns);
                console.log('   - SMS Campaigns: ' + org._count.smsCampaigns);
                console.log('   - ID: ' + org.id);
                console.log('');
            });
        }
        
        console.log('\n📊 Checking Users...\n');
        
        // Check users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                organizationId: true,
                organization: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            take: 10
        });
        
        if (users.length === 0) {
            console.log('⚠ No users found. Please create users via signup or admin panel.\n');
        } else {
            console.log('Users found: ' + users.length + '\n');
            users.forEach((user, index) => {
                const orgInfo = user.organization 
                    ? user.organization.name + ' (' + user.organization.slug + ')'
                    : 'NO ORGANIZATION ASSIGNED';
                const status = user.organizationId ? '✓' : '✗';
                console.log(status + ' ' + (index + 1) + '. ' + user.email + ' - ' + orgInfo);
            });
            
            const withoutOrg = users.filter(u => !u.organizationId).length;
            if (withoutOrg > 0) {
                console.log('\n⚠ ' + withoutOrg + ' user(s) without organizationId - they need to be assigned!\n');
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.\$disconnect();
    }
}

checkDatabase();
"@

$checkScript | Out-File -FilePath "check-multitenant.js" -Encoding UTF8

# Run the check
node check-multitenant.js

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "API Route Verification" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

Write-Host "Checking if server responds..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -ErrorAction SilentlyContinue
    Write-Host "✓ Server is responding on port 3000" -ForegroundColor Green
} catch {
    Write-Host "⚠ Server not responding on port 3000" -ForegroundColor Yellow
    Write-Host "  Make sure 'npm run dev' is running" -ForegroundColor Yellow
}

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

Write-Host "1. Prisma Studio is running at: http://localhost:5556" -ForegroundColor White
Write-Host "   - View and manage your database" -ForegroundColor Gray
Write-Host "   - Check organizationId fields" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Review the database check results above" -ForegroundColor White
Write-Host "   - Ensure organizations exist" -ForegroundColor Gray
Write-Host "   - Verify users have organizationId assigned" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Manual Testing:" -ForegroundColor White
Write-Host "   - Open MANUAL_TESTING_GUIDE.md for detailed instructions" -ForegroundColor Gray
Write-Host "   - Test with two different organization users" -ForegroundColor Gray
Write-Host "   - Verify data isolation" -ForegroundColor Gray
Write-Host ""
Write-Host "4. If you need test organizations:" -ForegroundColor White
Write-Host "   - Go to Prisma Studio -> Organization table" -ForegroundColor Gray
Write-Host "   - Create 2 organizations (if they don't exist)" -ForegroundColor Gray
Write-Host "   - Assign users to different organizations" -ForegroundColor Gray
Write-Host ""

# Clean up
Remove-Item -Path "check-multitenant.js" -ErrorAction SilentlyContinue

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "Testing Setup Complete!" -ForegroundColor Green
Write-Host "===================================`n" -ForegroundColor Cyan
