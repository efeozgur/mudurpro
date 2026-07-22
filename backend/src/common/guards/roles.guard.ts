import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

const clerkModuleByPath: Array<[string, string]> = [
  ['/cases', 'CASES'],
  ['/parties', 'PARTIES'],
  ['/services', 'SERVICES'],
  ['/fees', 'FEES'],
  ['/appeals', 'APPEALS'],
  ['/templates', 'TEMPLATES'],
  ['/dashboard', 'REPORTS'],
];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;
    if (requiredRoles.includes(user.role)) return true;
    if (user.role !== 'KATIP' || !requiredRoles.includes('MUDUR')) return false;

    const path = request.route?.path || request.url || '';
    const normalizedPath = `/${path.replace(/^\/+/, '').replace(/^api\/v\d+\//, '')}`;
    const module = clerkModuleByPath.find(([prefix]) => normalizedPath.startsWith(prefix))?.[1];
    return Boolean(module && user.permissions?.includes(module));
  }
}
