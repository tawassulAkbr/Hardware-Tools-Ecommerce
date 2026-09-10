import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { api, getAuth, money } from '../api';
import { fallbackCategories, filterFallbackProducts } from '../data/catalog';

const animationFor = (product) => {
  if (product.animationUrl && /b\.(png|jpe?g|webp)$/i.test(product.animationUrl)) return product.animationUrl;
  const match = product.name?.match(/^(Hand Tool|Soft Tool) (\d+)$/);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 10 || (match[1] === 'Soft Tool' && match[2] !== '1')) return null;
  return `/images/${encodeURIComponent(`${match[1]} ${match[2]}b.png`)}`;
};

const AnimatedProductImage = ({ product }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const animationUrl = animationFor(product);

  useEffect(() => {
    if (!animationUrl || !isHovered) return undefined;
    const timer = window.setInterval(() => setShowAnimation((visible) => !visible), 1600);
    return () => window.clearInterval(timer);
  }, [animationUrl, isHovered]);

  return (
    <div className="relative h-full w-full" onMouseEnter={() => { setIsHovered(true); setShowAnimation(true); }} onMouseLeave={() => { setIsHovered(false); setShowAnimation(false); }}>
      <img src={product.imageUrl} alt={product.name} className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 ${showAnimation ? 'opacity-0' : 'opacity-100'}`} />
      {animationUrl && <img src={animationUrl} alt={`${product.name} alternate view`} className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 ${showAnimation ? 'opacity-100' : 'opacity-0'}`} />}
    </div>
  );
};

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const categoryQuery = searchParams.get('category');
  const searchQuery = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryQuery) params.set('category', categoryQuery);
    if (subcategory) params.set('subcategory', subcategory);
    if (searchQuery) params.set('search', searchQuery);
    api(`/products?${params}`).then(setProducts).catch((err) => {
      setProducts(filterFallbackProducts({ category: categoryQuery, subcategory, search: searchQuery }));
      setMessage(`Backend unavailable. Showing the local tool catalog. (${err.message})`);
    });
    api('/categories').then(setCategories).catch(() => setCategories(fallbackCategories));
  }, [categoryQuery, subcategory, searchQuery]);

  const add = async (productId) => {
    if (!getAuth()?.token) return setMessage('Please login to add items to your cart.');
    try {
      await api('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
      setMessage('Added to cart.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const subcategories = categories.filter((c) => c.parent?.name === categoryQuery);

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{categoryQuery || 'All Products'}</h1>
          <p className="text-gray-600">{searchQuery ? `Search: ${searchQuery}` : 'Browse professional tools and safety equipment.'}</p>
        </div>
        {subcategories.length > 0 && (
          <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="rounded border px-3 py-2">
            <option value="">All subcategories</option>
            {subcategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        )}
      </div>
      {message && <div className="mb-5 rounded bg-gray-100 p-3 text-sm">{message}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <motion.div 
            key={product.id}
            className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden"
            whileHover={{ y: -5 }}
          >
            <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
              {product.imageUrl ? <AnimatedProductImage product={product} /> : 'Tool Image'}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold">{product.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{product.category?.parent?.name || product.category?.name} / {product.category?.name}</p>
              <p className="text-gray-900 font-semibold mt-2">{money(product.price)}</p>
              <p className={`text-sm ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
              <button disabled={product.stock < 1} onClick={() => add(product.id)} className="w-full mt-4 bg-black text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 transition">
                {product.stock > 0 ? 'Add to Cart' : 'Unavailable'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {!products.length && <div className="rounded bg-white p-8 text-center text-gray-600">No products found.</div>}
    </div>
  );
};

export default ProductsPage;
