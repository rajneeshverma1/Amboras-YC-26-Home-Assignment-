import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OverviewResponseDto } from './dto/overview-response.dto';
import { TopProductsResponseDto } from './dto/top-products-response.dto';
import { RecentActivityResponseDto } from './dto/recent-activity-response.dto';

// Mock data for demo purposes when database is not available
const MOCK_PRODUCTS = [
  { productId: 'prod_1', productName: 'Wireless Headphones', revenue: 2459.68, quantitySold: 31 },
  { productId: 'prod_2', productName: 'Smart Watch', revenue: 5399.73, quantitySold: 27 },
  { productId: 'prod_3', productName: 'Laptop Stand', revenue: 1449.71, quantitySold: 29 },
  { productId: 'prod_4', productName: 'USB-C Hub', revenue: 1679.72, quantitySold: 28 },
  { productId: 'prod_5', productName: 'Mechanical Keyboard', revenue: 3379.74, quantitySold: 26 },
  { productId: 'prod_6', productName: 'Webcam 4K', revenue: 2429.73, quantitySold: 27 },
  { productId: 'prod_7', productName: 'Desk Lamp LED', revenue: 1014.71, quantitySold: 29 },
  { productId: 'prod_8', productName: 'Monitor 27"', revenue: 8399.72, quantitySold: 28 },
];

const MOCK_EVENTS = [
  { eventId: 'evt_001', eventType: 'purchase', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), data: { product_name: 'Smart Watch', amount: 199.99 } },
  { eventId: 'evt_002', eventType: 'add_to_cart', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), data: { product_name: 'Wireless Headphones' } },
  { eventId: 'evt_003', eventType: 'page_view', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), data: {} },
  { eventId: 'evt_004', eventType: 'checkout_started', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), data: {} },
  { eventId: 'evt_005', eventType: 'purchase', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), data: { product_name: 'Mechanical Keyboard', amount: 129.99 } },
  { eventId: 'evt_006', eventType: 'page_view', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), data: {} },
  { eventId: 'evt_007', eventType: 'add_to_cart', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), data: { product_name: 'Monitor 27"' } },
  { eventId: 'evt_008', eventType: 'remove_from_cart', timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(), data: { product_name: 'USB-C Hub' } },
  { eventId: 'evt_009', eventType: 'purchase', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), data: { product_name: 'Laptop Stand', amount: 49.99 } },
  { eventId: 'evt_010', eventType: 'page_view', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), data: {} },
];

