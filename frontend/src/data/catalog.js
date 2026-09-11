import { frontendSafetyProducts, frontendSoftNames, handNames, handPrices, safetyCategories, softPrices } from '../../../shared/catalog-data.ts';

const image = (name) => `/images/${encodeURIComponent(name)}`;
const makeCategory = (name, parent) => ({ name, parent: parent ? { name: parent } : null });
const toolProducts = [
  ...handNames.map((name, index) => ({ id: -(index + 1), name, description: `Professional hand tool ${index + 1} for dependable workshop and site work.`, price: handPrices[index], stock: 100 + index, imageUrl: image(`Hand Tool ${index + 1}.png`), animationUrl: image(`Hand Tool ${index + 1}b.png`), category: makeCategory('Hand Tools', 'Tools') })),
  ...frontendSoftNames.map((name, index) => ({ id: -(10 + index + 1), name, description: `Protective soft tool ${index + 1} designed for careful handling and finishing work.`, price: softPrices[index], stock: 100 + index, imageUrl: image(`Soft Tool ${index + 1}.png`), animationUrl: index === 0 ? image('Soft Tool 1b.png') : null, category: makeCategory('Soft Tools', 'Tools') })),
];
const fallbackSafetyProducts = frontendSafetyProducts.map(([name, category, filename, price], index) => ({ id: -(21 + index), name, description: 'Reliable protective equipment for workshop and site use.', price, stock: 100 + index, imageUrl: image(filename), animationUrl: null, category: makeCategory(category, 'Safety Equipment') }));
export const fallbackCategories = [{ id: 'tools', name: 'Tools', parent: null }, { id: 'hand-tools', name: 'Hand Tools', parent: { name: 'Tools' } }, { id: 'soft-tools', name: 'Soft Tools', parent: { name: 'Tools' } }, { id: 'safety', name: 'Safety Equipment', parent: null }, ...safetyCategories.map((name) => ({ id: `safety-${name}`, name, parent: { name: 'Safety Equipment' } }))];
export const fallbackProducts = [...toolProducts, ...fallbackSafetyProducts];
export const catalogueNameFor = (product) => product?.imageUrl ? fallbackProducts.find((candidate) => candidate.imageUrl === product.imageUrl)?.name || product.name : product?.name;
export const saleDiscount = (product) => { const index = handNames.indexOf(product.name); return index < 0 ? 0 : (index * 3) % 16; };
export const filterFallbackProducts = ({ category, subcategory, search }) => fallbackProducts.filter((product) => {
  const matchesCategory = !category || category.toLowerCase() === 'all products' || product.category.parent?.name.toLowerCase() === category.toLowerCase() || product.category.name.toLowerCase() === category.toLowerCase();
  const matchesSubcategory = !subcategory || product.category.name.toLowerCase() === subcategory.toLowerCase();
  const matchesSearch = !search || `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase());
  return matchesCategory && matchesSubcategory && matchesSearch;
});
