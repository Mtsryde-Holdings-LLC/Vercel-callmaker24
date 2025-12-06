const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setOrgSlug() {
  try {
    const org = await prisma.organization.findFirst({
      where: { id: 'cmirtl4590001j5m9wsq8va37' }
    })

    if (!org) {
      console.log('Organization not found')
      return
    }

    console.log('Current org:', org)

    if (!org.slug) {
      const slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      
      await prisma.organization.update({
        where: { id: org.id },
        data: { slug }
      })

      console.log(`✅ Set slug to: ${slug}`)
      console.log(`\nYour loyalty signup URL is:`)
      console.log(`https://callmaker24.com/loyalty/signup?org=${slug}`)
    } else {
      console.log(`✅ Slug already set: ${org.slug}`)
      console.log(`\nYour loyalty signup URL is:`)
      console.log(`https://callmaker24.com/loyalty/signup?org=${org.slug}`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setOrgSlug()
