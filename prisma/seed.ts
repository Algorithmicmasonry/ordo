import { PrismaClient } from '@prisma/client'
import { auth } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user using Better Auth server API
  try {
    await auth.api.signUpEmail({
      body: {
        email: 'admin@ordo.com',
        password: 'admin123',
        name: 'Admin User',
      }
    })

    // Update role to ADMIN
    await prisma.user.update({
      where: { email: 'admin@ordo.com' },
      data: { 
        role: 'ADMIN',
        emailVerified: true 
      }
    })
    console.log('✅ Created admin user')
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('⚠️  Admin user already exists, skipping...')
    } else {
      throw e
    }
  }

  // Create sales rep
  try {
    await auth.api.signUpEmail({
      body: {
        email: 'sales@ordo.com',
        password: 'sales123',
        name: 'Sales Representative',
      }
    })

    await prisma.user.update({
      where: { email: 'sales@ordo.com' },
      data: { emailVerified: true }
    })
    console.log('✅ Created sales rep user')
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('⚠️  Sales rep already exists, skipping...')
    } else {
      throw e
    }
  }

  // Rest of the seed script (products, agents, etc.) stays the same...
  const product1 = await prisma.product.upsert({
    where: { sku: 'PROD-001' },
    update: {},
    create: {
      name: 'Premium Widget',
      description: 'High-quality widget for everyday use',
      price: 15000,
      cost: 8000,
      sku: 'PROD-001',
      openingStock: 100,
      currentStock: 100,
      isActive: true,
    },
  })

  console.log('✅ Created product:', product1.name)

  const product2 = await prisma.product.upsert({
    where: { sku: 'PROD-002' },
    update: {},
    create: {
      name: 'Standard Gadget',
      description: 'Reliable gadget for daily tasks',
      price: 25000,
      cost: 15000,
      sku: 'PROD-002',
      openingStock: 50,
      currentStock: 50,
      isActive: true,
    },
  })

  console.log('✅ Created product:', product2.name)

  const agent = await prisma.agent.upsert({
    where: { id: 'sample-agent-id' },
    update: {},
    create: {
      id: 'sample-agent-id',
      name: 'Lagos Agent',
      phone: '08012345678',
      location: 'Lagos, Nigeria',
      address: 'Sample Address, Lagos',
      isActive: true,
    },
  })

  console.log('✅ Created agent:', agent.name)

  await prisma.agentStock.upsert({
    where: {
      agentId_productId: {
        agentId: agent.id,
        productId: product1.id,
      },
    },
    update: {},
    create: {
      agentId: agent.id,
      productId: product1.id,
      quantity: 20,
      defective: 0,
      missing: 0,
    },
  })

  console.log('✅ Assigned stock to agent')

  await prisma.product.update({
    where: { id: product1.id },
    data: { currentStock: 80 },
  })

  console.log('✅ Updated product stock')

  console.log('')
  console.log('🎉 Seeding completed!')
  console.log('')
  console.log('📧 Login credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin:')
  console.log('  Email: admin@ordo.com')
  console.log('  Password: admin123')
  console.log('')
  console.log('Sales Rep:')
  console.log('  Email: sales@ordo.com')
  console.log('  Password: sales123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })