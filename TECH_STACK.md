# Tech Stack Documentation

## Project Overview
Amboras Analytics Dashboard - A full-stack eCommerce analytics platform with real-time data visualization.

---

## Frontend

### Core Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.1 | React framework with App Router |
| **React** | 19.2.4 | UI library |
| **TypeScript** | 5.9.3 | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |

### UI Components
| Technology | Purpose |
|------------|---------|
| **shadcn/ui** | Pre-built accessible components |
| **Base UI** | Headless UI primitives |
| **Lucide React** | Icon library |
| **Recharts** | Data visualization charts |

### Key Features
- Server-side rendering (SSR) with Next.js App Router
- Responsive dashboard layout
- Real-time metrics cards
- Interactive charts (Revenue, Events)
- Auto-refresh every 5 seconds

---

## Backend

### Core Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.x | Node.js framework |
| **TypeScript** | 5.7.3 | Type-safe development |
| **Prisma** | 7.6.0 | Database ORM |
| **PostgreSQL** | 14+ | Primary database |
| **Redis** | 7+ | Caching layer |

### Authentication & Security
| Technology | Purpose |
|------------|---------|
| **Passport.js** | Authentication middleware |
| **JWT** | JSON Web Tokens for auth |
| **bcrypt** | Password hashing |

### Key Features
- RESTful API architecture
- Multi-tenant security (store isolation)
- JWT-based authentication
- Hybrid data aggregation (real-time + cached)
- Cache bypass support for fresh data

---

## Automatic Refresh Architecture

### How It Works

```
┌─────────────────┐     5 seconds      ┌─────────────────┐
│   Frontend      │ ◄────────────────► │   Backend API   │
│  (Next.js)      │   Auto-polling     │   (NestJS)      │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  1. fetchData(false) - cached        │
         │  2. Uses Redis cache                 │
         │                                      │
         │  On Page Refresh:                    │
         │  1. fetchData(true) - fresh          │
         │  2. Bypasses Redis cache             │
         │  3. Queries PostgreSQL directly      │
```

### Implementation Details

#### Frontend (page.tsx)
```typescript
// Auto-refresh every 5 seconds (uses cache)
const interval = setInterval(() => fetchData(false), 5000);

// On initial load - fetch fresh data
fetchData(true);
```

#### API Client (api.ts)
```typescript
// Cache-busting for fresh data
const url = fresh 
  ? `${API_BASE_URL}${endpoint}?fresh=true&t=${Date.now()}`
  : `${API_BASE_URL}${endpoint}`;

// No-store cache header for fresh requests
fetch(url, { cache: fresh ? 'no-store' : 'default' })
```

#### Backend Controller (analytics.controller.ts)
```typescript
@Get('overview')
async getOverview(@Request() req, @Query('fresh') fresh?: string) {
  return this.analyticsService.getOverview(req.user.storeId, fresh === 'true');
}
```

#### Backend Service (analytics.service.ts)
```typescript
async getOverview(storeId: string, fresh = false): Promise<OverviewResponseDto> {
  const cacheKey = `overview:${storeId}`;
  
  // Skip cache if fresh=true
  if (!fresh) {
    const cached = await this.redis.getJSON<OverviewResponseDto>(cacheKey);
    if (cached) return cached;
  }
  
  // Fetch from database
  const result = await this.calculateMetrics(storeId);
  
  // Store in cache for 5 minutes
  await this.redis.setJSON(cacheKey, result, 300);
  
  return result;
}
```

### Data Flow

1. **Normal Auto-Refresh (5s)**
   - Frontend calls API with `fresh=false`
   - Backend checks Redis cache first
   - Returns cached data (fast)
   - Reduces database load

2. **Page Refresh/Manual Reload**
   - Frontend calls API with `fresh=true`
   - Backend skips Redis cache
   - Queries PostgreSQL directly
   - Updates Redis with fresh data
   - Returns latest data to user

---

## Database Schema

### PostgreSQL Tables
- **events** - Store user actions (page_view, purchase, etc.)
- **daily_metrics** - Pre-aggregated daily statistics
- **product_metrics** - Product performance data

### Redis Cache Keys
- `overview:{storeId}` - Dashboard overview data (TTL: 5 min)
- `top-products:{storeId}` - Top products list (TTL: 5 min)
- `recent-activity:{storeId}` - Recent events (TTL: 1 min)

---

## Development Environment

### Requirements
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Startup Commands
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

### Default URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Key Features Implemented

1. **Real-time Dashboard** - Auto-refresh every 5 seconds
2. **Cache Bypass** - Fresh data on page reload
3. **Multi-tenant** - Store isolation with JWT auth
4. **Hybrid Aggregation** - Real-time + cached metrics
5. **Responsive UI** - Works on desktop and mobile