@Injectable()
export class AnalyticsService {
  private useMockData = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    // Check if database is available
    this.checkDatabaseConnection();
  }

  private async checkDatabaseConnection() {
    try {
      await this.prisma.$connect();
      this.useMockData = false;
    } catch {
      this.useMockData = true;
      console.log('Database not available, using mock data');
    }
  }

  async getOverview(storeId: string, fresh = false): Promise<OverviewResponseDto> {
    const cacheKey = `overview:${storeId}`;
    
    if (!fresh) {
      const cached = await this.redis.getJSON<OverviewResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    if (this.useMockData) {
      const result: OverviewResponseDto = {
        revenue: {
          today: 1249.95,
          thisWeek: 8947.63,
          thisMonth: 35284.27,
        },
        events: {
          pageViews: 12543,
          addToCart: 3241,
          removeFromCart: 892,
          checkoutStarted: 1847,
          purchases: 634,
        },
        conversionRate: 5.06,
      };
      await this.redis.setJSON(cacheKey, result, 300);
      return result;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      // Get today's metrics from raw events (real-time)
      const todayMetrics = await this.getTodayMetrics(storeId, today);

      // Get historical metrics from pre-aggregated data
      const weekMetrics = await this.getHistoricalMetrics(storeId, weekStart, today);
      const monthMetrics = await this.getHistoricalMetrics(storeId, monthStart, today);

      const revenue = {
        today: todayMetrics.revenue,
        thisWeek: weekMetrics.revenue + todayMetrics.revenue,
        thisMonth: monthMetrics.revenue + todayMetrics.revenue,
      };

      const events = {
        pageViews: todayMetrics.pageViews + weekMetrics.pageViews,
        addToCart: todayMetrics.addToCart + weekMetrics.addToCart,
        removeFromCart: todayMetrics.removeFromCart + weekMetrics.removeFromCart,
        checkoutStarted: todayMetrics.checkoutStarted + weekMetrics.checkoutStarted,
        purchases: todayMetrics.purchases + weekMetrics.purchases,
      };

      const conversionRate = events.pageViews > 0 
        ? Number(((events.purchases / events.pageViews) * 100).toFixed(2))
        : 0;

      const result: OverviewResponseDto = {
        revenue,
        events,
        conversionRate,
      };

      // Cache for 5 minutes
      await this.redis.setJSON(cacheKey, result, 300);

      return result;
    } catch (error) {
      console.log('Database error, falling back to mock data');
      this.useMockData = true;
      return this.getOverview(storeId);
    }
  }

  private async getTodayMetrics(storeId: string, today: Date) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await this.prisma.event.findMany({
      where: {
        storeId,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    let revenue = 0;
    let pageViews = 0;
    let addToCart = 0;
    let removeFromCart = 0;
    let checkoutStarted = 0;
    let purchases = 0;

    for (const event of events) {
      switch (event.eventType) {
        case 'page_view':
          pageViews++;
          break;
        case 'add_to_cart':
          addToCart++;
          break;
        case 'remove_from_cart':
          removeFromCart++;
          break;
        case 'checkout_started':
          checkoutStarted++;
          break;
        case 'purchase':
          purchases++;
          if (event.data && typeof event.data === 'object') {
            const data = event.data as any;
            revenue += data.amount ? parseFloat(data.amount) : 0;
          }
          break;
      }
    }

    return {
      revenue,
      pageViews,
      addToCart,
      removeFromCart,
      checkoutStarted,
      purchases,
    };
  }

  private async getHistoricalMetrics(storeId: string, startDate: Date, endDate: Date) {
    const metrics = await this.prisma.dailyMetrics.findMany({
      where: {
        storeId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    return metrics.reduce(
      (acc, m) => ({
        revenue: acc.revenue + Number(m.totalRevenue),
        pageViews: acc.pageViews + m.totalPageViews,
        addToCart: acc.addToCart + m.totalAddToCart,
        removeFromCart: acc.removeFromCart + m.totalRemoveFromCart,
        checkoutStarted: acc.checkoutStarted + m.totalCheckoutStarted,
        purchases: acc.purchases + m.totalPurchases,
      }),
      {
        revenue: 0,
        pageViews: 0,
        addToCart: 0,
        removeFromCart: 0,
        checkoutStarted: 0,
        purchases: 0,
      },
    );
  }

  async getTopProducts(storeId: string, fresh = false): Promise<TopProductsResponseDto> {
    const cacheKey = `top-products:${storeId}`;
    
    if (!fresh) {
      const cached = await this.redis.getJSON<TopProductsResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    if (this.useMockData) {
      const result: TopProductsResponseDto = { 
        products: MOCK_PRODUCTS.sort((a, b) => b.revenue - a.revenue).slice(0, 10)
      };
      await this.redis.setJSON(cacheKey, result, 300);
      return result;
    }

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Aggregate from raw events for purchases in last 30 days
      const purchaseEvents = await this.prisma.event.findMany({
        where: {
          storeId,
          eventType: 'purchase',
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
      });

      const productMap = new Map<string, { revenue: number; quantity: number; name: string }>();

      for (const event of purchaseEvents) {
        if (event.data && typeof event.data === 'object') {
          const data = event.data as any;
          const productId = data.product_id;
          const amount = data.amount ? parseFloat(data.amount) : 0;
          const productName = data.product_name || `Product ${productId}`;

          if (productId) {
            const existing = productMap.get(productId) || { revenue: 0, quantity: 0, name: productName };
            existing.revenue += amount;
            existing.quantity += 1;
            productMap.set(productId, existing);
          }
        }
      }

      const products = Array.from(productMap.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          revenue: Number(data.revenue.toFixed(2)),
          quantitySold: data.quantity,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const result: TopProductsResponseDto = { products };

      // Cache for 5 minutes
      await this.redis.setJSON(cacheKey, result, 300);

      return result;
    } catch (error) {
      console.log('Database error, falling back to mock data');
      this.useMockData = true;
      return this.getTopProducts(storeId);
    }
  }

  async getRecentActivity(storeId: string, fresh = false): Promise<RecentActivityResponseDto> {
    const cacheKey = `recent-activity:${storeId}`;
    
    if (!fresh) {
      const cached = await this.redis.getJSON<RecentActivityResponseDto>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    if (this.useMockData) {
      const result: RecentActivityResponseDto = { events: MOCK_EVENTS };
      await this.redis.setJSON(cacheKey, result, 60);
      return result;
    }

    try {
      const events = await this.prisma.event.findMany({
        where: { storeId },
        orderBy: { timestamp: 'desc' },
        take: 20,
      });

      const result: RecentActivityResponseDto = {
        events: events.map((e) => ({
          eventId: e.eventId,
          eventType: e.eventType,
          timestamp: e.timestamp.toISOString(),
          data: (e.data as Record<string, any>) || {},
        })),
      };

      // Cache for 1 minute (more frequent updates)
      await this.redis.setJSON(cacheKey, result, 60);

      return result;
    } catch (error) {
      console.log('Database error, falling back to mock data');
      this.useMockData = true;
      return this.getRecentActivity(storeId);
    }
  }

  async simulateEvent(storeId: string) {
    const eventTypes = ['page_view', 'add_to_cart', 'purchase'];
    const products = [
      { id: 'prod_1', name: 'Wireless Headphones', price: 79.99 },
      { id: 'prod_2', name: 'Smart Watch', price: 199.99 },
      { id: 'prod_3', name: 'Laptop Stand', price: 49.99 },
    ];
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    let data = null;
    if (eventType === 'purchase') {
      data = {
        product_id: product.id,
        product_name: product.name,
        amount: product.price,
        currency: 'USD',
      };
    } else if (eventType === 'add_to_cart') {
      data = {
        product_id: product.id,
        product_name: product.name,
      };
    }
    
    await this.prisma.event.create({
      data: {
        eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        storeId,
        eventType,
        timestamp: new Date(),
        data: data || undefined,
      },
    });
    
    // Clear cache to force fresh data
    await this.redis.del(`overview:${storeId}`);
    await this.redis.del(`top-products:${storeId}`);
    await this.redis.del(`recent-activity:${storeId}`);
    
    return { success: true, eventType, message: 'Event created and cache cleared' };
  }
}
