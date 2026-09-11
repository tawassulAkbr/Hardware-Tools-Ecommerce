import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isFallbackUserDisabled, isTokenRevoked } from '../utils/security';
import { prisma } from '../index';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
  return secret;
};

export type AppRole = 'ADMIN' | 'BUYER' | 'SALES_PERSON';

export interface AuthRequest extends Request {
  user?: { id: number; role: AppRole; jti?: string };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    if (isTokenRevoked(token)) return res.status(401).json({ error: 'Token has been revoked' });
    req.user = jwt.verify(token, getJwtSecret()) as { id: number; role: AppRole; jti?: string };
    if (req.user.id < 0 && isFallbackUserDisabled(req.user.id)) return res.status(403).json({ error: 'Account is not active' });
    if (req.user.id >= 0) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true, status: true } });
      if (!user || user.status !== 'ACTIVE') return res.status(403).json({ error: 'Account is not active' });
      // Role changes take effect immediately instead of waiting for the old JWT to expire.
      req.user.role = user.role as AppRole;
    }
    return next();
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWT_SECRET')) return res.status(500).json({ error: 'Authentication is not configured securely' });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: Array<AppRole>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return next();
  };
};
