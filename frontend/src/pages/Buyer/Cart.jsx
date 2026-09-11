import { useEffect, useState } from 'react';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, money } from '../../api';
import { catalogueNameFor } from '../../data/catalog';
import PageLoader from '../../components/PageLoader';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/cart').then(setCart).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const update = async (id, quantity) => {
    if (quantity < 1) return;
    try { setCart(await api(`/cart/items/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) })); window.dispatchEvent(new Event('cart-change')); } catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    try { setCart(await api(`/cart/items/${id}`, { method: 'DELETE' })); window.dispatchEvent(new Event('cart-change')); } catch (err) { setError(err.message); }
  };

  if (!cart) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Your selection</p><h1 className="text-4xl font-bold tracking-tight text-gray-900">Shopping cart</h1><p className="mt-2 text-gray-500">Review your tools before you take them to checkout.</p></div>
          <Link to="/products" className="inline-flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600">Continue shopping <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {error && <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!cart.items.length ? (
          <div className="border border-dashed border-gray-300 bg-white px-6 py-20 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-gray-300" /><h2 className="mt-5 text-xl font-semibold">Your cart is waiting</h2><p className="mt-2 text-gray-500">Add a tool or safety essential to get started.</p><Link className="mt-6 inline-flex rounded bg-black px-6 py-3 font-semibold text-white" to="/products">Explore products</Link></div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              {cart.items.map((item) => <article key={item.id} className="flex flex-col gap-5 border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-gray-50 p-3"><img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-contain" /></div>
                <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.product.category?.name || 'Tool'}</p><h2 className="mt-1 text-lg font-semibold text-gray-900">{catalogueNameFor(item.product)}</h2><p className="mt-1 text-sm text-gray-500">{money(item.product.price)} each</p></div>
                <div className="flex items-center justify-between gap-5 sm:justify-end"><div className="flex items-center border border-gray-200"><button type="button" aria-label={`Decrease ${item.product.name}`} className="p-2 text-gray-500 hover:bg-gray-50" onClick={() => update(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></button><span className="w-8 text-center text-sm font-semibold">{item.quantity}</span><button type="button" aria-label={`Increase ${item.product.name}`} className="p-2 text-gray-500 hover:bg-gray-50" onClick={() => update(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></button></div><b className="w-20 text-right">{money(item.product.price * item.quantity)}</b><button type="button" aria-label={`Remove ${item.product.name}`} className="p-2 text-gray-400 hover:text-red-600" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></button></div>
              </article>)}
            </div>
            <aside className="h-fit border border-gray-200 bg-white p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-semibold">Order summary</h2><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-500">Subtotal</span><b>{money(cart.subtotal)}</b></div><div className="flex justify-between"><span className="text-gray-500">Shipping</span><b>{money(cart.shippingFee)}</b></div></div><div className="mt-5 flex justify-between border-t border-gray-200 pt-5 text-xl"><span>Total</span><b>{money(cart.total)}</b></div>
              <Link to="/checkout" className="mt-6 flex items-center justify-center gap-2 bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500">Proceed to checkout <ArrowRight className="h-4 w-4" /></Link>
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-xs text-gray-500"><p className="flex items-center gap-2"><Truck className="h-4 w-4 text-blue-600" /> Reliable delivery updates</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" /> Secure checkout process</p></div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
