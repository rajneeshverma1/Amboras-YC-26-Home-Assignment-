/**
 * Dashboard Page - Main analytics dashboard for store owners
 * 
 * UX DECISIONS:
 * 1. Auto-refresh every 5 seconds: Users see near real-time data without manual refresh
 *    Trade-off: Slight battery/network usage vs. manual refresh friction
 * 
 * 2. Skeleton loaders during loading: Better perceived performance than blank screen
 *    Why: Users see content structure immediately while data loads
 * 
 * 3. Fresh data on initial load: When user opens dashboard, they see latest data
 *    Why: First impression matters - stale data on first view is confusing
 * 
 * 4. Cached data for auto-refresh: Subsequent updates use cache for performance
 *    Why: Balance between freshness and server load
 * 
 * 5. "Add Event & Refresh" button: For demo purposes - lets users see data change
 *    Why: Makes the dashboard interactive and demonstrates real-time capabilities
 * 
 * 6. Error state with alert: Clear feedback when something goes wrong
 *    Why: Users should know if data is stale or unavailable
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/dashboard/metric-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { EventsChart } from '@/components/dashboard/events-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, OverviewData, TopProductsData, RecentActivityData } from '@/lib/api';
import { DollarSign, ShoppingCart, Users, TrendingUp, LogOut, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = apiClient.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch fresh data on initial load/refresh
    fetchData(true);
    
    // Auto-refresh every 5 seconds (uses cache for better performance)
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchData = async (fresh = false) => {
    try {
      setLoading(true);
      const [overviewData, productsData, activityData] = await Promise.all([
        apiClient.getOverview(fresh),
        apiClient.getTopProducts(fresh),
        apiClient.getRecentActivity(fresh),
      ]);
      setOverview(overviewData);
      setTopProducts(productsData);
      setRecentActivity(activityData);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiClient.clearToken();
    router.push('/login');
  };

  const handleSimulateEvent = async () => {
    try {
      setLoading(true);
      // First, simulate a new event
      await apiClient.simulateEvent();
      // Then fetch fresh data
      await fetchData(true);
    } catch (err) {
      setError('Failed to simulate event');
    }
  };

  // Format currency with locale support
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Analytics</h1>
              <p className="text-sm text-gray-500">Real-time insights into your business</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSimulateEvent}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Add Event & Refresh
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Today's Revenue"
            value={overview ? formatCurrency(overview.revenue.today) : '$0.00'}
            subtitle="Updated in real-time"
            icon={<DollarSign className="w-5 h-5" />}
            loading={loading}
          />
          <MetricCard
            title="This Week"
            value={overview ? formatCurrency(overview.revenue.thisWeek) : '$0.00'}
            subtitle="7-day total"
            icon={<TrendingUp className="w-5 h-5" />}
            loading={loading}
          />
          <MetricCard
            title="This Month"
            value={overview ? formatCurrency(overview.revenue.thisMonth) : '$0.00'}
            subtitle="30-day total"
            icon={<DollarSign className="w-5 h-5" />}
            loading={loading}
          />
          <MetricCard
            title="Conversion Rate"
            value={overview ? `${overview.conversionRate}%` : '0%'}
            subtitle="Purchases / Page Views"
            icon={<Users className="w-5 h-5" />}
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart
            data={overview?.revenue || { today: 0, thisWeek: 0, thisMonth: 0 }}
            loading={loading}
          />
          <EventsChart
            data={overview?.events || { pageViews: 0, addToCart: 0, removeFromCart: 0, checkoutStarted: 0, purchases: 0 }}
            loading={loading}
          />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProducts
            products={topProducts?.products || []}
            loading={loading}
          />
          <RecentActivity
            events={recentActivity?.events || []}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
