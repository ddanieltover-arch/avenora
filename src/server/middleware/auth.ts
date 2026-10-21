/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Authentication & RBAC Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { defaultAuthService, UserRecord, UserRole } from '../services/auth.service.ts';
import { defaultAuditService } from '../services/audit.service.ts';

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
      sessionToken?: string;
      rawBody?: Buffer;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  // 1. Check Bearer Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fallback to HttpOnly cookie
  if (!token && req.cookies && req.cookies['avenora_session']) {
    token = req.cookies['avenora_session'];
  }

  if (!token) {
    res.status(401).json({
      type: 'https://avenora.com/errors/unauthorized',
      title: 'Authentication Required',
      status: 401,
      detail: 'You must provide a valid session token via Bearer header or session cookie.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const user = await defaultAuthService.validateSession(token);
  if (!user) {
    res.status(401).json({
      type: 'https://avenora.com/errors/invalid-session',
      title: 'Invalid or Expired Session',
      status: 401,
      detail: 'The provided session is invalid, expired, or has been revoked.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

/**
 * Enforces Role-Based Access Control (RBAC).
 */
export function requireRoles(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        type: 'https://avenora.com/errors/unauthorized',
        title: 'Authentication Required',
        status: 401,
        detail: 'User authentication required.',
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      defaultAuditService.logAction({
        action: 'ADMIN_ACCESS_DENIED',
        actorUserId: req.user.id,
        actorRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        resourceType: 'API_ENDPOINT',
        resourceId: req.originalUrl,
        reason: `Access denied. Role "${req.user.role}" does not have required permissions: [${roles.join(', ')}].`,
        correlationId: (req.headers['x-correlation-id'] as string) || undefined,
      });

      res.status(403).json({
        type: 'https://avenora.com/errors/access-denied',
        title: 'Forbidden / Insufficient Privileges',
        status: 403,
        detail: `Access denied. Role "${req.user.role}" does not have required permissions: [${roles.join(', ')}].`,
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
