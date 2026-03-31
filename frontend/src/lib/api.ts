const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RevenueMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface EventMetrics {
  pageViews: number;
  addToCart: number;
  removeFromCart: number;
  checkoutStarted: number;
  purchases: number;
}

export interface OverviewData {
  revenue: RevenueMetrics;
  events: EventMetrics;
  conversionRate: number;
}

export interface ProductMetric {
  productId: string;
  productName: string;
  revenue: number;
  quantitySold: number;
}

export interface TopProductsData {
  products: ProductMetric[];
}

export interface EventActivity {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface RecentActivityData {
  events: EventActivity[];
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async fetch<T>(endpoint: string, fresh = false): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add cache-busting query parameter for fresh data
    const url = fresh 
      ? `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}fresh=true&t=${Date.now()}`
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers,
      cache: fresh ? 'no-store' : 'default',
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async login(storeId: string, userId: string): Promise<{ access_token: string; storeId: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storeId, userId }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async getOverview(fresh = false): Promise<OverviewData> {
    return this.fetch<OverviewData>('/api/v1/analytics/overview', fresh);
  }

  async getTopProducts(fresh = false): Promise<TopProductsData> {
    return this.fetch<TopProductsData>('/api/v1/analytics/top-products', fresh);
  }

  async getRecentActivity(fresh = false): Promise<RecentActivityData> {
    return this.fetch<RecentActivityData>('/api/v1/analytics/recent-activity', fresh);
  }

  async simulateEvent(): Promise<{ success: boolean; eventType: string; message: string }> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/simulate-event`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
