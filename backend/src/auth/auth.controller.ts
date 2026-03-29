import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface LoginDto {
  storeId: string;
  userId: string;
}

interface LoginResponse {
  access_token: string;
  storeId: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    // In a real app, validate credentials here
    const payload = {
      storeId: loginDto.storeId,
      userId: loginDto.userId,
      sub: loginDto.userId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      storeId: loginDto.storeId,
    };
  }
}
