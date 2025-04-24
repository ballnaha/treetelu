// Script to test if user IDs are correctly associated with orders
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserOrders() {
  try {
    console.log('Fetching recent orders with user information...');
    
    // Get the 5 most recent orders with their associated user information
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        customerInfo: true
      }
    });
    
    console.log(`Found ${recentOrders.length} recent orders.`);
    
    // Display order information with user details
    recentOrders.forEach((order, index) => {
      console.log(`\nOrder #${index + 1}:`);
      console.log(`  Order Number: ${order.orderNumber}`);
      console.log(`  Total Amount: ${order.finalAmount}`);
      console.log(`  Created At: ${order.createdAt}`);
      console.log(`  User ID: ${order.userId ? order.userId.toString() : 'Not associated with a user'}`);
      
      if (order.user) {
        console.log(`  User Details:`);
        console.log(`    Name: ${order.user.firstName} ${order.user.lastName}`);
        console.log(`    Email: ${order.user.email}`);
        console.log(`    Is Admin: ${order.user.isAdmin}`);
      } else {
        console.log(`  User Details: No user associated with this order`);
      }
      
      if (order.customerInfo) {
        console.log(`  Customer Info:`);
        console.log(`    Name: ${order.customerInfo.firstName} ${order.customerInfo.lastName}`);
        console.log(`    Email: ${order.customerInfo.email}`);
      }
    });
    
  } catch (error) {
    console.error('Error testing user orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserOrders();
