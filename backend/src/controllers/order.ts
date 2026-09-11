import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth';
import { sendOrderEmail } from '../utils/email';
import { clearDemoCart, getDemoCart, fallbackUserIds, isFallbackUser, salePrice } from './cart';
import crypto from 'node:crypto';
import { writeAudit } from '../utils/audit';

const SHIPPING_FEE = 299;
const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED'];

const makeOrderId = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return [...crypto.randomBytes(9)].map((byte) => alphabet[byte % alphabet.length]).join('');
};
export const demoOrders: any[] = [];

const fallbackCheckout = async (req: AuthRequest, res: Response) => {
  const cart = getDemoCart(req.user!.id);
  if (!cart.items.length) return res.status(400).json({ error: 'Cart is empty' });
  let id = makeOrderId();
  while (demoOrders.some((entry) => entry.id === id)) id = makeOrderId();
  const order = { id, userId: req.user!.id, totalAmount: Number(cart.total.toFixed(2)), shippingFee: cart.shippingFee, status: 'CONFIRMED', paymentMethod: req.body.paymentMethod, customerName: req.body.customerName, phone: req.body.phone, address: req.body.address, createdAt: new Date().toISOString(), items: cart.items.map((item: any, index: number) => ({ id: index + 1, productId: item.product.id, quantity: item.quantity, price: item.product.price, product: item.product })) };
  demoOrders.unshift(order);
  clearDemoCart(req.user!.id);
  await writeAudit({ userId: req.user!.id, action: 'CREATE', entity: 'ORDER', entityId: order.id, metadata: { totalAmount: order.totalAmount, source: 'offline-fallback' } });
  await sendOrderEmail(req.body.email || 'buyer@toolkit.com', order.id, order);
  return res.status(201).json(order);
};

export const checkout = async (req: AuthRequest, res: Response) => {
  const { customerName, phone, address, paymentMethod } = req.body;
  if (!customerName || !phone || !address || !['COD', 'CARD', 'JAZZCASH', 'EASYPAISA'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Customer, address, and valid payment method are required' });
  }

  if (isFallbackUser(req.user!.id)) return fallbackCheckout(req, res);

  let cart;
  try {
    cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: { items: { include: { product: true } }, user: true } });
  } catch (error) {
    console.error('Checkout database unavailable; using offline cart.', error);
    fallbackUserIds.add(req.user!.id);
    return fallbackCheckout(req, res);
  }
  if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) return res.status(400).json({ error: `${item.product.name} is out of stock` });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + salePrice(item.product, item.saleApplied) * item.quantity, 0);
  let shippingFee = SHIPPING_FEE;
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'shippingFee' } });
    const configuredFee = Number(setting?.value);
    if (Number.isFinite(configuredFee) && configuredFee >= 0) shippingFee = configuredFee;
  } catch { /* default fee keeps checkout available while the database is offline */ }
  const totalAmount = Number((subtotal + shippingFee).toFixed(2));
  let id = makeOrderId();
  while (await prisma.order.findUnique({ where: { id } })) id = makeOrderId();

  const order = await prisma.$transaction(async (tx) => {
    // Reserve inventory atomically so two simultaneous checkouts cannot oversell.
    for (const item of cart.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) {
        throw new Error(`${item.product.name} is out of stock`);
      }
    }

    const created = await tx.order.create({
      data: {
        id,
        userId: req.user!.id,
        status: 'CONFIRMED',
        totalAmount,
        shippingFee,
        paymentMethod,
        customerName,
        phone,
        address,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: salePrice(item.product, item.saleApplied),
          })),
        },
      },
      include: { items: { include: { product: true } }, user: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  await sendOrderEmail(cart.user.email, order.id, order);
  await writeAudit({ userId: req.user!.id, action: 'CREATE', entity: 'ORDER', entityId: order.id, metadata: { totalAmount: order.totalAmount } });
  return res.status(201).json(order);
};

export const myOrders = async (req: AuthRequest, res: Response) => {
  if (isFallbackUser(req.user!.id)) return res.json(demoOrders.filter((order) => order.userId === req.user!.id));
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
};

export const getMyOrder = async (req: AuthRequest, res: Response) => {
  if (isFallbackUser(req.user!.id)) {
    const order = demoOrders.find((entry) => entry.id === String(req.params.id).toUpperCase() && entry.userId === req.user!.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json(order);
  }
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id).toUpperCase(), userId: req.user!.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

export const trackOrder = async (req: Request, res: Response) => {
  const demoOrder = demoOrders.find((entry) => entry.id === String(req.params.id).toUpperCase());
  if (demoOrder) return res.json({ id: demoOrder.id, status: demoOrder.status, carrierName: null, trackingNumber: null, shippingDate: null, createdAt: demoOrder.createdAt });
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id).toUpperCase() },
    select: { id: true, status: true, carrierName: true, trackingNumber: true, shippingDate: true, createdAt: true },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

export const updateMyOrderStatus = async (req: AuthRequest, res: Response) => {
  const nextStatus = req.body.status;
  if (!['CANCELLED', 'RETURN_REQUESTED'].includes(nextStatus)) return res.status(400).json({ error: 'Invalid request' });
  if (isFallbackUser(req.user!.id)) {
    const order = demoOrders.find((entry) => entry.id === String(req.params.id).toUpperCase() && entry.userId === req.user!.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (nextStatus === 'CANCELLED' && !['PENDING', 'CONFIRMED'].includes(order.status)) return res.status(400).json({ error: 'Order cannot be cancelled' });
    if (nextStatus === 'RETURN_REQUESTED' && order.status !== 'DELIVERED') return res.status(400).json({ error: 'Return only allowed after delivery' });
    order.status = nextStatus;
    return res.json(order);
  }
  const order = await prisma.order.findFirst({ where: { id: String(req.params.id).toUpperCase(), userId: req.user!.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (nextStatus === 'CANCELLED' && !['PENDING', 'CONFIRMED'].includes(order.status)) return res.status(400).json({ error: 'Order cannot be cancelled' });
  if (nextStatus === 'RETURN_REQUESTED' && order.status !== 'DELIVERED') return res.status(400).json({ error: 'Return only allowed after delivery' });
  res.json(await prisma.order.update({ where: { id: order.id }, data: { status: nextStatus } }));
};

export const listAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error) {
    console.error('Order database unavailable; serving demo orders.', error);
    return res.json(demoOrders);
  }
};

export const updateOrderAdmin = async (req: AuthRequest, res: Response) => {
  const { status, carrierName, trackingNumber, shippingDate } = req.body;
  if (status && !statuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (req.user!.id < 0) {
    const order = demoOrders.find((entry) => entry.id === String(req.params.id).toUpperCase());
    if (!order) return res.status(404).json({ error: 'Order not found' });
    Object.assign(order, { status: status || order.status, carrierName, trackingNumber, shippingDate });
    await writeAudit({ userId: req.user?.id, action: 'UPDATE', entity: 'ORDER', entityId: order.id, metadata: { status, carrierName, trackingNumber, shippingDate } });
    return res.json(order);
  }
  const order = await prisma.order.update({
    where: { id: String(req.params.id).toUpperCase() },
    data: { status, carrierName, trackingNumber, shippingDate: shippingDate ? new Date(shippingDate) : undefined },
    include: { items: { include: { product: true } }, user: true },
  });
  await writeAudit({ userId: req.user?.id, action: 'UPDATE', entity: 'ORDER', entityId: order.id, metadata: { status, carrierName, trackingNumber, shippingDate } });
  res.json(order);
};
