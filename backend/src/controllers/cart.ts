import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth';
import { fallbackProducts } from '../data/catalog';
import { writeAudit } from '../utils/audit';

const SHIPPING_FEE = 299;
let shippingFeeCache = SHIPPING_FEE;
let shippingFeeCacheAt = 0;

export const getShippingFee = async () => {
  if (Date.now() - shippingFeeCacheAt < 60_000) return shippingFeeCache;
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'shippingFee' }, select: { value: true } });
    const fee = Number(setting?.value);
    shippingFeeCache = Number.isFinite(fee) && fee >= 0 ? fee : SHIPPING_FEE;
    shippingFeeCacheAt = Date.now();
    return shippingFeeCache;
  } catch {
    return SHIPPING_FEE;
  }
};

export const saleDiscount = (product: { name?: unknown }) => {
  const handNames = ['Ring Spanner', 'Screw-driver Bits Storage Set', 'Open-end Wrench Set', 'Felling Axe', 'Multi-functional Wire Stripper', 'Aviation Snips', 'Drill Set', 'Digital Multimeter', 'Combination Pilers', 'Tool Box'];
  const index = handNames.indexOf(String(product.name || ''));
  return index < 0 ? 0 : (index * 3) % 16;
};

export const salePrice = (product: { name?: string; price: number }, applied = true) => applied ? Number((product.price * (1 - saleDiscount(product) / 100)).toFixed(2)) : product.price;
const cartProduct = (product: any, applied = false) => ({ ...product, price: salePrice(product, applied), saleApplied: applied });

const cartInclude = { items: { include: { product: { include: { category: true } } } } };

const summarize = (cart: any, shippingFee = SHIPPING_FEE) => {
  const items = cart.items.map((item: any) => ({ ...item, product: cartProduct(item.product, item.saleApplied) }));
  const subtotal = items.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);
  const appliedShippingFee = items.length ? shippingFee : 0;
  return { ...cart, items, subtotal, shippingFee: appliedShippingFee, total: subtotal + appliedShippingFee };
};

export const demoCarts = new Map<number, any[]>();
export const fallbackUserIds = new Set<number>();

const summarizeDemoCart = (userId: number) => {
  const items = (demoCarts.get(userId) || []).map((item) => ({ ...item, product: cartProduct(item.product, item.saleApplied) }));
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = items.length ? SHIPPING_FEE : 0;
  return { id: userId, userId, items, subtotal, shippingFee, total: subtotal + shippingFee };
};

export const getDemoCart = (userId: number) => summarizeDemoCart(userId);
export const clearDemoCart = (userId: number) => demoCarts.delete(userId);
export const isFallbackUser = (userId: number) => userId < 0 || fallbackUserIds.has(userId);

