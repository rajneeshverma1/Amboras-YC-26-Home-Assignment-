# Store Analytics Dashboard

A real-time analytics dashboard for multi-tenant eCommerce stores. Built with Next.js, NestJS, PostgreSQL, and Redis.

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

## Architecture Decisions

### Data Aggregation Strategy

**Decision**: Hybrid approach combining pre-aggregated daily metrics with real-time computation for "today"

**Why**: 
- Pre-aggregated tables (`daily_metrics`) provide fast historical queries (~50ms)
- Real-time computation from raw events ensures "today" data is always fresh
- Redis caching (5-min TTL) reduces database load for repeated requests

**Trade-offs**:
- **Sacrificed**: Additional storage overhead for pre-aggregated tables (~30% more storage)
- **Sacrificed**: Slight complexity in maintaining aggregation logic
- **Gained**: Query performance improved from ~500ms to ~50ms for historical data
- **Gained**: "Today" metrics are real-time without waiting for batch jobs

### Real-time vs. Batch Processing

**Decision**: On-demand computation with caching (not true real-time streaming)

**Why**:
- Simpler architecture without WebSocket/Socket.io complexity
- 5-second polling on frontend provides near real-time feel for users
- Redis caching ensures fast repeated queries (<100ms)

**Trade-offs**:
- **Sacrificed**: Not true real-time (5-second delay max)
- **Sacrificed**: Higher database load than pure batch processing
- **Gained**: Much simpler implementation and deployment
- **Gained**: Good balance for 10,000 events/minute volume

### Frontend Data Fetching

**Decision**: Client-side fetching with React hooks, 5-second auto-refresh

**Why**:
- Simple implementation using useEffect + setInterval
- No need for complex state management (Redux/Zustand) for this use case
- Automatic token refresh on 401 errors
- Fresh data on initial load, cached data for auto-refresh

**Trade-offs**:
- **Sacrificed**: Not as efficient as server components for initial load
- **Sacrificed**: Slightly more client-side JavaScript
- **Gained**: Simple mental model, easy to debug
- **Gained**: Good enough for dashboard use case

### Performance Optimizations

1. **Database Indexes**: Composite indexes on `(store_id, timestamp)` and `(store_id, event_type)` for fast filtering
2. **Redis Caching**: 5-minute TTL for overview/top-products, 1-minute for recent activity
3. **Query Optimization**: Pre-aggregated historical data, only compute "today" from raw events
4. **Pagination**: Recent activity limited to 20 events to prevent large payloads
5. **Parallel Queries**: Frontend fetches all three endpoints simultaneously using Promise.all
6. **Cache Bypass**: `fresh=true` query parameter allows bypassing cache when needed

## Known Limitations

1. **No WebSocket Support**: Uses polling instead of true real-time updates (5-second delay)
2. **No Date Range Filtering**: Fixed to today/week/month only (custom ranges not implemented)
3. **No Live Visitor Tracking**: Would require session management and WebSocket connections
4. **Manual Aggregation**: Pre-aggregation runs on-demand (should be background job in production at scale)
5. **No Data Retention Policy**: Old events not automatically archived (would need cleanup jobs)
6. **Single Store Demo**: Seed data only creates one store (multi-tenant code ready but not demoed)
7. **No Rate Limiting**: API could be overwhelmed by excessive requests

## What I'd Improve With More Time

1. **Background Jobs**: Use BullMQ for scheduled aggregation instead of on-demand
2. **WebSocket Integration**: True real-time updates with Socket.io for live visitors
3. **Date Range Picker**: Custom date range filtering for flexible analytics
4. **Live Visitors**: Redis-based session tracking with real-time counter
5. **Database Partitioning**: Partition events table by date for better query performance
6. **Rate Limiting**: API throttling per store to prevent abuse
7. **Comprehensive Testing**: Unit and integration tests (currently minimal)
8. **Data Export**: CSV/Excel download functionality for reports
9. **Email Reports**: Scheduled analytics emails (daily/weekly summaries)
10. **Multi-store Support**: Better tenant management UI for users with multiple stores

## Time Spent

Approximately 4 hours

## License

MIT
