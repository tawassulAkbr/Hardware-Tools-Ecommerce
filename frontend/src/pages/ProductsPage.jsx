import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { api, getAuth, money } from '../api';
import { catalogueNameFor, fallbackCategories, filterFallbackProducts, saleDiscount } from '../data/catalog';
import PageLoader from '../components/PageLoader';

const animationFor = (product) => {
  if (product.animationUrl && /b\.(png|jpe?g|webp)$/i.test(product.animationUrl)) return product.animationUrl;
  return null;
};

const imageFor = (product) => {
  if (product.imageUrl) return product.imageUrl;
  const tool = product.name?.match(/^(Hand Tool|Soft Tool) (\d+)$/);
  if (tool) return `/images/${encodeURIComponent(`${tool[1]} ${tool[2]}.png`)}`;
  const safety = product.name?.match(/^Safety Equipment (\d+)$/);
  if (safety) return `/images/${encodeURIComponent(`Safety${Number(safety[1]) === 1 ? ' ' : ` ${Number(safety[1]) - 1}`}.png`)}`;
  return null;
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

  if (!animationUrl) return <img src={imageFor(product)} alt={product.name} className="h-full w-full object-contain p-4" />;

  return (
    <div className="relative h-full w-full" onMouseEnter={() => { setIsHovered(true); setShowAnimation(true); }} onMouseLeave={() => { setIsHovered(false); setShowAnimation(false); }}>
      <img src={imageFor(product)} alt={product.name} className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 ${showAnimation ? 'opacity-0' : 'opacity-100'}`} />
      {animationUrl && <img src={animationUrl} alt={`${product.name} alternate view`} className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 ${showAnimation ? 'opacity-100' : 'opacity-0'}`} />}
    </div>
  );
};

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const categoryQuery = searchParams.get('category');
  const searchQuery = searchParams.get('search') || '';
  const saleView = searchParams.get('sale') === '1';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [message, setMessage] = useState('');
  const [loadedQuery, setLoadedQuery] = useState(null);
  const [adding, setAdding] = useState(null);
  const [inventoryReady, setInventoryReady] = useState(false);
  const queryKey = `${categoryQuery || ''}|${subcategory}|${searchQuery}`;
  const loading = loadedQuery !== queryKey;

  useEffect(() => {
    let active = true;
    const localProducts = filterFallbackProducts({ category: categoryQuery, subcategory, search: searchQuery });
    const params = new URLSearchParams();
    if (categoryQuery) params.set('category', categoryQuery);
    if (subcategory) params.set('subcategory', subcategory);
    if (searchQuery) params.set('search', searchQuery);
    api(`/products?${params}`).then((data) => {
      if (active) { setProducts(data.length ? data : localProducts); setInventoryReady(true); setMessage(''); }
    }).catch((err) => {
      if (active) {
        setProducts(localProducts);
        setMessage(`Backend unavailable. Showing the local tool catalog. (${err.message})`);
        setInventoryReady(true);
      }
    }).finally(() => {
      if (active) setLoadedQuery(queryKey);
    });
    api('/categories').then((data) => { if (active) setCategories(data); }).catch(() => { if (active) setCategories(fallbackCategories); });
    return () => { active = false; };
  }, [categoryQuery, subcategory, searchQuery, queryKey]);

  const add = async (productId) => {
    if (!getAuth()?.token) return setMessage('Please login to add items to your cart.');
    setAdding(productId);
    setMessage('Adding to cart…');
    try {
      await api('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1, sale: saleView }) });
      setMessage('Added to cart.');
      window.dispatchEvent(new Event('cart-change'));
    } catch (err) {
      setMessage(err.message);
    } finally {
      setAdding(null);
    }
  };

  const subcategories = categories.filter((c) => c.parent?.name?.toLowerCase() === categoryQuery?.toLowerCase());

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

      {loading && <PageLoader />}
      {!loading && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <motion.div 
            key={product.id}
            className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden"
            whileHover={{ y: -5 }}
          >
            <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
              {imageFor(product) ? <AnimatedProductImage product={product} /> : 'Tool Image'}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold">{catalogueNameFor(product)}</h3>
              <p className="mt-1 text-sm text-gray-500">{product.category?.parent?.name || product.category?.name} / {product.category?.name}</p>
              <p className="mt-2 font-semibold text-gray-900">{saleView && saleDiscount(product) > 0 ? <><span className="mr-2 text-blue-600">{money(product.price * (1 - saleDiscount(product) / 100))}</span><span className="text-sm text-gray-400 line-through">{money(product.price)}</span></> : money(product.price)}</p>
              <p className={`text-sm ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
              <button disabled={!inventoryReady || product.stock < 1 || adding === product.id} onClick={() => add(product.id)} className="w-full mt-4 bg-black text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 transition">
                {product.stock < 1 ? 'Unavailable' : adding === product.id ? 'Adding…' : 'Add to Cart'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>}
      {!loading && !products.length && <div className="rounded bg-white p-8 text-center text-gray-600">No products found.</div>}
    </div>
  );
};

export default ProductsPage;
