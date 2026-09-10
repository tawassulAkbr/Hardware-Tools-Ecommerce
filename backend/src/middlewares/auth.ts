import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenRevoked } from '../utils/security';

const JWT_SECRET = process.env.JWT_SECRET || 'toolkit_super_secret_key';

export type AppRole = 'ADMIN' | 'BUYER' | 'SALES_PERSON';

export interface AuthRequest extends Request {
  user?: { id: number; role: AppRole; jti?: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    if (isTokenRevoked(token)) return res.status(401).json({ error: 'Token has been revoked' });
    req.user = jwt.verify(token, JWT_SECRET) as { id: number; role: AppRole; jti?: string };
    return next();
  } catch {
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
