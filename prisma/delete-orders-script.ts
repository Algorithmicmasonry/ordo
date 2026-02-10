import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllOrdersAndCustomerData() {
  console.log("🚀 Starting deletion of all orders and customer data...\n");

  try {
    // Use a transaction to ensure all deletions succeed or none do
    await prisma.$transaction(async (tx) => {
      // 1. Delete OrderNotes (references orders)
      console.log("📝 Deleting order notes...");
      const deletedNotes = await tx.orderNote.deleteMany({});
      console.log(`   ✓ Deleted ${deletedNotes.count} order notes\n`);

      // 2. Delete OrderItems (references orders and products)
      console.log("📦 Deleting order items...");
      const deletedItems = await tx.orderItem.deleteMany({});
      console.log(`   ✓ Deleted ${deletedItems.count} order items\n`);

      // 3. Delete Orders
      console.log("🛒 Deleting orders...");
      const deletedOrders = await tx.order.deleteMany({});
      console.log(`   ✓ Deleted ${deletedOrders.count} orders\n`);

      // 4. Optional: Reset agent stock to zero (since orders are gone)
      console.log("📊 Resetting agent stock...");
      const updatedAgentStock = await tx.agentStock.updateMany({
        data: {
          quantity: 0,
          defective: 0,
          missing: 0,
        },
      });
      console.log(
        `   ✓ Reset ${updatedAgentStock.count} agent stock records\n`,
      );

      // 5. Optional: Delete settlements (financial records tied to orders)
      console.log("💰 Deleting settlements...");
      const deletedSettlements = await tx.settlement.deleteMany({});
      console.log(`   ✓ Deleted ${deletedSettlements.count} settlements\n`);

      // 6. Optional: Reset product current stock to opening stock
      console.log("📈 Resetting product stock to opening stock...");
      const products = await tx.product.findMany({
        select: { id: true, openingStock: true },
      });

      for (const product of products) {
        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: product.openingStock },
        });
      }
      console.log(`   ✓ Reset stock for ${products.length} products\n`);

      // 7. Optional: Delete order-related notifications
      console.log("🔔 Deleting order-related notifications...");
      const deletedNotifications = await tx.notification.deleteMany({
        where: {
          OR: [
            { type: "ORDER_ASSIGNED" },
            { type: "ORDER_STATUS_CHANGED" },
            { type: "ORDER_DELIVERED" },
            { type: "ORDER_NOTE_ADDED" },
            { type: "NEW_ORDER" },
            { orderId: { not: null } },
          ],
        },
      });
      console.log(
        `   ✓ Deleted ${deletedNotifications.count} order-related notifications\n`,
      );

      // 8. Optional: Reset round-robin assignment counter
      console.log("🔄 Resetting round-robin counter...");
      await tx.systemSetting.deleteMany({
        where: { key: "lastAssignedUserId" }, // Adjust this key if different in your system
      });
      console.log("   ✓ Reset round-robin counter\n");
    });

    console.log("✅ Successfully deleted all orders and customer data!");
    console.log("\n📋 Summary of preserved data:");

    // Show what's preserved
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count({
      where: { isDeleted: false },
    });
    const priceCount = await prisma.productPrice.count();
    const packageCount = await prisma.productPackage.count();
    const agentCount = await prisma.agent.count();

    console.log(`   • Users: ${userCount}`);
    console.log(`   • Products: ${productCount}`);
    console.log(`   • Product Prices: ${priceCount}`);
    console.log(`   • Product Packages: ${packageCount}`);
    console.log(`   • Agents: ${agentCount}`);
  } catch (error) {
    console.error("❌ Error during deletion:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllOrdersAndCustomerData()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
