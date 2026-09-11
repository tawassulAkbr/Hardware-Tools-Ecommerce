import { handNames, handPrices, safetyCategories, safetyProducts, softNames, softPrices } from '../../../shared/catalog-data';

const image = (name: string) => `/images/${encodeURIComponent(name)}`;
const toolsCategory = { id: -10, name: 'Tools' };
const safetyCategory = { id: -20, name: 'Safety Equipment' };
const toolProducts = [
  ...handNames.map((name, index) => ({ id: -(index + 1), name, description: `Professional ${name.toLowerCase()} for dependable workshop and site work.`, price: handPrices[index], stock: 100 + index, imageUrl: image(`Hand Tool ${index + 1}.png`), category: { id: -1, name: 'Hand Tools', parent: toolsCategory } })),
  ...softNames.map((name, index) => ({ id: -(10 + index + 1), name, description: `Protective ${name.toLowerCase()} designed for careful handling and finishing work.`, price: softPrices[index], stock: 100 + index, imageUrl: image(`Soft Tool ${index + 1}.png`), category: { id: -2, name: 'Soft Tools', parent: toolsCategory } })),
];
const fallbackSafetyProducts = safetyProducts.map(([name, category, filename, price], index) => ({ id: -(21 + index), name, description: 'Reliable protective equipment for workshop and site use.', price, stock: 100 + index, imageUrl: image(filename), category: { id: -(30 + index), name: category, parent: safetyCategory } }));
export const fallbackProducts = [...toolProducts, ...fallbackSafetyProducts];
export const fallbackCategories = [{ id: -10, name: 'Tools', parentId: null, parent: null, subcategories: [{ id: -1, name: 'Hand Tools' }, { id: -2, name: 'Soft Tools' }] }, { id: -1, name: 'Hand Tools', parentId: -10, parent: toolsCategory, subcategories: [] }, { id: -2, name: 'Soft Tools', parentId: -10, parent: toolsCategory, subcategories: [] }, { id: -20, name: 'Safety Equipment', parentId: null, parent: null, subcategories: [] }, ...safetyCategories.map((name, index) => ({ id: -(30 + index), name, parentId: -20, parent: safetyCategory, subcategories: [] }))];
export const filteredFallbackProducts = (category: string, subcategory: string, search: string) => fallbackProducts.filter((product) => {
  const matchesCategory = !category || product.category.parent.name.toLowerCase() === category.toLowerCase() || product.category.name.toLowerCase() === category.toLowerCase();
  const matchesSubcategory = !subcategory || product.category.name.toLowerCase() === subcategory.toLowerCase();
  const matchesSearch = !search || `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase());
  return matchesCategory && matchesSubcategory && matchesSearch;
});
