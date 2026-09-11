import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../index';
import { sendPasswordResetEmail } from '../utils/email';
import { AuthRequest } from '../middlewares/auth';
import { disableFallbackUser, revokeToken } from '../utils/security';
import { writeAudit } from '../utils/audit';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
  return secret;
};
const demoUsers = [
  { id: -1, email: 'admin@toolkit.com', password: 'Admin123!', name: 'ToolKit Admin', phone: '', address: '', role: 'ADMIN' as const, status: 'ACTIVE' },
  { id: -2, email: 'buyer@toolkit.com', password: 'Buyer123!', name: 'Demo Buyer', phone: '', address: '', role: 'BUYER' as const, status: 'ACTIVE' },
  { id: -3, email: 'sales@toolkit.com', password: 'Sales123!', name: 'ToolKit Sales', phone: '', address: '', role: 'SALES_PERSON' as const, status: 'ACTIVE' },
];
type LocalUser = { id: number; email: string; password: string; name: string; phone: string; address: string; role: 'BUYER' | 'SALES_PERSON'; status: string };
const localUsersPath = path.resolve(__dirname, '../../data/local-users.json');
const localUsers: LocalUser[] = (() => {
  try { return JSON.parse(fs.readFileSync(localUsersPath, 'utf8')) as LocalUser[]; } catch { return []; }
})();
const persistLocalUsers = () => {
  fs.mkdirSync(path.dirname(localUsersPath), { recursive: true });
  fs.writeFileSync(localUsersPath, JSON.stringify(localUsers, null, 2), 'utf8');
};
const persistGoogleFallback = (user: LocalUser) => {
  localUsers.push(user);
  try { persistLocalUsers(); } catch (error) { console.error('Could not persist local Google account; keeping it in memory.', error); }
};
const resetTokens = new Map<string, { email: string; expiresAt: number }>();
const isRealGoogleClientId = (clientId?: string) => Boolean(clientId && !/^your([_-]|$)/i.test(clientId));

export const passwordStrengthError = (password: unknown) => {
  const value = String(password || '');
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter.';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a special character.';
  return null;
};

export const googleConfig = (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  return res.json({ configured: isRealGoogleClientId(clientId), clientId: isRealGoogleClientId(clientId) ? clientId : null });
};

export const updateDemoPassword = (email: string, password: string) => {
  const user = [...demoUsers, ...localUsers].find((candidate) => candidate.email === email);
  if (user) { user.password = password; if (localUsers.includes(user as LocalUser)) persistLocalUsers(); }
};

const passwordMatches = async (user: { password: string }, password: string) => user.password.startsWith('$2') ? bcrypt.compare(password, user.password) : user.password === password;

const authResponse = (user: { id: number; email: string; name: string; phone?: string; address?: string; role: 'ADMIN' | 'BUYER' | 'SALES_PERSON'; status: string }) => ({
  user: { id: user.id, email: user.email, name: user.name, phone: user.phone || '', address: user.address || '', role: user.role, status: user.status },
  token: jwt.sign({ id: user.id, role: user.role, jti: crypto.randomUUID() }, getJwtSecret(), { expiresIn: '7d' }),
});

