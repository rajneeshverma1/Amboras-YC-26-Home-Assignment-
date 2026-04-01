# Video Walkthrough Script (15 Minutes)

---

## PART 1: DEMO (5 minutes)

### Opening (30 seconds)

**[Start with your face on camera, then transition to screen]**

"Hey everyone, I'm [Your Name], and today I'm going to walk you through Amboras — a real-time analytics dashboard I built for eCommerce stores. Think of it as a tool that helps store owners understand what's happening in their business right now — how much they're selling, how customers are behaving, and which products are performing best.

Let me show you how it works."

**[Transition to browser — localhost:3000]**

---

### Login & Security (1 minute)

**[Show login page]**

"First things first — let's log in. Now, this isn't just a simple login. This is a multi-tenant system, which means every store has completely isolated data. When I log in with store ID 'store_456', the backend validates my JWT token and ensures I can ONLY see data for this specific store. Even if there are thousands of stores in the database, I can't accidentally see someone else's data."

**[Type store_456, click login]**

"The authentication happens through JWT tokens — the backend verifies the token on every request and extracts the store ID from it. This store ID then filters every single database query."

---

### Dashboard Overview (2 minutes)

**[Dashboard loads — pause for a moment to let it sink in]**

"And here's the dashboard. Everything a store owner needs is right here on one screen.

**[Point to metric cards]**

At the top, we have the key numbers — today's revenue, this week's revenue, and this month's revenue. These are the numbers business owners care about most, so they get prime placement.

**[Scroll down slightly]**

Below that, we have event metrics — page views, add to cart events, checkouts started, and actual purchases. These tell the story of the customer journey.

**[Point to conversion rate]**

And this is the conversion rate — essentially, what percentage of visitors actually buy something. This is a critical metric for any eCommerce business.

**[Move to charts]**

Over here, we have visual charts showing revenue trends and event patterns over time. Visual data makes it easier to spot trends and anomalies.

**[Scroll to tables]**

Then we have top products — ranked by revenue — and a live feed of recent activity. This recent activity stream shows individual events as they happen, almost like a live log."

---

### Real-Time Features (1.5 minutes)

**[Look at the screen, then back to camera]**

"Now, here's where it gets interesting. Notice that the dashboard automatically refreshes every 5 seconds. But let me show you something more impressive.

**[Hover over "Add Event & Refresh" button]**

This button simulates a real-world scenario. When I click it, it creates a brand new purchase event in the database — just like a real customer making a purchase. Watch what happens to the numbers.

**[Click button — wait for loading, then point]**

See that? The revenue number just increased. The event count changed. The recent activity list updated with the new event. This isn't just refreshing cached data — this is fresh data from the database, computed in real-time.

**[Click again]**

Let me do it once more. The data actually changes because we're creating real events in the database, clearing the cache, and fetching fresh results. This demonstrates that our real-time pipeline is working end-to-end."

---

## TRANSITION (15 seconds)

**[Switch to code editor]**

"Okay, so that's what the user sees. Now let me show you how it's built under the hood."

---

## PART 2: CODE WALKTHROUGH (7 minutes)

### Architecture Philosophy (1 minute)

**[Show README.md — Architecture Decisions section]**

"Before diving into code, let me explain the core philosophy behind this system. I had to make a key decision: how do we balance performance with data freshness?

**[Point to text]**

I chose what's called a 'hybrid aggregation' approach. Here's the insight: historical data — yesterday, last week, last month — that data never changes. It's static. So why compute it every time someone loads the dashboard? Instead, I pre-aggregate it and store it.

But today's data — that IS changing. Customers are buying right now. So for today's data, we compute it in real-time from raw events.

This gives us the best of both worlds: fast queries for historical data, fresh data for today."

---

### Backend Aggregation Logic (3 minutes)

**[Open analytics.service.ts — scroll to the class documentation]**

"Let me show you the heart of the system — the AnalyticsService. I've documented the architecture decisions right in the code, which helps future maintainers understand why things are done this way.

**[Scroll to getOverview method]**

This is the getOverview method. Let me walk you through the logic step by step.

**[Point to Step 1]**

Step 1: Check Redis cache. If we have cached data and the user hasn't asked for fresh data, we return it immediately. This takes us from about 500 milliseconds down to 50 milliseconds — a 10x improvement.

**[Point to Step 2]**

Step 2: If the user passes 'fresh=true', we skip the cache. This is what happens when you click that 'Add Event' button — you want to see the latest data, not cached data.

**[Point to Step 3-4]**

Steps 3 and 4: We calculate our date ranges — today, week start, month start. Then we fetch metrics from two different sources. Today's metrics come from raw events — we count them in real-time. But historical metrics come from pre-aggregated data. This is that hybrid approach I mentioned.

**[Point to Step 5]**

Step 5: We combine them. We add today's real-time numbers to the historical pre-aggregated numbers. This gives us the complete picture.

**[Point to Step 6]**

Step 6: Calculate conversion rate. But notice this — we handle the edge case where there might be zero page views. We can't divide by zero, so we return 0% in that case. This is the kind of defensive programming that prevents crashes in production.

