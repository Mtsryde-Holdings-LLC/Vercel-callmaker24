const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDefaultOrganization() {
  try {
    console.log('🏢 Creating default organization...\n')

    // Check if organization already exists
    const existingOrg = await prisma.organization.findFirst()
    
    if (existingOrg) {
      console.log('✅ Organization already exists:')
      console.log(`   Name: ${existingOrg.name}`)
      console.log(`   ID: ${existingOrg.id}`)
      console.log(`   Slug: ${existingOrg.slug}`)
      console.log(`   Subscription: ${existingOrg.subscriptionTier}\n`)
      
      // Update users without organization
      const usersWithoutOrg = await prisma.user.findMany({
        where: { organizationId: null }
      })
      
      if (usersWithoutOrg.length > 0) {
        console.log(`📝 Updating ${usersWithoutOrg.length} users without organization...`)
        
        await prisma.user.updateMany({
          where: { organizationId: null },
          data: { organizationId: existingOrg.id }
        })
        
        console.log('✅ Users updated successfully!\n')
      }
      
      return existingOrg
    }

    // Create new organization
    const organization = await prisma.organization.create({
      data: {
        name: 'CallMaker24',
        slug: 'callmaker24',
        domain: 'callmaker24.com',
        subscriptionTier: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
        
        // Enterprise limits
        maxSubAdmins: 50,
        maxAgents: 100,
        maxCustomers: 100000,
        maxCampaigns: 1000,
        maxEmailsPerMonth: 1000000,
        maxSMSPerMonth: 100000,
        maxVoiceMinutesPerMonth: 50000,
        
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        }
      }
    })

    console.log('✅ Organization created successfully!')
    console.log(`   Name: ${organization.name}`)
    console.log(`   ID: ${organization.id}`)
    console.log(`   Slug: ${organization.slug}`)
    console.log(`   Subscription: ${organization.subscriptionTier}`)
    console.log(`   Max Customers: ${organization.maxCustomers.toLocaleString()}`)
    console.log(`   Max Emails/Month: ${organization.maxEmailsPerMonth.toLocaleString()}\n`)

    // Update all existing users to belong to this organization
    const users = await prisma.user.findMany()
    
    if (users.length > 0) {
      console.log(`📝 Updating ${users.length} existing users...`)
      
      await prisma.user.updateMany({
        data: { organizationId: organization.id }
      })
      
      console.log('✅ Users updated successfully!\n')
    }

    // Show summary
    const userCount = await prisma.user.count({ where: { organizationId: organization.id } })
    const customerCount = await prisma.customer.count({ where: { organizationId: organization.id } })
    
    console.log('📊 Organization Summary:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Customers: ${customerCount}`)
    console.log(`   Status: Ready to use! ✨\n`)

    return organization
    
  } catch (error) {
    console.error('❌ Error creating organization:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createDefaultOrganization()
