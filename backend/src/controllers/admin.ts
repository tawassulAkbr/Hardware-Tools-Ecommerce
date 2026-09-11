import { Request, Response } from 'express';
import { prisma } from '../index';
import { fallbackProducts } from '../data/catalog';
import { demoOrders } from './order';
import { AuthRequest } from '../middlewares/auth';
import { writeAudit } from '../utils/audit';
import bcrypt from 'bcrypt';
import { disableFallbackUser } from '../utils/security';
import { passwordStrengthError } from './auth';

export const dashboard = async (_req: Request, res: Response) => {
  let totalUsers: number;
  let totalProducts: number;
  let totalOrders: number;
  let orders: any[];
  let lowStockProducts: any[];
  let recentOrders: any[];
  try {
    [totalUsers, totalProducts, totalOrders, orders, lowStockProducts, recentOrders] = await Promise.all([
      prisma.user.count(), prisma.product.count(), prisma.order.count(), prisma.order.findMany(),
      prisma.product.findMany({ where: { stock: { lte: 5 } }, orderBy: { stock: 'asc' }, take: 8 }),
      prisma.order.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 6 }),
    ]);
  } catch (error) {
    console.error('Admin database unavailable; serving demo dashboard.', error);
    totalUsers = 2;
    totalProducts = fallbackProducts.length;
    totalOrders = demoOrders.length;
    orders = demoOrders;
    lowStockProducts = [];
    recentOrders = demoOrders.slice(0, 6);
  }

  const totalSales = orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0);
  const byPayment = orders.reduce((acc: Record<string, number>, o) => {
    if (o.status !== 'CANCELLED') acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.totalAmount;
    return acc;
  }, {});

  res.json({ totalUsers, totalProducts, totalOrders, totalSales, lowStockProducts, recentOrders, byPayment });
};

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (error) {
    console.error('User database unavailable; serving demo users.', error);
    return res.json([
      { id: -1, email: 'admin@toolkit.com', name: 'ToolKit Admin', role: 'ADMIN', status: 'ACTIVE' },
      { id: -2, email: 'buyer@toolkit.com', name: 'Demo Buyer', role: 'BUYER', status: 'ACTIVE' },
      { id: -3, email: 'sales@toolkit.com', name: 'ToolKit Sales', role: 'SALES_PERSON', status: 'ACTIVE' },
    ]);
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim();
  const password = String(req.body.password || '');
  const role = req.body.role || 'BUYER';
  const phone = String(req.body.phone || '').trim();
  const address = String(req.body.address || '').trim();
  const passwordError = passwordStrengthError(password);
  if (!/^\S+@\S+\.\S+$/.test(email) || !name || passwordError || !['ADMIN', 'BUYER', 'SALES_PERSON'].includes(role)) {
    return res.status(400).json({ error: passwordError || 'Valid name, email, and role are required' });
  }
  try {
    const user = await prisma.user.create({
      data: { email, name, phone: phone || null, address: address || null, password: await bcrypt.hash(password, 12), role },
      select: { id: true, email: true, name: true, phone: true, address: true, role: true, status: true, createdAt: true },
    });
    await writeAudit({ userId: req.user?.id, action: 'CREATE', entity: 'USER', entityId: String(user.id), metadata: { role } });
    return res.status(201).json(user);
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'Unable to create user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { role, status } = req.body;
  if (role && !['ADMIN', 'BUYER', 'SALES_PERSON'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (status && !['ACTIVE', 'DISABLED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (Number(req.params.id) === req.user?.id && (role === 'BUYER' || status === 'DISABLED')) {
    return res.status(400).json({ error: 'You cannot remove your own administrator access' });
  }
  if (Number(req.params.id) < 0) {
    if (status === 'DISABLED') disableFallbackUser(Number(req.params.id));
    return res.json({ id: Number(req.params.id), role, status });
  }
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { ...(role ? { role } : {}), ...(status ? { status } : {}) },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  await writeAudit({ userId: req.user?.id, action: 'UPDATE', entity: 'USER', entityId: String(req.params.id), metadata: { role, status } });
  res.json(user);
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (id === req.user?.id) return res.status(400).json({ error: 'You cannot disable your own administrator account' });
  if (id < 0) { disableFallbackUser(id); return res.status(204).send(); }
  await prisma.user.update({ where: { id }, data: { status: 'DISABLED' } });
  await writeAudit({ userId: req.user?.id, action: 'DISABLE', entity: 'USER', entityId: String(id) });
  return res.status(204).send();
};

export const listAuditLogs = async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  try { return res.json(await prisma.auditLog.findMany({ take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } })); }
  catch (error) { console.error('Audit logs unavailable.', error); return res.json([]); }
};

export const getMaintenance = async (_req: Request, res: Response) => {
  try { return res.json(await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } })); }
  catch (error) { console.error('Maintenance settings unavailable.', error); return res.json([]); }
};

export const updateMaintenance = async (req: AuthRequest, res: Response) => {
  const allowed = ['maintenanceMode', 'announcement', 'shippingFee'];
  const entries = Object.entries(req.body || {}).filter((entry): entry is [string, string] => allowed.includes(entry[0]) && typeof entry[1] === 'string');
  if (!entries.length) return res.status(400).json({ error: 'No valid maintenance settings supplied' });
  try {
    for (const [key, value] of entries) await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    await writeAudit({ userId: req.user?.id, action: 'UPDATE', entity: 'SYSTEM_SETTING', metadata: Object.fromEntries(entries) });
    return res.json(await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } }));
  } catch (error) { console.error('Maintenance update unavailable.', error); return res.status(503).json({ error: 'Database unavailable' }); }
};
