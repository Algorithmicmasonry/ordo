import { db } from './db'

const ROUND_ROBIN_KEY = 'last_assigned_sales_rep_index'

/**
 * Get the next sales rep in round-robin order
 * This ensures fair distribution of orders among all active sales reps
 */
export async function getNextSalesRep(): Promise<string | null> {
  // Get all active sales reps
  const salesReps = await db.user.findMany({
    where: {
      role: 'SALES_REP',
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc', // Consistent ordering
    },
  })

  if (salesReps.length === 0) {
    return null
  }

  // Get the last assigned index from system settings
  let lastIndex = await db.systemSetting.findUnique({
    where: { key: ROUND_ROBIN_KEY },
  })

  let currentIndex = 0

  if (lastIndex) {
    currentIndex = (parseInt(lastIndex.value) + 1) % salesReps.length
  }

  // Update the index in the database
  await db.systemSetting.upsert({
    where: { key: ROUND_ROBIN_KEY },
    update: { value: currentIndex.toString() },
    create: {
      key: ROUND_ROBIN_KEY,
      value: currentIndex.toString(),
    },
  })

  return salesReps[currentIndex].id
}

/**
 * Reset the round-robin counter (useful when sales reps are added/removed)
 */
export async function resetRoundRobin(): Promise<void> {
  await db.systemSetting.upsert({
    where: { key: ROUND_ROBIN_KEY },
    update: { value: '0' },
    create: {
      key: ROUND_ROBIN_KEY,
      value: '0',
    },
  })
}

/**
 * Get the current round-robin index without incrementing it
 */
export async function getCurrentRoundRobinIndex(): Promise<number> {
  const setting = await db.systemSetting.findUnique({
    where: { key: ROUND_ROBIN_KEY },
  })

  return setting ? parseInt(setting.value) : 0
}
