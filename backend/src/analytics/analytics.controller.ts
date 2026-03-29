import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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
  async getOverview(@Request() req: RequestWithUser): Promise<OverviewResponseDto> {
    return this.analyticsService.getOverview(req.user.storeId);
  }

  @Get('top-products')
  async getTopProducts(@Request() req: RequestWithUser): Promise<TopProductsResponseDto> {
    return this.analyticsService.getTopProducts(req.user.storeId);
  }

  @Get('recent-activity')
  async getRecentActivity(@Request() req: RequestWithUser): Promise<RecentActivityResponseDto> {
    return this.analyticsService.getRecentActivity(req.user.storeId);
  }
}
