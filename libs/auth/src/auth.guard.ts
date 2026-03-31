import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization Header');
    }

    const token = authHeader.split(' ')[1];
    // In a production app, we would use @nestjs/jwt and verify the token properly.
    // For this example, we'll assume a shared secret for simple verification.
    const secret = this.configService.get<string>('JWT_SECRET', 'super-secret');
    
    if (token !== secret) {
      throw new UnauthorizedException('Invalid Token');
    }

    // Role detection logic (Mocked for now)
    request.user = { id: 'admin-id', roles: ['ADMIN', 'DEVOPS'] };
    return true;
  }
}
