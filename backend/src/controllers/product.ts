import { Request, Response } from 'express';
import { prisma } from '../index';
import { filteredFallbackProducts } from '../data/catalog';
import { writeAudit } from '../utils/audit';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const productData = (body: any) => ({
  name: String(body.name || '').trim().slice(0, 160),
  description: String(body.description || '').trim().slice(0, 4000),
  price: Number(body.price),
  stock: Number(body.stock ?? 0),
  imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
  categoryId: Number(body.categoryId),
});

const isValidProduct = (data: ReturnType<typeof productData>) =>
  Boolean(data.name && data.description && Number.isFinite(data.price) && data.price >= 0 &&
    Number.isInteger(data.stock) && data.stock >= 0 && Number.isInteger(data.categoryId) && data.categoryId > 0 &&
    (!data.imageUrl || /^(https?:\/\/|\/images\/|\/uploads\/)/i.test(data.imageUrl)));

export const uploadProductImage = async (req: Request, res: Response) => {
  const dataUrl = String(req.body?.data || '');
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return res.status(400).json({ error: 'Only PNG, JPG, or WEBP images are allowed' });
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'Image must be smaller than 2 MB' });
  const extension = match[1].toLowerCase().replace('jpeg', 'jpg').replace('image/', '');
  const directory = path.resolve(__dirname, '../../uploads');
  await fs.mkdir(directory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(directory, filename), buffer, { flag: 'wx' });
  return res.status(201).json({ url: `/uploads/${filename}` });
};

export const listProducts = async (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim();
  const category = String(req.query.category || '').trim();
  const subcategory = String(req.query.subcategory || '').trim();

  try {
    const categories = await prisma.category.findMany({ select: { id: true, name: true, parentId: true } });
    const requested = (subcategory || category).toLowerCase();
    const roots = categories.filter((item) => item.name.toLowerCase() === requested).map((item) => item.id);
    const categoryIds = new Set<number>(roots);
    let frontier = roots;
    while (frontier.length) {
      frontier = categories.filter((item) => item.parentId !== null && frontier.includes(item.parentId)).map((item) => item.id);
      frontier.forEach((id) => categoryIds.add(id));
    }
    const products = await prisma.product.findMany({
      where: {
        ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {}),
        ...((category && category.toLowerCase() !== 'all products') || subcategory ? { categoryId: { in: [...categoryIds] } } : {}),
      },
      include: { category: { include: { parent: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(products);
  } catch (error) {
    console.error('Product database unavailable; serving local catalog.', error);
    res.setHeader('X-ToolKit-Data-Source', 'local-catalog');
    return res.json(filteredFallbackProducts(category, subcategory, search));
  }
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: { category: { include: { parent: true } } },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
};

export const createProduct = async (req: Request, res: Response) => {
  const data = productData(req.body);
  if (!isValidProduct(data)) {
    return res.status(400).json({ error: 'Invalid product data' });
  }
  if (!(await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }))) {
    return res.status(400).json({ error: 'Category not found' });
  }
  const product = await prisma.product.create({ data });
  await writeAudit({ action: 'CREATE', entity: 'PRODUCT', entityId: String(product.id), metadata: { name: product.name } });
  return res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const data = productData(req.body);
  if (!isValidProduct(data)) {
    return res.status(400).json({ error: 'Invalid product data' });
  }
  if (!(await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }))) {
    return res.status(400).json({ error: 'Category not found' });
  }
  const product = await prisma.product.update({ where: { id: Number(req.params.id) }, data });
  await writeAudit({ action: 'UPDATE', entity: 'PRODUCT', entityId: String(product.id), metadata: { name: product.name } });
  return res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.product.delete({ where: { id } });
  await writeAudit({ action: 'DELETE', entity: 'PRODUCT', entityId: String(id) });
  return res.status(204).send();
};
