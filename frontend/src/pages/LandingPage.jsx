import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Mail, MapPin, Phone, ShieldCheck, Star, Truck } from 'lucide-react';
import { fallbackProducts, saleDiscount } from '../data/catalog';
import { money } from '../api';

const heroImages = ['/images/H1.png', '/images/H2.png', '/images/H3.png'];
const toolSubcategories = [
  { name: 'Hand Tools', description: 'Reliable tools for grip, cutting, and everyday work.' },
  { name: 'Soft Tools', description: 'Protective tools for careful handling and finishing.' },
];
const customerReviews = [
  { name: 'Hamza R.', city: 'Lahore', role: 'Workshop owner', quote: 'The drill set arrived quickly and feels built for daily workshop use.' },
  { name: 'Ayesha K.', city: 'Karachi', role: 'Site engineer', quote: 'Clear product details, dependable safety gear, and smooth checkout.' },
  { name: 'Bilal M.', city: 'Islamabad', role: 'Contractor', quote: 'ToolKit has become my first stop when I need reliable equipment.' },
  { name: 'Sana F.', city: 'Faisalabad', role: 'Maker', quote: 'The hand tools are practical, well-priced, and delivered as promised.' },
];
const featuredHandTools = fallbackProducts.filter((product) => product.category.name === 'Hand Tools').slice(0, 8);
const featuredSafety = fallbackProducts.filter((product) => product.category.parent?.name === 'Safety Equipment').slice(0, 8);
const saleProducts = fallbackProducts.slice(0, 10).map((product) => ({
  ...product,
  discount: saleDiscount(product),
}));

