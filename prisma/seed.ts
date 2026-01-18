import { PrismaClient, OrderStatus, OrderSource } from '@prisma/client'
import { auth } from '../lib/auth'

const prisma = new PrismaClient()

// Helper function to get random date in the last N days
function getRandomDateInLastNDays(days: number): Date {
  const now = new Date()
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime())
  return new Date(randomTime)
}

// Helper to get random item from array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================
  // 1. CREATE USERS
  // ============================================

  // Create admin user
  try {
    await auth.api.signUpEmail({
      body: {
        email: 'admin@ordo.com',
        password: 'admin123',
        name: 'Admin User',
      }
    })

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

  // Create multiple sales reps
  const salesReps = [
    { email: 'john.doe@ordo.com', name: 'John Doe' },
    { email: 'jane.smith@ordo.com', name: 'Jane Smith' },
    { email: 'michael.obi@ordo.com', name: 'Michael Obi' },
    { email: 'sarah.adeyemi@ordo.com', name: 'Sarah Adeyemi' },
    { email: 'david.uche@ordo.com', name: 'David Uche' },
  ]

  for (const rep of salesReps) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: rep.email,
          password: 'sales123',
          name: rep.name,
        }
      })

      await prisma.user.update({
        where: { email: rep.email },
        data: {
          role: 'SALES_REP',
          emailVerified: true
        }
      })
      console.log(`✅ Created sales rep: ${rep.name}`)
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`⚠️  Sales rep ${rep.name} already exists, skipping...`)
      } else {
        throw e
      }
    }
  }

  // Create inventory manager
  try {
    await auth.api.signUpEmail({
      body: {
        email: 'inventory@ordo.com',
        password: 'inventory123',
        name: 'Inventory Manager',
      }
    })

    await prisma.user.update({
      where: { email: 'inventory@ordo.com' },
      data: {
        role: 'INVENTORY_MANAGER',
        emailVerified: true
      }
    })
    console.log('✅ Created inventory manager')
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('⚠️  Inventory manager already exists, skipping...')
    } else {
      throw e
    }
  }

  // Get all sales reps for order assignment
  const allSalesReps = await prisma.user.findMany({
    where: { role: 'SALES_REP' }
  })

  // ============================================
  // 2. CREATE PRODUCTS
  // ============================================

  const productsData = [
    { name: 'Premium Wireless Headphones', description: 'High-quality wireless headphones with noise cancellation', price: 45000, cost: 25000, sku: 'PROD-001', stock: 150 },
    { name: 'Smart Watch Pro', description: 'Feature-rich smartwatch with health tracking', price: 65000, cost: 38000, sku: 'PROD-002', stock: 80 },
    { name: 'Portable Bluetooth Speaker', description: 'Waterproof bluetooth speaker with 12-hour battery', price: 28000, cost: 15000, sku: 'PROD-003', stock: 200 },
    { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with precision tracking', price: 8500, cost: 4000, sku: 'PROD-004', stock: 300 },
    { name: 'Mechanical Keyboard', description: 'RGB mechanical gaming keyboard', price: 35000, cost: 20000, sku: 'PROD-005', stock: 120 },
    { name: 'Phone Power Bank 20000mAh', description: 'Fast charging power bank with dual USB ports', price: 15000, cost: 7500, sku: 'PROD-006', stock: 250 },
    { name: 'LED Desk Lamp', description: 'Adjustable LED desk lamp with USB charging port', price: 12000, cost: 6000, sku: 'PROD-007', stock: 180 },
    { name: 'Webcam HD 1080p', description: 'Full HD webcam with built-in microphone', price: 22000, cost: 12000, sku: 'PROD-008', stock: 90 },
    { name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI and ethernet', price: 18000, cost: 9000, sku: 'PROD-009', stock: 160 },
    { name: 'Laptop Stand', description: 'Aluminum laptop stand with cooling design', price: 9500, cost: 4500, sku: 'PROD-010', stock: 200 },
    { name: 'Screen Protector Pack', description: 'Tempered glass screen protectors (3-pack)', price: 5000, cost: 2000, sku: 'PROD-011', stock: 400 },
    { name: 'Phone Case Bundle', description: 'Premium phone cases with screen protector', price: 7500, cost: 3000, sku: 'PROD-012', stock: 350 },
  ]

  const products = []
  for (const prod of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        cost: prod.cost,
        sku: prod.sku,
        openingStock: prod.stock,
        currentStock: prod.stock,
        isActive: true,
      },
    })
    products.push(product)
    console.log(`✅ Created product: ${product.name}`)
  }

  // ============================================
  // 3. CREATE AGENTS
  // ============================================

  const agentsData = [
    { id: 'agent-lagos-1', name: 'Chinedu Okafor', phone: '08012345678', location: 'Lagos, Nigeria', address: '15 Allen Avenue, Ikeja, Lagos' },
    { id: 'agent-abuja-1', name: 'Fatima Ahmed', phone: '08098765432', location: 'Abuja, Nigeria', address: '23 Gimbiya Street, Garki, Abuja' },
    { id: 'agent-portharcourt-1', name: 'Emmanuel Bassey', phone: '08123456789', location: 'Port Harcourt, Nigeria', address: '8 Aba Road, Port Harcourt' },
    { id: 'agent-ibadan-1', name: 'Folake Williams', phone: '08087654321', location: 'Ibadan, Nigeria', address: '12 Ring Road, Ibadan' },
  ]

  const agents = []
  for (const agentData of agentsData) {
    const agent = await prisma.agent.upsert({
      where: { id: agentData.id },
      update: {},
      create: agentData,
    })
    agents.push(agent)
    console.log(`✅ Created agent: ${agent.name}`)

    // Assign random stock to each agent
    const randomProducts = products.sort(() => 0.5 - Math.random()).slice(0, 5)
    for (const product of randomProducts) {
      await prisma.agentStock.upsert({
        where: {
          agentId_productId: {
            agentId: agent.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          agentId: agent.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 30) + 10,
          defective: Math.floor(Math.random() * 3),
          missing: Math.floor(Math.random() * 2),
        },
      })
    }
  }

  console.log('✅ Assigned stock to agents')

  // ============================================
  // 4. CREATE ORDERS
  // ============================================

  const nigerianNames = [
    'Adewale Johnson', 'Chinwe Okonkwo', 'Ibrahim Musa', 'Blessing Eze',
    'Tunde Adeleke', 'Ngozi Ibe', 'Yusuf Mohammed', 'Funmi Oladele',
    'Emeka Okoli', 'Aisha Bello', 'Kunle Ajayi', 'Chioma Nwosu',
    'Usman Abdullahi', 'Nneka Okeke', 'Bashir Hassan', 'Shade Akinola',
    'Chukwudi Anyanwu', 'Zainab Lawal', 'Oluwaseun Ogundipe', 'Amara Ike',
    'Musa Garba', 'Folasade Adeyemi', 'Kenneth Udo', 'Hauwa Ibrahim',
    'Obinna Eze', 'Rashida Suleiman', 'Felix Okafor', 'Patience Okonkwo',
    'Ahmed Tijani', 'Gloria Etim', 'Ikenna Obi', 'Halima Sani',
    'Victor Odili', 'Mercy Bassey', 'Suleiman Baba', 'Rita Nnamdi',
  ]

  const cities = [
    { city: 'Lagos', state: 'Lagos State' },
    { city: 'Ikeja', state: 'Lagos State' },
    { city: 'Abuja', state: 'FCT' },
    { city: 'Port Harcourt', state: 'Rivers State' },
    { city: 'Ibadan', state: 'Oyo State' },
    { city: 'Kano', state: 'Kano State' },
    { city: 'Enugu', state: 'Enugu State' },
    { city: 'Benin City', state: 'Edo State' },
    { city: 'Owerri', state: 'Imo State' },
    { city: 'Kaduna', state: 'Kaduna State' },
  ]

  const addresses = [
    'Plot 15, Admiralty Way',
    '23 Ademola Adetokunbo Street',
    '8 Unity Road',
    '45 Airport Road',
    'Block 7, Flat 3, Housing Estate',
    '12 Independence Avenue',
    'House 9, Royal Gardens',
    '34 Ogui Road',
    '21 New Haven Extension',
    '6 Opebi Road',
  ]

  const orderStatuses = [
    OrderStatus.NEW,
    OrderStatus.CONFIRMED,
    OrderStatus.DISPATCHED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.POSTPONED,
  ]

  const orderSources = [
    OrderSource.FACEBOOK,
    OrderSource.TIKTOK,
    OrderSource.WHATSAPP,
    OrderSource.WEBSITE,
  ]

  console.log('Creating orders...')

  const orders = []
  for (let i = 0; i < 50; i++) {
    const location = randomItem(cities)
    const status = randomItem(orderStatuses)
    const source = randomItem(orderSources)
    const salesRep = randomItem(allSalesReps)
    const agent = Math.random() > 0.3 ? randomItem(agents) : null // 70% have agent assigned

    // Create order date in last 30 days
    const createdAt = getRandomDateInLastNDays(30)

    // Status-based timestamps
    let confirmedAt = null
    let dispatchedAt = null
    let deliveredAt = null
    let cancelledAt = null

    if (status !== OrderStatus.NEW) {
      confirmedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
    }

    if (status === OrderStatus.DISPATCHED || status === OrderStatus.DELIVERED) {
      dispatchedAt = new Date(confirmedAt!.getTime() + Math.random() * 24 * 60 * 60 * 1000)
    }

    if (status === OrderStatus.DELIVERED) {
      deliveredAt = new Date(dispatchedAt!.getTime() + Math.random() * 48 * 60 * 60 * 1000)
    }

    if (status === OrderStatus.CANCELLED) {
      cancelledAt = confirmedAt || new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
    }

    // Random items (1-3 products per order)
    const numItems = Math.floor(Math.random() * 3) + 1
    const orderProducts = products.sort(() => 0.5 - Math.random()).slice(0, numItems)

    let totalAmount = 0
    const items = orderProducts.map(product => {
      const quantity = Math.floor(Math.random() * 3) + 1
      totalAmount += product.price * quantity
      return {
        productId: product.id,
        quantity,
        price: product.price,
        cost: product.cost,
      }
    })

    const order = await prisma.order.create({
      data: {
        customerName: randomItem(nigerianNames),
        customerPhone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        customerWhatsapp: Math.random() > 0.5 ? `081${Math.floor(10000000 + Math.random() * 90000000)}` : null,
        deliveryAddress: randomItem(addresses),
        city: location.city,
        state: location.state,
        status,
        source,
        totalAmount,
        assignedToId: salesRep.id,
        agentId: agent?.id,
        createdAt,
        confirmedAt,
        dispatchedAt,
        deliveredAt,
        cancelledAt,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    })

    orders.push(order)

    // Add notes to some orders (30% chance)
    if (Math.random() > 0.7) {
      const noteTexts = [
        'Customer requested delivery before 2 PM',
        'Payment confirmed via bank transfer',
        'Customer prefers WhatsApp communication',
        'Delivery rescheduled due to customer unavailability',
        'Customer requested gift wrapping',
        'Special instructions: Leave at gate',
      ]

      await prisma.orderNote.create({
        data: {
          orderId: order.id,
          note: randomItem(noteTexts),
          isFollowUp: Math.random() > 0.8,
          followUpDate: Math.random() > 0.8 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        },
      })
    }
  }

  console.log(`✅ Created ${orders.length} orders`)

  // ============================================
  // 5. CREATE EXPENSES
  // ============================================

  const expenseTypes = [
    { type: 'ad_spend', description: 'Facebook Ads Campaign - Electronics' },
    { type: 'ad_spend', description: 'TikTok Marketing - January Campaign' },
    { type: 'delivery', description: 'Courier services - Lagos deliveries' },
    { type: 'delivery', description: 'Fuel and logistics - Abuja zone' },
    { type: 'shipping', description: 'Import shipping from China' },
    { type: 'clearing', description: 'Customs clearing charges' },
    { type: 'other', description: 'Office supplies and utilities' },
  ]

  for (const expense of expenseTypes) {
    await prisma.expense.create({
      data: {
        type: expense.type,
        amount: Math.floor(Math.random() * 100000) + 20000,
        description: expense.description,
        productId: Math.random() > 0.5 ? randomItem(products).id : null,
        date: getRandomDateInLastNDays(30),
      },
    })
  }

  console.log('✅ Created expenses')

  // ============================================
  // 6. UPDATE PRODUCT STOCK BASED ON DELIVERED ORDERS
  // ============================================

  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED)
  for (const order of deliveredOrders) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity,
          },
        },
      })
    }
  }

  console.log('✅ Updated product stock based on delivered orders')

  // ============================================
  // DONE
  // ============================================

  console.log('')
  console.log('🎉 Seeding completed!')
  console.log('')
  console.log('📊 Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Users: ${allSalesReps.length + 2} (1 Admin, ${allSalesReps.length} Sales Reps, 1 Inventory Manager)`)
  console.log(`   Products: ${products.length}`)
  console.log(`   Agents: ${agents.length}`)
  console.log(`   Orders: ${orders.length}`)
  console.log(`   - NEW: ${orders.filter(o => o.status === OrderStatus.NEW).length}`)
  console.log(`   - CONFIRMED: ${orders.filter(o => o.status === OrderStatus.CONFIRMED).length}`)
  console.log(`   - DISPATCHED: ${orders.filter(o => o.status === OrderStatus.DISPATCHED).length}`)
  console.log(`   - DELIVERED: ${orders.filter(o => o.status === OrderStatus.DELIVERED).length}`)
  console.log(`   - CANCELLED: ${orders.filter(o => o.status === OrderStatus.CANCELLED).length}`)
  console.log(`   - POSTPONED: ${orders.filter(o => o.status === OrderStatus.POSTPONED).length}`)
  console.log('')
  console.log('📧 Login credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin:')
  console.log('  Email: admin@ordo.com')
  console.log('  Password: admin123')
  console.log('')
  console.log('Sales Reps (all use password: sales123):')
  salesReps.forEach(rep => {
    console.log(`  - ${rep.email}`)
  })
  console.log('')
  console.log('Inventory Manager:')
  console.log('  Email: inventory@ordo.com')
  console.log('  Password: inventory123')
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
