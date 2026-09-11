import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const groups = {
  Tools: ['All Tools', 'Hand Tools', 'Soft Tools', 'Power Tools', 'Tool Sets'],
  'Safety Equipment': ['Gloves', 'Protective Head Gear', 'Harness', 'Ropes', 'Locks & Cables', 'Safety Shoes', 'Chemical Gloves', 'Welding Gloves', 'Safety Glasses', 'Welding Goggles'],
};

const asset = (name: string) => `/images/${encodeURIComponent(name)}`;
const handNames = ['Adjustable Wrench', 'Claw Hammer', 'Precision Screwdriver Set', 'Combination Pliers', 'Measuring Tape', 'Utility Knife', 'Pipe Wrench', 'Hex Key Set', 'Cold Chisel Set', 'Ratchet Socket Set'];
const softNames = ['Tool Organizer Bag', 'Protective Knee Pads', 'Rubber Mallet', 'Cable Tie Kit', 'Workshop Mat', 'Sanding Block Set', 'Grip Pad Set', 'Foam Work Cushion', 'Flexible Scraper Set', 'Workshop Cleaning Kit'];
const products = [
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      name: handNames[index],
      description: `Professional hand tool ${number} for dependable workshop and site work.`,
      price: [1899, 2499, 2999, 3499, 3999, 4499, 4999, 5499, 6299, 6999][index],
      stock: 12 + index,
      categoryName: 'Hand Tools',
      imageUrl: asset(`Hand Tool ${number}.png`),
    };
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      name: softNames[index],
      description: `Protective soft tool ${number} designed for careful handling and finishing work.`,
      price: [1499, 1999, 2299, 2799, 3199, 3699, 4199, 4799, 5399, 5999][index],
      stock: 14 + index,
      categoryName: 'Soft Tools',
      imageUrl: asset(`Soft Tool ${number}.png`),
    };
  }),
  { name: 'Cut Resistant Gloves', description: 'Essential protective equipment for safer daily work.', price: 1699, stock: 20, categoryName: 'Gloves', imageUrl: asset('Safety .png') },
  { name: 'Impact Safety Helmet', description: 'Reliable protective equipment for workshop and site use.', price: 2899, stock: 18, categoryName: 'Protective Head Gear', imageUrl: asset('Safety 1.png') },
  { name: 'Full Body Harness', description: 'Durable safety equipment for demanding working conditions.', price: 4299, stock: 15, categoryName: 'Harness', imageUrl: asset('Safety 2.png') },
  { name: 'High Visibility Safety Rope', description: 'Practical safety equipment for controlled and secure work areas.', price: 3599, stock: 16, categoryName: 'Ropes', imageUrl: asset('Safety 3.png') },
  { name: 'Safety Lock Cable', description: 'Site-ready safety equipment built for reliable protection.', price: 4899, stock: 11, categoryName: 'Locks & Cables', imageUrl: asset('Safety 4.png') },
  { name: 'Steel Toe Safety Shoes', description: 'Comfortable protective equipment for long working days.', price: 6499, stock: 10, categoryName: 'Safety Shoes', imageUrl: asset('Safety 5.png') },
  { name: 'Chemical Resistant Gloves', description: 'Chemical-resistant gloves for controlled handling and site work.', price: 2199, stock: 14, categoryName: 'Chemical Gloves', imageUrl: asset('Safety 6.png') },
  { name: 'Heavy Duty Welding Gloves', description: 'Heavy-duty gloves for welding and high-temperature work.', price: 2499, stock: 12, categoryName: 'Welding Gloves', imageUrl: asset('Safety 7.png') },
  { name: 'Tinted Safety Glasses', description: 'Clear protective eyewear for workshop and construction tasks.', price: 1899, stock: 16, categoryName: 'Safety Glasses', imageUrl: asset('Safety 8.png') },
  { name: 'Welding Protection Goggles', description: 'Dark protective eyewear designed for welding environments.', price: 2799, stock: 13, categoryName: 'Welding Goggles', imageUrl: asset('Safety 9.png') },
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
