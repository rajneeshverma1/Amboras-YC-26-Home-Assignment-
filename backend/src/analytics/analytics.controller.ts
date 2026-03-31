import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { OverviewResponseDto } from './dto/overview-response.dto';
import { TopProductsResponseDto } from './dto/top-products-response.dto';
import { RecentActivityResponseDto } from './dto/recent-activity-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

interface RequestWithUser extends Request {
  user: {
    storeId: string;
    userId: string;
  };
}

@Controller('api/v1/analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Request() req: RequestWithUser, @Query('fresh') fresh?: string): Promise<OverviewResponseDto> {
    return this.analyticsService.getOverview(req.user.storeId, fresh === 'true');
  }

  @Get('top-products')
  async getTopProducts(@Request() req: RequestWithUser, @Query('fresh') fresh?: string): Promise<TopProductsResponseDto> {
    return this.analyticsService.getTopProducts(req.user.storeId, fresh === 'true');
  }

  @Get('recent-activity')
  async getRecentActivity(@Request() req: RequestWithUser, @Query('fresh') fresh?: string): Promise<RecentActivityResponseDto> {
    return this.analyticsService.getRecentActivity(req.user.storeId, fresh === 'true');
  }

  @Post('simulate-event')
  async simulateEvent(@Request() req: RequestWithUser) {
    return this.analyticsService.simulateEvent(req.user.storeId);
  }
}
