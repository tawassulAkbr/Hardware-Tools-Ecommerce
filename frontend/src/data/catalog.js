const image = (name) => `/images/${encodeURIComponent(name)}`;

const handPrices = [1899, 2499, 2999, 3499, 3999, 4499, 4999, 5499, 6299, 6999];
const softPrices = [1499, 1999, 2299, 2799, 3199, 3699, 4199, 4799, 5399, 5999];
const handNames = ['Adjustable Wrench', 'Claw Hammer', 'Precision Screwdriver Set', 'Combination Pliers', 'Measuring Tape', 'Utility Knife', 'Pipe Wrench', 'Hex Key Set', 'Cold Chisel Set', 'Ratchet Socket Set'];
const softNames = ['Tool Organizer Bag', 'Protective Knee Pads', 'Rubber Mallet', 'Cable Tie Kit', 'Workshop Mat', 'Sanding Block Set', 'Grip Pad Set', 'Foam Work Cushion', 'Flexible Scraper Set', 'Workshop Cleaning Kit'];
const safetyProducts = [
  ['Cut Resistant Gloves', 'Gloves', 'Safety .png', 1699],
  ['Impact Safety Helmet', 'Protective Head Gear', 'Safety 1.png', 2899],
  ['Full Body Harness', 'Harness', 'Safety 2.png', 4299],
  ['High Visibility Safety Rope', 'Ropes', 'Safety 3.png', 3599],
  ['Safety Lock Cable', 'Locks & Cables', 'Safety 4.png', 4899],
  ['Steel Toe Safety Shoes', 'Safety Shoes', 'Safety 5.png', 6499],
  ['Chemical Resistant Gloves', 'Chemical Gloves', 'Safety 6.png', 2199],
  ['Heavy Duty Welding Gloves', 'Welding Gloves', 'Safety 7.png', 2499],
  ['Tinted Safety Glasses', 'Safety Glasses', 'Safety 8.png', 1899],
  ['Welding Protection Goggles', 'Welding Goggles', 'Safety 9.png', 2799],
].map(([name, category, filename, price], index) => ({
  id: -(21 + index),
  name,
  description: 'Reliable protective equipment for workshop and site use.',
  price,
  stock: 10 + index,
  imageUrl: image(filename),
  animationUrl: null,
  category: { name: category, parent: { name: 'Safety Equipment' } },
}));

const toolProducts = [
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      id: -number,
      name: handNames[index],
      description: `Professional hand tool ${number} for dependable workshop and site work.`,
      price: handPrices[index],
      stock: 12 + index,
      imageUrl: image(`Hand Tool ${number}.png`),
      animationUrl: image(`Hand Tool ${number}b.png`),
      category: { name: 'Hand Tools', parent: { name: 'Tools' } },
    };
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      id: -(10 + number),
      name: softNames[index],
      description: `Protective soft tool ${number} designed for careful handling and finishing work.`,
      price: softPrices[index],
      stock: 14 + index,
      imageUrl: image(`Soft Tool ${number}.png`),
      animationUrl: number === 1 ? image('Soft Tool 1b.png') : null,
      category: { name: 'Soft Tools', parent: { name: 'Tools' } },
    };
  }),
];

export const fallbackCategories = [
  { id: 'tools', name: 'Tools', parent: null },
  { id: 'hand-tools', name: 'Hand Tools', parent: { name: 'Tools' } },
  { id: 'soft-tools', name: 'Soft Tools', parent: { name: 'Tools' } },
  { id: 'safety', name: 'Safety Equipment', parent: null },
  ...['Gloves', 'Protective Head Gear', 'Harness', 'Ropes', 'Locks & Cables', 'Safety Shoes', 'Chemical Gloves', 'Welding Gloves', 'Safety Glasses', 'Welding Goggles'].map((name) => ({ id: `safety-${name}`, name, parent: { name: 'Safety Equipment' } })),
];

export const fallbackProducts = [...toolProducts, ...safetyProducts];

export const saleDiscount = (product) => {
  const index = handNames.indexOf(product.name);
  if (index < 0) return 0;
  return (index * 3) % 16;
};

export const filterFallbackProducts = ({ category, subcategory, search }) => fallbackProducts.filter((product) => {
  const matchesCategory = !category || category.toLowerCase() === 'all products' || product.category.parent.name.toLowerCase() === category.toLowerCase() || product.category.name.toLowerCase() === category.toLowerCase();
  const matchesSubcategory = !subcategory || product.category.name.toLowerCase() === subcategory.toLowerCase();
  const query = search.toLowerCase();
  const matchesSearch = !query || `${product.name} ${product.description}`.toLowerCase().includes(query);
  return matchesCategory && matchesSubcategory && matchesSearch;
});