**[Scroll down slightly]**

Also notice that we handle Redis failures gracefully. If Redis is down, we log a warning and continue with database queries. The system stays up, just a bit slower."

---

### Frontend UX Decisions (2 minutes)

**[Switch to page.tsx]**

"Now let's look at the frontend. I've documented UX decisions directly in the code — this is something I believe in strongly. Code should tell you not just WHAT it does, but WHY.

**[Point to UX decisions comment]**

Here are the key decisions:

One: Auto-refresh every 5 seconds. This gives users that real-time feel without the complexity of WebSockets.

Two: Skeleton loaders during loading. This is about perceived performance — showing a skeleton structure is better than a blank screen or a spinner. Users feel like something is happening.

Three: Fresh data on initial load. When someone opens the dashboard for the first time, they should see the latest data. First impressions matter.

Four: Cached data for auto-refresh. After the initial load, we use cached data to reduce server load. It's a balance.

**[Scroll to fetchData function]**

Here's the fetchData function. See how it accepts a 'fresh' parameter? On initial load, we pass true. On auto-refresh, we pass false. This simple boolean controls our entire caching strategy.

**[Scroll to handleSimulateEvent]**

And this is the function behind that 'Add Event' button. It calls the backend to create a random event, then fetches fresh data. That's how the demo works."

---

### Security Implementation (1 minute)

**[Switch to tenant.guard.ts]**

"I want to highlight one more thing — security. This is the TenantGuard. It might look simple, but it's crucial.

**[Point to code]**

It extracts the storeId from the JWT token. If there's no storeId, it rejects the request. If there is, it attaches the storeId to the request object.

Then, in every database query throughout the application, we include 'where: { storeId }'. This means even if somehow a malicious request got through, the database would only return data for that specific store.

This is defense in depth — multiple layers of security."

---

## TRANSITION (15 seconds)

**[Close code editor, return to dashboard or face camera]**

"So that's how it's built. Before I wrap up, let me share some reflections on this project."

---

## PART 3: REFLECTION (2.5 minutes)

### What Was Challenging?

**[Speak directly to camera]**

"The most challenging decision was choosing between WebSockets and polling for real-time updates.

WebSockets would give us true real-time — the moment a purchase happens, the dashboard updates. But it adds significant complexity. You need a Socket.io server, connection management, reconnection logic for dropped connections, and horizontal scaling becomes harder.

I chose polling with 5-second intervals because for this use case, it's good enough. Store owners don't need millisecond-level updates. Five seconds feels real-time enough, and the implementation is dramatically simpler. It's a classic engineering trade-off — simplicity versus perfection.

Another challenge was the hybrid aggregation logic itself. Getting the date math right — making sure we don't double-count events at day boundaries or miss events during timezone transitions — that required careful testing."

---

### What Would I Do Differently?

**[Continue to camera]**

"If I had more time, there are three things I'd add:

First, background job processing. Right now, aggregation happens on-demand. At scale — say, millions of events per day — that would overwhelm the database. I'd use BullMQ to schedule aggregation jobs in the background.

Second, custom date range filtering. Right now, users are limited to today, this week, this month. Business owners often want to compare specific periods — like Black Friday this year versus last year.

Third, WebSocket integration specifically for live visitor counts. That's one metric where seconds actually matter — knowing you have 50 people on your site RIGHT NOW creates urgency. For that specific feature, WebSockets would be worth the complexity.

---

### Closing

**[Smile]**

"Overall, I'm proud of the balance this project strikes. It's maintainable — the code is well-documented and follows consistent patterns. It's performant — Redis caching and pre-aggregation give us sub-100ms response times. And it's robust — we've handled edge cases like division by zero, empty databases, and Redis failures.

Thanks for watching! I'd be happy to answer any questions."

**[End recording]**

---

## QUICK REFERENCE

| Time | Section | What to Show | Key Message |
|------|---------|--------------|-------------|
| 0:00 | Intro | Face → Dashboard | Project introduction |
| 0:30 | Login | Login page | Multi-tenant security |
| 1:30 | Dashboard | Full dashboard | All metrics explained |
| 3:30 | Real-time | Dashboard + button | Data actually changes |
| 5:00 | Architecture | README.md | Hybrid aggregation philosophy |
| 6:00 | Backend Code | analytics.service.ts | Step-by-step logic |
| 9:00 | Frontend Code | page.tsx | UX decisions |
| 11:00 | Security | tenant.guard.ts | Defense in depth |
| 12:00 | Reflection | Face camera | Challenges & learnings |
| 14:30 | Closing | Face camera | Summary & thanks |

---

## DELIVERY TIPS

1. **Speak like you're explaining to a colleague** — not too formal, not too casual
2. **Pause after key points** — let important concepts sink in
3. **Use "we" and "our"** — creates connection with viewer
4. **Show enthusiasm** — you built this, be proud!
5. **It's okay to glance at notes** — better than forgetting key points
6. **If you make a mistake, keep going** — natural and human

Good luck! 🚀
