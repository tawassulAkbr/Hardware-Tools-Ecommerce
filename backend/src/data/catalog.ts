const image = (name: string) => `/images/${encodeURIComponent(name)}`;
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
  id: -(20 + index + 1), name, description: 'Reliable protective equipment for workshop and site use.', price: Number(price), stock: 10 + index, imageUrl: image(String(filename)), category: { id: -(30 + index), name: String(category), parent: { id: -20, name: 'Safety Equipment' } },
}));

const toolProducts = [
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return { id: -(number), name: handNames[index], description: `Professional ${handNames[index].toLowerCase()} for dependable workshop and site work.`, price: handPrices[index], stock: 12 + index, imageUrl: image(`Hand Tool ${number}.png`), category: { id: -1, name: 'Hand Tools', parent: { id: -10, name: 'Tools' } } };
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return { id: -(10 + number), name: softNames[index], description: `Protective ${softNames[index].toLowerCase()} designed for careful handling and finishing work.`, price: softPrices[index], stock: 14 + index, imageUrl: image(`Soft Tool ${number}.png`), category: { id: -2, name: 'Soft Tools', parent: { id: -10, name: 'Tools' } } };
  }),
];

export const fallbackProducts = [...toolProducts, ...safetyProducts];
export const fallbackCategories = [
  { id: -10, name: 'Tools', parentId: null, parent: null, subcategories: [{ id: -1, name: 'Hand Tools' }, { id: -2, name: 'Soft Tools' }] },
  { id: -1, name: 'Hand Tools', parentId: -10, parent: { id: -10, name: 'Tools' }, subcategories: [] },
  { id: -2, name: 'Soft Tools', parentId: -10, parent: { id: -10, name: 'Tools' }, subcategories: [] },
  { id: -20, name: 'Safety Equipment', parentId: null, parent: null, subcategories: [] },
  ...['Gloves', 'Protective Head Gear', 'Harness', 'Ropes', 'Locks & Cables', 'Safety Shoes', 'Chemical Gloves', 'Welding Gloves', 'Safety Glasses', 'Welding Goggles'].map((name, index) => ({ id: -(30 + index), name, parentId: -20, parent: { id: -20, name: 'Safety Equipment' }, subcategories: [] })),
];

export const filteredFallbackProducts = (category: string, subcategory: string, search: string) => fallbackProducts.filter((product) => {
  const matchesCategory = !category || product.category.parent.name.toLowerCase() === category.toLowerCase() || product.category.name.toLowerCase() === category.toLowerCase();
  const matchesSubcategory = !subcategory || product.category.name.toLowerCase() === subcategory.toLowerCase();
  const matchesSearch = !search || `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase());
  return matchesCategory && matchesSubcategory && matchesSearch;
});
