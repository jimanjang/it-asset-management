import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleAuth(@Body() body: { id: string; email: string; name: string; picture: string }) {
    try {
      const user = await this.authService.validateGoogleUser(body);
      return this.authService.generateToken(user);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.split(' ')[1];
    const payload = await this.authService.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
    };
  }
}
