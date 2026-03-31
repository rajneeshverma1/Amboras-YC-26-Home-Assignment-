import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STORE_ID = 'store_456';

const EVENT_TYPES = ['page_view', 'add_to_cart', 'remove_from_cart', 'checkout_started', 'purchase'];

const PRODUCTS = [
  { id: 'prod_1', name: 'Wireless Headphones', price: 99.99 },
  { id: 'prod_2', name: 'Smart Watch', price: 19.99 },
  { id: 'prod_3', name: 'Laptop Stand', price: 49.99 },
  { id: 'prod_4', name: 'USB-C Hub', price: 59.99 },
  { id: 'prod_5', name: 'Mechanical Keyboard', price: 129.99 },
  { id: 'prod_6', name: 'Webcam 4K', price: 89.99 },
  { id: 'prod_7', name: 'Desk Lamp LED', price: 34.99 },
  { id: 'prod_8', name: 'Monitor 27"', price: 299.99 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function generateEventId(): string {
  return `evt_${Date.now()}_${randomInt(1000, 9999)}`;
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.event.deleteMany({ where: { storeId: STORE_ID } });
  await prisma.dailyMetrics.deleteMany({ where: { storeId: STORE_ID } });
  await prisma.productMetrics.deleteMany({ where: { storeId: STORE_ID } });

  console.log('Cleared existing data');

  const now = new Date();
  const events = [];

  // Generate events for the last 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    const dailyEvents = randomInt(50, 200);
    
    for (let i = 0; i < dailyEvents; i++) {
      const eventType = randomChoice(EVENT_TYPES);
      const timestamp = new Date(date);
      timestamp.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));

      let data = null;
      
      if (eventType === 'purchase') {
        const product = randomChoice(PRODUCTS);
        data = {
          product_id: product.id,
          product_name: product.name,
          amount: product.price,
          currency: 'USD',
        };
      } else if (eventType === 'add_to_cart' || eventType === 'remove_from_cart') {
        const product = randomChoice(PRODUCTS);
        data = {
          product_id: product.id,
          product_name: product.name,
        };
      }

      events.push({
        eventId: generateEventId(),
        storeId: STORE_ID,
        eventType,
        timestamp,
        data: data || undefined,
      });
    }
  }

  // Insert events in batches
  const batchSize = 1000;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    await prisma.event.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(events.length / batchSize)}`);
  }

  console.log(`Created ${events.length} events`);

  // Generate daily metrics
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayEvents = await prisma.event.findMany({
      where: {
        storeId: STORE_ID,
        timestamp: {
          gte: date,
          lt: nextDate,
        },
      },
    });

    let totalRevenue = 0;
    let totalPageViews = 0;
    let totalAddToCart = 0;
    let totalRemoveFromCart = 0;
    let totalCheckoutStarted = 0;
    let totalPurchases = 0;

    for (const event of dayEvents) {
      switch (event.eventType) {
        case 'page_view':
          totalPageViews++;
          break;
        case 'add_to_cart':
          totalAddToCart++;
          break;
        case 'remove_from_cart':
          totalRemoveFromCart++;
          break;
        case 'checkout_started':
          totalCheckoutStarted++;
          break;
        case 'purchase':
          totalPurchases++;
          if (event.data && typeof event.data === 'object') {
            const data = event.data as any;
            totalRevenue += data.amount || 0;
          }
          break;
      }
    }

    await prisma.dailyMetrics.create({
      data: {
        storeId: STORE_ID,
        date,
        totalRevenue,
        totalPageViews,
        totalAddToCart,
        totalRemoveFromCart,
        totalCheckoutStarted,
        totalPurchases,
        uniqueProductsSold: 0,
      },
    });
  }

  console.log('Created daily metrics for 30 days');

  // Generate product metrics
  const productRevenue = new Map<string, { revenue: number; quantity: number; name: string }>();

  const purchaseEvents = await prisma.event.findMany({
    where: {
      storeId: STORE_ID,
      eventType: 'purchase',
    },
  });

  for (const event of purchaseEvents) {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as any;
      const productId = data.product_id;
      const productName = data.product_name;
      const amount = data.amount || 0;

      if (productId) {
        const existing = productRevenue.get(productId) || { revenue: 0, quantity: 0, name: productName };
        existing.revenue += amount;
        existing.quantity += 1;
        productRevenue.set(productId, existing);
      }
    }
  }

  for (const [productId, data] of productRevenue.entries()) {
    await prisma.productMetrics.create({
      data: {
        storeId: STORE_ID,
        productId,
        productName: data.name,
        date: now,
        revenue: data.revenue,
        quantitySold: data.quantity,
      },
    });
  }

  console.log(`Created product metrics for ${productRevenue.size} products`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
