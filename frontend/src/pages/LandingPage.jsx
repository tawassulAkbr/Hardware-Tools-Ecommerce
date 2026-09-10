import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ShieldCheck, Truck } from 'lucide-react';
import { fallbackProducts } from '../data/catalog';

const heroImages = ['/images/H1.png', '/images/H2.png', '/images/H3.png'];
const toolSubcategories = [
  { name: 'Hand Tools', description: 'Reliable tools for grip, cutting, and everyday work.' },
  { name: 'Soft Tools', description: 'Protective tools for careful handling and finishing.' },
];

const FeaturedProductImage = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const animationUrl = product.animationUrl && /b\.(png|jpe?g|webp)$/i.test(product.animationUrl) ? product.animationUrl : null;

  useEffect(() => {
    if (!isHovered || !animationUrl) return undefined;
    const timer = window.setInterval(() => setShowAnimation((visible) => !visible), 1600);
    return () => window.clearInterval(timer);
  }, [isHovered, animationUrl]);

  return <div className="relative h-full w-full" onMouseEnter={() => { setIsHovered(true); setShowAnimation(true); }} onMouseLeave={() => { setIsHovered(false); setShowAnimation(false); }}>
    <img src={product.imageUrl} alt={product.name} className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${showAnimation ? 'opacity-0' : 'opacity-100'}`} />
    {animationUrl && <img src={animationUrl} alt={`${product.name} alternate view`} className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${showAnimation ? 'opacity-100' : 'opacity-0'}`} />}
  </div>;
};

const LandingPage = () => {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroImages.length), 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden bg-[#111827] px-6 py-16 text-white sm:px-12 lg:px-24 lg:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <motion.div className="max-w-2xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">The professional workshop, online</p>
            <h1 className="mb-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">Tools that keep work moving.</h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-300">Dependable hand tools, soft tools, and safety equipment selected for precise work, long days, and serious results.</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products?category=Tools" className="inline-flex items-center gap-2 rounded bg-blue-500 px-7 py-3 font-semibold text-white transition hover:bg-blue-400">Shop Tools <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/products?category=Safety%20Equipment" className="inline-flex items-center gap-2 rounded border border-gray-600 px-7 py-3 font-semibold text-white transition hover:border-gray-400 hover:bg-white/5">Safety Gear <ShieldCheck className="h-4 w-4" /></Link>
            </div>
          </motion.div>

          <motion.div className="relative flex aspect-[4/3] w-full max-w-lg items-center justify-center overflow-hidden rounded-[50%] border border-blue-200/30 bg-gray-100 shadow-2xl" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }}>
            {heroImages.map((image, index) => (
              <motion.img key={image} src={image} alt={`Featured toolkit ${index + 1}`} className="absolute inset-0 h-full w-full object-contain" initial={false} animate={{ opacity: index === heroIndex ? 1 : 0, scale: index === heroIndex ? 1 : 0.96 }} transition={{ duration: 0.65 }} />
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white px-6 py-7 sm:px-12 lg:px-24">
        <div className="mx-auto grid max-w-7xl gap-6 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-3"><Truck className="h-5 w-5 text-blue-600" /><span><b className="block text-gray-900">Ready to dispatch</b><span className="text-gray-500">Stocked essentials for the next job</span></span></div>
          <div className="flex items-center gap-3"><BadgeCheck className="h-5 w-5 text-blue-600" /><span><b className="block text-gray-900">Your personal toolkit</b><span className="text-gray-500">Clear specs and honest pricing</span></span></div>
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-blue-600" /><span><b className="block text-gray-900">Worksite protection</b><span className="text-gray-500">Safety equipment in one place</span></span></div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Featured collection</p><h2 className="text-3xl font-bold">Tools ready for the job</h2></div>
            <Link to="/products?category=Tools" className="font-semibold text-blue-600 hover:underline">Browse all tools &rarr;</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {fallbackProducts.slice(0, 8).map((product) => <Link key={product.id} to={`/products?category=Tools&subcategory=${encodeURIComponent(product.category.name)}`} className="group overflow-hidden border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-44 items-center justify-center bg-gray-50 p-4"><FeaturedProductImage product={product} /></div>
              <div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{product.category.name}</p><h3 className="mt-1 font-semibold text-gray-900">{product.name}</h3><p className="mt-2 font-bold text-blue-600">${product.price.toFixed(2)}</p></div>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-6 py-20 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <motion.h2 className="mb-12 text-center text-3xl font-bold" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Explore Categories</motion.h2>
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div className="border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md" whileHover={{ y: -5 }}>
              <h3 className="mb-4 text-2xl font-bold">Tools</h3>
              <p className="mb-4 text-gray-600">Hand Tools and Soft Tools are grouped together here, with separate subcategories for quick browsing.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {toolSubcategories.map((subcategory) => <Link key={subcategory.name} to={`/products?category=Tools&subcategory=${encodeURIComponent(subcategory.name)}`} className="border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50"><span className="font-semibold text-gray-900">{subcategory.name}</span><span className="mt-1 block text-sm text-gray-500">{subcategory.description}</span></Link>)}
              </div>
              <Link to="/products?category=Tools" className="mt-6 inline-block font-medium text-blue-600 hover:underline">View All Tools &rarr;</Link>
            </motion.div>
            <motion.div className="border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md" whileHover={{ y: -5 }}>
              <h3 className="mb-4 text-2xl font-bold">Safety Equipment</h3>
              <p className="mb-4 text-gray-600">Protective essentials organized by the kind of work they support.</p>
              <ul className="space-y-2 text-gray-600"><li>Gloves and Head Gear</li><li>Harness, Ropes, and Cables</li><li>Safety Shoes</li></ul>
              <Link to="/products?category=Safety%20Equipment" className="mt-6 inline-block font-medium text-blue-600 hover:underline">View All Safety Gear &rarr;</Link>
            </motion.div>
          </div>
        </div>
      </section>

      <footer id="footer" className="mt-auto bg-black px-6 py-12 text-white sm:px-12 lg:px-24">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div><h4 className="mb-4 text-xl font-bold">ToolKit</h4><p className="text-gray-400">Professional hardware tools and safety equipment for reliable work.</p></div>
          <div><h4 className="mb-4 text-xl font-bold">Quick Links</h4><ul className="space-y-2 text-gray-400"><li><Link to="/products">Shop</Link></li><li><Link to="/login">Login / Register</Link></li></ul></div>
          <div><h4 className="mb-4 text-xl font-bold">Contact Us</h4><p className="text-gray-400">Email: support@toolkit.com</p><p className="text-gray-400">Phone: +1 234 567 8900</p></div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