export { revokeToken };

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { password, name, phone, address } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email || !password || !name || !phone || !address) {
      return res.status(400).json({ error: 'Name, email, phone, address, and password are required' });
    }
    const passwordError = passwordStrengthError(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        address,
        password: hashedPassword,
        // Public registration must never be able to elevate an account.
        role: 'BUYER',
      },
    });

    return res.status(201).json(authResponse(user));
  } catch (error) {
    console.error(error);
    const { email, password, name, phone, address } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const passwordError = passwordStrengthError(password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    if (demoUsers.some((user) => user.email === normalizedEmail) || localUsers.some((user) => user.email === normalizedEmail)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const localUser = { id: -(localUsers.length + 4), email: normalizedEmail, password: await bcrypt.hash(String(password), 10), name: String(name), phone: String(phone), address: String(address), role: 'BUYER' as const, status: 'ACTIVE' };
    localUsers.push(localUser);
    persistLocalUsers();
    return res.status(201).json(authResponse(localUser));
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const password = String(req.body.password || '');
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.error('Database unavailable during login; checking demo account.', error);
      const fallbackUser = [...demoUsers, ...localUsers].find((candidate) => candidate.email === email);
      if (!fallbackUser || fallbackUser.status !== 'ACTIVE' || !(await passwordMatches(fallbackUser, password))) return res.status(503).json({ error: 'Database unavailable. Demo accounts and locally saved accounts are still available.' });
      return res.status(200).json(authResponse(fallbackUser));
    }

    if (!user) {
      const fallbackUser = [...demoUsers, ...localUsers].find((candidate) => candidate.email === email);
      if (fallbackUser && fallbackUser.status === 'ACTIVE' && await passwordMatches(fallbackUser, password)) return res.status(200).json(authResponse(fallbackUser));
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    return res.status(200).json(authResponse(user));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<any> => {
  const credential = String(req.body.credential || '');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!credential || !isRealGoogleClientId(clientId)) return res.status(503).json({ error: 'Google sign-in needs GOOGLE_CLIENT_ID configured on the backend.' });

  try {
    const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verification.ok) return res.status(401).json({ error: 'Google sign-in could not be verified.' });
    const profile = await verification.json() as { aud?: string; email?: string; email_verified?: string; name?: string };
    if (profile.aud !== clientId || profile.email_verified !== 'true' || !profile.email) return res.status(401).json({ error: 'Google sign-in could not be verified.' });

    const email = profile.email.toLowerCase();
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.json(authResponse(existing));
      const created = await prisma.user.create({ data: { email, name: profile.name || email.split('@')[0], password: crypto.randomBytes(32).toString('hex'), role: 'BUYER' } });
      return res.status(201).json(authResponse(created));
    } catch (databaseError) {
      console.error('Google account database unavailable; using local account.', databaseError);
      let localUser = localUsers.find((candidate) => candidate.email === email);
      if (!localUser) {
        localUser = { id: -(localUsers.length + 4), email, password: crypto.randomBytes(32).toString('hex'), name: profile.name || email.split('@')[0], phone: '', address: '', role: 'BUYER', status: 'ACTIVE' };
        persistGoogleFallback(localUser);
      }
      return res.status(200).json(authResponse(localUser));
    }
  } catch (error) {
    console.error('Google sign-in failed.', error);
    return res.status(502).json({ error: 'Google sign-in is temporarily unavailable.' });
  }
};

export const me = async (req: any, res: Response): Promise<any> => {
  if (req.user.id < 0) {
    const fallbackUser = [...demoUsers, ...localUsers].find((candidate) => candidate.id === req.user.id);
    return res.json({ user: fallbackUser ? { id: fallbackUser.id, email: fallbackUser.email, name: fallbackUser.name, phone: fallbackUser.phone || '', address: fallbackUser.address || '', role: fallbackUser.role, status: fallbackUser.status } : null });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, phone: true, address: true, role: true, status: true, createdAt: true },
  });
  return res.json({ user });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const address = String(req.body.address || '').trim();
  if (!name || !phone || !address) return res.status(400).json({ error: 'Name, phone, and address are required' });
  if (req.user!.id < 0) {
    const user = [...demoUsers, ...localUsers].find((candidate) => candidate.id === req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.name = name; user.phone = phone; user.address = address;
    await writeAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'PROFILE', entityId: String(req.user!.id) });
    return res.json({ user: { id: user.id, email: user.email, name: user.name, phone: user.phone, address: user.address, role: user.role, status: user.status } });
  }
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: { name, phone, address }, select: { id: true, email: true, name: true, phone: true, address: true, role: true, status: true } });
  await writeAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'PROFILE', entityId: String(req.user!.id) });
  return res.json({ user });
};

export const deleteProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  if (req.user!.id < 0) {
    const user = [...demoUsers, ...localUsers].find((candidate) => candidate.id === req.user!.id);
    if (user) user.status = 'DISABLED';
    disableFallbackUser(req.user!.id);
    return res.status(204).send();
  }
  await prisma.user.update({ where: { id: req.user!.id }, data: { status: 'DISABLED' } });
  return res.status(204).send();
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  let userExists = false;
  try {
    userExists = Boolean(await prisma.user.findUnique({ where: { email }, select: { email: true } }));
  } catch (error) {
    console.error('Password reset database lookup unavailable.', error);
    userExists = [...demoUsers, ...localUsers].some((user) => user.email === email);
  }
  if ([...demoUsers, ...localUsers].some((user) => user.email === email)) userExists = true;

  if (userExists) {
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { email, expiresAt: Date.now() + 30 * 60 * 1000 });
    void sendPasswordResetEmail(email, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`);
  }

  return res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  const token = String(req.params.token || '');
  const password = String(req.body.password || '');
  const reset = resetTokens.get(token);
  if (!reset || reset.expiresAt < Date.now()) {
    resetTokens.delete(token);
    return res.status(400).json({ error: 'This reset link is invalid or expired.' });
  }
  const passwordError = passwordStrengthError(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const fallbackUser = [...demoUsers, ...localUsers].find((user) => user.email === reset.email);
  if (fallbackUser) {
    updateDemoPassword(reset.email, password);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email: reset.email }, data: { password: hashedPassword } });
  }
  resetTokens.delete(token);
  return res.json({ message: 'Password updated. You can now sign in.' });
};
