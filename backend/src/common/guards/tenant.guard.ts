import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

interface RequestWithUser extends Request {
  user: {
    storeId: string;
    userId: string;
  };
  storeId: string;
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.storeId) {
      throw new ForbiddenException('Store ID not found in token');
    }

    // Store the storeId in the request for later use
    request['storeId'] = user.storeId;
    
    return true;
  }
}