const FeaturedProductImage = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const animationUrl = product.animationUrl && /b\.(png|jpe?g|webp)$/i.test(product.animationUrl) ? product.animationUrl : null;

  useEffect(() => {
    if (!isHovered || !animationUrl) return undefined;
    const timer = window.setInterval(() => setShowAnimation((visible) => !visible), 1600);
    return () => window.clearInterval(timer);
  }, [isHovered, animationUrl]);

  if (!animationUrl) return <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />;

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

      <section className="overflow-hidden border-y border-gray-200 bg-white py-16 text-gray-900">
        <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Limited-time offers</p><h2 className="mt-2 text-3xl font-bold">Workshop picks on sale</h2></div><span className="text-sm text-gray-500">Up to 15% off selected products</span></div>
        </div>
        <div className="sales-reel mt-8" aria-label="Products on sale">
          <div className="sales-reel__track">
            {[...saleProducts, ...saleProducts].map((product, index) => <Link key={`${product.id}-${index}`} to={`/products?search=${encodeURIComponent(product.name)}&sale=1`} className="sales-reel__item"><div className="relative flex h-36 items-center justify-center bg-gray-100 p-4"><img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" /><span className="absolute left-2 top-2 bg-blue-600 px-2 py-1 text-xs font-bold text-white">-{product.discount}%</span></div><div className="p-4"><p className="truncate text-sm font-semibold text-gray-900">{product.name}</p><div className="mt-2 flex items-center gap-2"><span className="text-sm font-bold text-blue-600">{money(product.price * (1 - product.discount / 100))}</span><span className="text-xs text-gray-500 line-through">{money(product.price)}</span></div></div></Link>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Featured collection</p><h2 className="text-3xl font-bold">Tools ready for the job</h2></div>
            <Link to="/products?category=Tools" className="font-semibold text-blue-600 hover:underline">Browse all tools &rarr;</Link>
          </div>
          <h3 className="mb-5 text-xl font-semibold text-gray-900">Hand tools</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredHandTools.map((product) => <Link key={product.id} to={`/products?category=${encodeURIComponent(product.category.parent?.name || 'Tools')}&subcategory=${encodeURIComponent(product.category.name)}`} className="group overflow-hidden border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-44 items-center justify-center bg-gray-50 p-4"><FeaturedProductImage product={product} /></div>
              <div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{product.category.name}</p><h3 className="mt-1 font-semibold text-gray-900">{product.name}</h3><p className="mt-2 font-bold text-blue-600">{money(product.price)}</p></div>
            </Link>)}
          </div>
          <h3 className="mb-5 mt-12 text-xl font-semibold text-gray-900">Safety equipment</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredSafety.map((product) => <Link key={product.id} to={`/products?category=${encodeURIComponent(product.category.parent?.name || 'Safety Equipment')}&subcategory=${encodeURIComponent(product.category.name)}`} className="group overflow-hidden border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-44 items-center justify-center bg-gray-50 p-4"><FeaturedProductImage product={product} /></div>
              <div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{product.category.name}</p><h3 className="mt-1 font-semibold text-gray-900">{product.name}</h3><p className="mt-2 font-bold text-blue-600">{money(product.price)}</p></div>
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

      <section className="overflow-hidden border-y border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-24">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Trusted across Pakistan</p><h2 className="text-3xl font-bold tracking-tight text-gray-900">Good tools. Good word.</h2></div>
            <div className="flex items-center gap-3"><span className="text-3xl font-bold text-gray-900">4.9</span><span><span className="flex text-amber-400" aria-label="4.9 out of 5 stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}</span><span className="mt-1 block text-xs text-gray-500">Based on 2,400+ reviews</span></span></div>
          </div>
        </div>
        <div className="reviews-reel mt-10" aria-label="Customer reviews">
          <div className="reviews-reel__track">
            {[...customerReviews, ...customerReviews].map((review, index) => <article key={`${review.name}-${index}`} className="reviews-reel__item"><div className="flex items-center justify-between gap-4"><span className="flex text-amber-400" aria-label="5 out of 5 stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}</span><span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Verified buyer</span></div><p className="mt-5 text-base leading-7 text-gray-700">“{review.quote}”</p><div className="mt-6 border-t border-gray-200 pt-4"><p className="font-semibold text-gray-900">{review.name}</p><p className="text-sm text-gray-500">{review.role} · {review.city}</p></div></article>)}
          </div>
        </div>
      </section>

      <footer id="footer" className="mt-auto bg-[#111827] px-6 py-14 text-white sm:px-12 lg:px-24">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr]">
          <div><p className="text-2xl font-bold tracking-tight">ToolKit<span className="text-blue-400">.</span></p><p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">Professional hardware tools and safety equipment for reliable work across Pakistan.</p><div className="mt-6 flex gap-2"><span className="h-2 w-2 bg-blue-400" /><span className="h-2 w-2 bg-blue-400/60" /><span className="h-2 w-2 bg-blue-400/30" /></div></div>
          <div><h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gray-300">Shop</h4><ul className="space-y-3 text-sm text-gray-400"><li><Link className="hover:text-white" to="/products?category=Tools">Tools</Link></li><li><Link className="hover:text-white" to="/products?category=Safety%20Equipment">Safety Equipment</Link></li><li><Link className="hover:text-white" to="/products">All products</Link></li></ul></div>
          <div><h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gray-300">Account</h4><ul className="space-y-3 text-sm text-gray-400"><li><Link className="hover:text-white" to="/login">Login / Register</Link></li><li><Link className="hover:text-white" to="/cart">Shopping cart</Link></li><li><Link className="hover:text-white" to="/dashboard">Order tracking</Link></li></ul></div>
          <div><Link to="/contact" className="mb-4 inline-block text-sm font-semibold uppercase tracking-[0.16em] text-gray-300 hover:text-white">Contact Us</Link><ul className="space-y-3 text-sm text-gray-400"><li className="flex items-center gap-3"><Mail className="h-4 w-4 text-blue-400" />support@toolkit.com</li><li className="flex items-center gap-3"><Phone className="h-4 w-4 text-blue-400" />+92 300 123 4567</li><li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-blue-400" />Lahore, Pakistan</li></ul></div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-gray-700 pt-6 text-xs text-gray-500 sm:flex-row sm:justify-between"><span>© 2026 ToolKit. All rights reserved.</span><span>Built for better work.</span></div>
      </footer>
    </div>
  );
};

export default LandingPage;
