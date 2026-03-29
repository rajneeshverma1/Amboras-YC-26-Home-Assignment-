'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EventActivity } from '@/lib/api';

interface RecentActivityProps {
  events: EventActivity[];
  loading?: boolean;
}

const eventTypeLabels: Record<string, string> = {
  page_view: 'Page View',
  add_to_cart: 'Add to Cart',
  remove_from_cart: 'Remove from Cart',
  checkout_started: 'Checkout Started',
  purchase: 'Purchase',
};

const eventTypeColors: Record<string, string> = {
  page_view: 'bg-blue-100 text-blue-800',
  add_to_cart: 'bg-green-100 text-green-800',
  remove_from_cart: 'bg-red-100 text-red-800',
  checkout_started: 'bg-yellow-100 text-yellow-800',
  purchase: 'bg-purple-100 text-purple-800',
};

export function RecentActivity({ events, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.eventId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={eventTypeColors[event.eventType] || 'bg-gray-100'}
                >
                  {eventTypeLabels[event.eventType] || event.eventType}
                </Badge>
                {event.data?.product_name && (
                  <span className="text-sm text-gray-600 truncate max-w-[150px]">
                    {event.data.product_name}
                  </span>
                )}
                {event.data?.amount && (
                  <span className="text-sm font-medium text-green-600">
                    ${event.data.amount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {formatTime(event.timestamp)}
              </span>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
