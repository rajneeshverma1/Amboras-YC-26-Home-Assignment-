export class EventActivityDto {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
}

export class RecentActivityResponseDto {
  events: EventActivityDto[];
}
