import { Request, Response } from 'express';
import { prisma } from '../index';
import { fallbackCategories } from '../data/catalog';

export const listCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true, parent: true },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
    return res.json(categories);
  } catch (error) {
    console.error('Category database unavailable; serving local categories.', error);
    res.setHeader('X-ToolKit-Data-Source', 'local-catalog');
    return res.json(fallbackCategories);
  }
};