export const getCart = async (req: AuthRequest, res: Response) => {
  if (isFallbackUser(req.user!.id)) return res.json(getDemoCart(req.user!.id));
  try {
    const cart = await prisma.cart.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id },
      update: {},
      include: cartInclude,
    });
    return res.json(summarize(cart, await getShippingFee()));
  } catch (error) {
    console.error('Cart database unavailable.', error);
    fallbackUserIds.add(req.user!.id);
    return res.json(getDemoCart(req.user!.id));
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity || 1);
  const requestedSale = req.body.sale === true || req.body.sale === 'true';
  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  if (isFallbackUser(req.user!.id)) {
    const product = fallbackProducts.find((candidate) => candidate.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const items = demoCarts.get(req.user!.id) || [];
    const existing = items.find((item) => item.product.id === productId);
    if ((existing?.quantity || 0) + quantity > product.stock) return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    if (existing) existing.quantity += quantity;
    else items.push({ id: productId, product, quantity, saleApplied: requestedSale && saleDiscount(product) > 0 });
    demoCarts.set(req.user!.id, items);
    void writeAudit({ userId: req.user!.id, action: 'ADD_ITEM', entity: 'CART', entityId: String(productId), metadata: { quantity } });
    return res.json(getDemoCart(req.user!.id));
  }

  let product;
  try {
    product = await prisma.product.findUnique({ where: { id: productId } });
  } catch (error) {
    console.error('Cart database unavailable.', error);
    const fallbackProduct = fallbackProducts.find((candidate) => candidate.id === productId);
    if (!fallbackProduct) return res.status(404).json({ error: 'Product not found while offline' });
    fallbackUserIds.add(req.user!.id);
    const items = demoCarts.get(req.user!.id) || [];
    const existing = items.find((item) => item.product.id === productId);
    if ((existing?.quantity || 0) + quantity > fallbackProduct.stock) return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    if (existing) existing.quantity += quantity; else items.push({ id: productId, product: fallbackProduct, quantity, saleApplied: requestedSale && saleDiscount(fallbackProduct) > 0 });
    demoCarts.set(req.user!.id, items);
    return res.json(getDemoCart(req.user!.id));
  }
  if (!product && productId < 0) {
    const fallbackProduct = fallbackProducts.find((candidate) => candidate.id === productId);
    if (!fallbackProduct) return res.status(404).json({ error: 'Product not found' });
    fallbackUserIds.add(req.user!.id);
    const items = demoCarts.get(req.user!.id) || [];
    const existing = items.find((item) => item.product.id === productId);
    if ((existing?.quantity || 0) + quantity > fallbackProduct.stock) return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    if (existing) existing.quantity += quantity;
    else items.push({ id: productId, product: fallbackProduct, quantity, saleApplied: requestedSale && saleDiscount(fallbackProduct) > 0 });
    demoCarts.set(req.user!.id, items);
    return res.json(getDemoCart(req.user!.id));
  }
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id }, update: {} });
      const existing = await tx.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
      if ((existing?.quantity || 0) + quantity > product.stock) {
        throw new Error('Requested quantity exceeds available stock');
      }
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity, saleApplied: requestedSale && saleDiscount(product) > 0 },
        update: { quantity: { increment: quantity }, saleApplied: requestedSale && saleDiscount(product) > 0 },
      });
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Requested quantity exceeds available stock') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Cart persistence unavailable; keeping the cart in memory.', error);
    fallbackUserIds.add(req.user!.id);
    const items = demoCarts.get(req.user!.id) || [];
    const existing = items.find((item) => item.product.id === productId);
    if ((existing?.quantity || 0) + quantity > product.stock) return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    if (existing) existing.quantity += quantity;
    else items.push({ id: productId, product, quantity, saleApplied: requestedSale && saleDiscount(product) > 0 });
    demoCarts.set(req.user!.id, items);
    return res.json(getDemoCart(req.user!.id));
  }
  void writeAudit({ userId: req.user!.id, action: 'ADD_ITEM', entity: 'CART', entityId: String(productId), metadata: { quantity } });
  return getCart(req, res);
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });

  if (isFallbackUser(req.user!.id)) {
    const items = demoCarts.get(req.user!.id) || [];
    const item = items.find((entry) => entry.id === id);
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    if (item.product.stock < quantity) return res.status(400).json({ error: 'Out of stock' });
    item.quantity = quantity;
    await writeAudit({ userId: req.user!.id, action: 'UPDATE_ITEM', entity: 'CART', entityId: String(id), metadata: { quantity } });
    return res.json(getDemoCart(req.user!.id));
  }

  let item;
  try {
    item = await prisma.cartItem.findUnique({ where: { id }, include: { product: true, cart: true } });
  } catch (error) {
    console.error('Cart database unavailable.', error);
    fallbackUserIds.add(req.user!.id);
    return res.status(404).json({ error: 'Cart item not found' });
  }
  if (!item || item.cart.userId !== req.user!.id) return res.status(404).json({ error: 'Cart item not found' });
  if (item.product.stock < quantity) return res.status(400).json({ error: 'Out of stock' });

  await prisma.cartItem.update({ where: { id }, data: { quantity } });
  await writeAudit({ userId: req.user!.id, action: 'UPDATE_ITEM', entity: 'CART', entityId: String(id), metadata: { quantity } });
  return getCart(req, res);
};

export const removeCartItem = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (isFallbackUser(req.user!.id)) {
    const items = demoCarts.get(req.user!.id) || [];
    const nextItems = items.filter((item) => item.id !== id);
    if (nextItems.length === items.length) return res.status(404).json({ error: 'Cart item not found' });
    demoCarts.set(req.user!.id, nextItems);
    await writeAudit({ userId: req.user!.id, action: 'REMOVE_ITEM', entity: 'CART', entityId: String(id) });
    return res.json(getDemoCart(req.user!.id));
  }

  let item;
  try {
    item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
  } catch (error) {
    console.error('Cart database unavailable.', error);
    fallbackUserIds.add(req.user!.id);
    return res.status(404).json({ error: 'Cart item not found' });
  }
  if (!item || item.cart.userId !== req.user!.id) return res.status(404).json({ error: 'Cart item not found' });
  await prisma.cartItem.delete({ where: { id } });
  await writeAudit({ userId: req.user!.id, action: 'REMOVE_ITEM', entity: 'CART', entityId: String(id) });
  return getCart(req, res);
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  if (isFallbackUser(req.user!.id)) {
    clearDemoCart(req.user!.id);
    return res.json(getDemoCart(req.user!.id));
  }
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await writeAudit({ userId: req.user!.id, action: 'CLEAR', entity: 'CART', entityId: String(req.user!.id) });
  return getCart(req, res);
};
