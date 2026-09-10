import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const groups = {
  Tools: ['All Tools', 'Hand Tools', 'Soft Tools', 'Power Tools', 'Tool Sets'],
  'Safety Equipment': ['Gloves', 'Protective Head Gear', 'Harness', 'Ropes', 'Locks & Cables', 'Safety Shoes'],
};

const asset = (name: string) => `/images/${encodeURIComponent(name)}`;
const products = [
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      name: `Hand Tool ${number}`,
      description: `Professional hand tool ${number} for dependable workshop and site work.`,
      price: [18.99, 24.5, 29.99, 34.75, 39.99, 44.5, 49.99, 55, 62.5, 69.99][index],
      stock: 12 + index,
      categoryName: 'Hand Tools',
      imageUrl: asset(`Hand Tool ${number}.png`),
    };
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      name: `Soft Tool ${number}`,
      description: `Protective soft tool ${number} designed for careful handling and finishing work.`,
      price: [14.99, 19.5, 22.99, 27.5, 31.99, 36.5, 41.99, 47.5, 53.99, 59.99][index],
      stock: 14 + index,
      categoryName: 'Soft Tools',
      imageUrl: asset(`Soft Tool ${number}.png`),
    };
  }),
  { name: 'Safety Equipment 1', description: 'Essential protective equipment for safer daily work.', price: 16.99, stock: 20, categoryName: 'Gloves', imageUrl: asset('Safety .png') },
  { name: 'Safety Equipment 2', description: 'Reliable protective equipment for workshop and site use.', price: 28.5, stock: 18, categoryName: 'Protective Head Gear', imageUrl: asset('Safety 1.png') },
  { name: 'Safety Equipment 3', description: 'Durable safety equipment for demanding working conditions.', price: 42.99, stock: 15, categoryName: 'Harness', imageUrl: asset('Safety 2.png') },
  { name: 'Safety Equipment 4', description: 'Practical safety equipment for controlled and secure work areas.', price: 35.75, stock: 16, categoryName: 'Ropes', imageUrl: asset('Safety 3.png') },
  { name: 'Safety Equipment 5', description: 'Site-ready safety equipment built for reliable protection.', price: 48.99, stock: 11, categoryName: 'Locks & Cables', imageUrl: asset('Safety 4.png') },
  { name: 'Safety Equipment 6', description: 'Comfortable protective equipment for long working days.', price: 64.99, stock: 10, categoryName: 'Safety Shoes', imageUrl: asset('Safety 5.png') },
];

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@toolkit.com' },
    update: { role: 'ADMIN', status: 'ACTIVE' },
    create: { email: 'admin@toolkit.com', name: 'ToolKit Admin', password: adminPassword, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'sales@toolkit.com' },
    update: { role: 'SALES_PERSON', status: 'ACTIVE' },
    create: { email: 'sales@toolkit.com', name: 'ToolKit Sales', password: salesPassword, role: 'SALES_PERSON' },
  });
  await prisma.user.upsert({
    where: { email: 'buyer@toolkit.com' },
    update: { status: 'ACTIVE' },
    create: { email: 'buyer@toolkit.com', name: 'Demo Buyer', password: buyerPassword, role: 'BUYER' },
  });

  for (const [parentName, children] of Object.entries(groups)) {
    const parent = await prisma.category.upsert({ where: { name: parentName }, update: {}, create: { name: parentName } });
    for (const name of children) {
      await prisma.category.upsert({ where: { name }, update: { parentId: parent.id }, create: { name, parentId: parent.id } });
    }
  }

  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({ where: { name: product.categoryName } });
    const { categoryName: _categoryName, ...data } = product;
    const existing = await prisma.product.findFirst({ where: { name: product.name }, select: { id: true } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { ...data, categoryId: category.id } });
    } else {
      await prisma.product.create({ data: { ...data, categoryId: category.id } });
    }
  }
}

main().finally(async () => prisma.$disconnect());
