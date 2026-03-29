# Store Analytics Dashboard

A real-time analytics dashboard for multi-tenant eCommerce stores. Built with Next.js, NestJS, PostgreSQL, and Redis.

## Features

- **Real-time Metrics**: Revenue tracking (today, this week, this month)
- **Conversion Analytics**: Track purchases vs page views
- **Top Products**: Best-performing products by revenue
- **Recent Activity**: Live event stream
- **Multi-tenant Security**: JWT-based authentication with store isolation
- **Performance Optimized**: Redis caching for sub-500ms API responses

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT

## Architecture Decisions

### Data Aggregation Strategy

**Decision**: Hybrid approach combining pre-aggregated daily metrics with real-time computation for "today"

**Why**:
- Pre-aggregated tables (`daily_metrics`) provide fast historical queries
- Real-time computation from raw events ensures "today" data is fresh
- Redis caching (5-min TTL) reduces database load for repeated requests

**Trade-offs**:
- Additional storage overhead for pre-aggregated tables
- Slight complexity in maintaining aggregation logic
- "Today" metrics computed on-demand (acceptable for this scale)

### Real-time vs. Batch Processing

**Decision**: On-demand computation with caching (not true real-time streaming)

**Why**:
- Simpler architecture without WebSocket complexity
- 30-second polling on frontend provides near real-time feel
- Redis caching ensures fast repeated queries

**Trade-offs**:
- Not true real-time (30-second delay max)
- Higher database load than pure batch processing
- Good balance for 10,000 events/minute volume

### Frontend Data Fetching

**Decision**: Client-side fetching with React hooks, 30-second auto-refresh

**Why**:
- Simple implementation using useEffect + setInterval
- No need for complex state management (Redux/Zustand)
- Automatic token refresh on 401 errors

**Trade-offs**:
- Not as efficient as server components for initial load
- Good enough for dashboard use case

### Performance Optimizations

1. **Database Indexes**: Composite indexes on `(store_id, timestamp)` and `(store_id, event_type)`
2. **Redis Caching**: 5-minute TTL for overview/top-products, 1-minute for recent activity
3. **Query Optimization**: Pre-aggregated historical data, only compute "today" from raw events
4. **Pagination**: Recent activity limited to 20 events
5. **Parallel Queries**: Frontend fetches all three endpoints simultaneously

## Known Limitations

1. **No WebSocket Support**: Uses polling instead of true real-time updates
2. **No Date Range Filtering**: Fixed to today/week/month only
3. **No Live Visitor Tracking**: Would require session management
4. **Manual Aggregation**: Pre-aggregation runs on-demand (should be background job in production)
5. **No Data Retention Policy**: Old events not automatically archived
6. **Single Store Demo**: Seed data only creates one store

## What I'd Improve With More Time

1. **Background Jobs**: Use BullMQ for scheduled aggregation
2. **WebSocket Integration**: True real-time updates with Socket.io
3. **Date Range Picker**: Custom date range filtering
4. **Live Visitors**: Redis-based session tracking
5. **Database Partitioning**: Partition events table by date
6. **Rate Limiting**: API throttling per store
7. **Comprehensive Testing**: Unit and integration tests
8. **Data Export**: CSV/Excel download functionality
9. **Email Reports**: Scheduled analytics emails
10. **Multi-store Support**: Better tenant management UI

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed test data
npx prisma db seed

# Start development server
npm run start:dev
```

The backend will run on http://localhost:3001

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port

# Start development server
npm run dev
```

The frontend will run on http://localhost:3000

### Default Login

- Store ID: `store_456`
- User ID: `user_123`

## API Endpoints

### Authentication
- `POST /auth/login` - Get JWT token

### Analytics (all require Bearer token)
- `GET /api/v1/analytics/overview` - Revenue, events, conversion rate
- `GET /api/v1/analytics/top-products` - Top 10 products by revenue
- `GET /api/v1/analytics/recent-activity` - Last 20 events

## Project Structure

```
repo/
├── backend/
│   ├── src/
│   │   ├── analytics/        # Analytics module
│   │   ├── auth/             # Authentication
│   │   ├── common/           # Guards, filters
│   │   ├── prisma/           # Database service
│   │   └── redis/            # Redis service
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Test data
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   │   ├── dashboard/    # Dashboard widgets
│   │   │   └── ui/           # shadcn components
│   │   └── lib/              # API client, utils
│   └── .env.example
└── README.md
```

## Time Spent

Approximately 3.5 hours

## License

MIT
