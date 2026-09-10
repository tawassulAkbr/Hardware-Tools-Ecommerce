const image = (name) => `/images/${encodeURIComponent(name)}`;

const handPrices = [18.99, 24.5, 29.99, 34.75, 39.99, 44.5, 49.99, 55, 62.5, 69.99];
const softPrices = [14.99, 19.5, 22.99, 27.5, 31.99, 36.5, 41.99, 47.5, 53.99, 59.99];
const safetyProducts = [
  ['Safety Equipment 1', 'Gloves', 'Safety .png', 16.99],
  ['Safety Equipment 2', 'Protective Head Gear', 'Safety 1.png', 28.5],
  ['Safety Equipment 3', 'Harness', 'Safety 2.png', 42.99],
  ['Safety Equipment 4', 'Ropes', 'Safety 3.png', 35.75],
  ['Safety Equipment 5', 'Locks & Cables', 'Safety 4.png', 48.99],
  ['Safety Equipment 6', 'Safety Shoes', 'Safety 5.png', 64.99],
].map(([name, category, filename, price], index) => ({
  id: `safety-${index + 1}`,
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
      id: `hand-${number}`,
      name: `Hand Tool ${number}`,
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
      id: `soft-${number}`,
      name: `Soft Tool ${number}`,
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
  ...['Gloves', 'Protective Head Gear', 'Harness', 'Ropes', 'Locks & Cables', 'Safety Shoes'].map((name) => ({ id: `safety-${name}`, name, parent: { name: 'Safety Equipment' } })),
];

export const fallbackProducts = [...toolProducts, ...safetyProducts];

export const filterFallbackProducts = ({ category, subcategory, search }) => fallbackProducts.filter((product) => {
  const matchesCategory = !category || category.toLowerCase() === 'all products' || product.category.parent.name.toLowerCase() === category.toLowerCase() || product.category.name.toLowerCase() === category.toLowerCase();
  const matchesSubcategory = !subcategory || product.category.name.toLowerCase() === subcategory.toLowerCase();
  const query = search.toLowerCase();
  const matchesSearch = !query || `${product.name} ${product.description}`.toLowerCase().includes(query);
  return matchesCategory && matchesSubcategory && matchesSearch;
});
