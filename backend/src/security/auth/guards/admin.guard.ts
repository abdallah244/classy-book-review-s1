import { Injectable } from '@nestjs/common';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists and has admin role
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const adminRoles = ['admin', 'super_admin'];
    const hasAdminRole = user.roles?.some((role: string) =>
      adminRoles.includes(role),
    );

    if (!hasAdminRole) {
      throw new ForbiddenException('Access denied. Admin role required.');
    }

    return true;
  }
}
