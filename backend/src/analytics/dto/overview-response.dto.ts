export class RevenueMetricsDto {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export class EventMetricsDto {
  pageViews: number;
  addToCart: number;
  removeFromCart: number;
  checkoutStarted: number;
  purchases: number;
}

export class OverviewResponseDto {
  revenue: RevenueMetricsDto;
  events: EventMetricsDto;
  conversionRate: number;
}
