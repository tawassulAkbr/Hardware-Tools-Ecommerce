const image = (name: string) => `/images/${encodeURIComponent(name)}`;
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
  id: -(20 + index + 1), name, description: 'Reliable protective equipment for workshop and site use.', price: Number(price), stock: 10 + index, imageUrl: image(String(filename)), category: { id: -(30 + index), name: String(category), parent: { id: -20, name: 'Safety Equipment' } },
}));

const toolProducts = [
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return { id: -(number), name: `Hand Tool ${number}`, description: `Professional hand tool ${number} for dependable workshop and site work.`, price: handPrices[index], stock: 12 + index, imageUrl: image(`Hand Tool ${number}.png`), category: { id: -1, name: 'Hand Tools', parent: { id: -10, name: 'Tools' } } };
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return { id: -(10 + number), name: `Soft Tool ${number}`, description: `Protective soft tool ${number} designed for careful handling and finishing work.`, price: softPrices[index], stock: 14 + index, imageUrl: image(`Soft Tool ${number}.png`), category: { id: -2, name: 'Soft Tools', parent: { id: -10, name: 'Tools' } } };
  }),
];

export const fallbackProducts = [...toolProducts, ...safetyProducts];
export const fallbackCategories = [
  { id: -10, name: 'Tools', parentId: null, parent: null, subcategories: [{ id: -1, name: 'Hand Tools' }, { id: -2, name: 'Soft Tools' }] },
  { id: -1, name: 'Hand Tools', parentId: -10, parent: { id: -10, name: 'Tools' }, subcategories: [] },
  { id: -2, name: 'Soft Tools', parentId: -10, parent: { id: -10, name: 'Tools' }, subcategories: [] },
  { id: -20, name: 'Safety Equipment', parentId: null, parent: null, subcategories: [] },
  ...['Gloves', 'Protective Head Gear', 'Harness', 'Ropes', 'Locks & Cables', 'Safety Shoes'].map((name, index) => ({ id: -(30 + index), name, parentId: -20, parent: { id: -20, name: 'Safety Equipment' }, subcategories: [] })),
];

export const filteredFallbackProducts = (category: string, subcategory: string, search: string) => fallbackProducts.filter((product) => {
  const matchesCategory = !category || product.category.parent.name.toLowerCase() === category.toLowerCase() || product.category.name.toLowerCase() === category.toLowerCase();
  const matchesSubcategory = !subcategory || product.category.name.toLowerCase() === subcategory.toLowerCase();
  const matchesSearch = !search || `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase());
  return matchesCategory && matchesSubcategory && matchesSearch;
});
