import { useEffect, useState } from 'react';
import { ArrowLeft, Check, CreditCard, LockKeyhole, MapPin, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getAuth, money } from '../../api';

const Checkout = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  useEffect(() => { api('/cart').then(setCart).catch((err) => setError(err.message)); }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
      ['cardName', 'cardNumber', 'cardExpiry', 'cardCvv', 'walletName', 'walletNumber'].forEach((field) => delete payload[field]);
      const order = await api('/orders/checkout', { method: 'POST', body: JSON.stringify({ ...payload, email: auth?.user?.email }) });
      window.dispatchEvent(new Event('cart-change'));
      navigate(`/order-confirmation/${order.id}`, { state: { order } });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (!cart) return <div className="mx-auto max-w-6xl px-6 py-16 text-gray-500">Preparing checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Link to="/cart" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>
        <div className="mb-10 flex flex-col gap-6 border-b border-gray-200 pb-8 md:flex-row md:items-end md:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Final step</p><h1 className="text-4xl font-bold tracking-tight">Complete your order</h1><p className="mt-2 text-gray-500">A few details and your tools will be on their way.</p></div><div className="flex items-center gap-3 text-sm"><span className="flex items-center gap-2 text-gray-400"><Check className="h-4 w-4" /> Cart</span><span className="h-px w-8 bg-blue-600" /><span className="flex items-center gap-2 font-semibold text-blue-600"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">2</span> Checkout</span><span className="h-px w-8 bg-gray-300" /><span className="text-gray-400">Confirmation</span></div></div>
        {error && <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!cart.items.length ? <div className="border border-gray-200 bg-white p-12 text-center"><p className="font-semibold">Your cart is empty.</p><Link to="/products" className="mt-4 inline-block text-blue-600 underline">Return to products</Link></div> : <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={submit} className="border border-gray-200 bg-white p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-600"><MapPin className="h-5 w-5" /></div><div><h2 className="text-xl font-semibold">Delivery details</h2><p className="text-sm text-gray-500">Where should we send your order?</p></div></div>
            <div className="grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Full name</span><span className="relative block"><UserRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input name="customerName" defaultValue={auth?.user?.name || ''} required className="w-full border border-gray-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-blue-500" placeholder="Your full name" /></span></label><label><span className="mb-2 block text-sm font-medium">Phone number</span><input name="phone" defaultValue={auth?.user?.phone || ''} required className="w-full border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500" placeholder="03xx xxxxxxx" /></label><label><span className="mb-2 block text-sm font-medium">Payment method</span><span className="relative block"><CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><select name="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full appearance-none border border-gray-300 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-blue-500"><option value="COD">Cash on Delivery</option><option value="CARD">Card</option><option value="JAZZCASH">JazzCash</option><option value="EASYPAISA">Easypaisa</option></select></span></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Delivery address</span><textarea name="address" defaultValue={auth?.user?.address || ''} required className="min-h-32 w-full resize-y border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500" placeholder="Street, area, city" /></label></div>
            {paymentMethod === 'CARD' && <div className="mt-6 border border-blue-100 bg-blue-50/50 p-5"><p className="mb-4 text-sm font-semibold text-gray-900">Card details <span className="font-normal text-gray-500">(demo checkout, no charge is made)</span></p><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium text-gray-600">Name on card</span><input name="cardName" required autoComplete="cc-name" className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Cardholder name" /></label><label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium text-gray-600">Card number</span><input name="cardNumber" required inputMode="numeric" autoComplete="cc-number" pattern="[0-9 ]{12,19}" className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500" placeholder="0000 0000 0000 0000" /></label><label><span className="mb-1 block text-xs font-medium text-gray-600">Expiry</span><input name="cardExpiry" required autoComplete="cc-exp" className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500" placeholder="MM/YY" /></label><label><span className="mb-1 block text-xs font-medium text-gray-600">CVV</span><input name="cardCvv" required type="password" inputMode="numeric" autoComplete="cc-csc" maxLength="4" className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500" placeholder="123" /></label></div></div>}
            {(paymentMethod === 'JAZZCASH' || paymentMethod === 'EASYPAISA') && <div className="mt-6 border border-green-100 bg-green-50/60 p-5"><p className="mb-4 text-sm font-semibold text-gray-900">{paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa'} details <span className="font-normal text-gray-500">(demo checkout)</span></p><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-medium text-gray-600">Account name</span><input name="walletName" required className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Account holder" /></label><label><span className="mb-1 block text-xs font-medium text-gray-600">Mobile account number</span><input name="walletNumber" required inputMode="tel" pattern="[0-9+ -]{10,16}" className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500" placeholder="03xx xxxxxxx" /></label></div></div>}
            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6"><p className="flex items-center gap-2 text-xs text-gray-500"><LockKeyhole className="h-4 w-4 text-blue-600" /> Your details are handled securely.</p><button disabled={loading} className="inline-flex items-center gap-2 bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:bg-gray-400">{loading ? 'Placing order...' : 'Place order'} <Check className="h-4 w-4" /></button></div>
          </form>
          <aside className="h-fit border border-gray-200 bg-white p-6 lg:sticky lg:top-24"><h2 className="text-xl font-semibold">Your order</h2><div className="mt-5 space-y-4">{cart.items.map((item) => <div key={item.id} className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center bg-gray-50 p-1"><img src={item.product.imageUrl} alt="" className="h-full w-full object-contain" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.product.name}</p><p className="text-xs text-gray-500">Qty {item.quantity}</p></div><b className="text-sm">{money(item.product.price * item.quantity)}</b></div>)}</div><div className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm"><div className="flex justify-between"><span className="text-gray-500">Subtotal</span><b>{money(cart.subtotal)}</b></div><div className="flex justify-between"><span className="text-gray-500">Shipping</span><b>{money(cart.shippingFee)}</b></div><div className="flex justify-between pt-2 text-xl"><span>Total</span><b>{money(cart.total)}</b></div></div></aside>
        </div>}
      </div>
    </div>
  );
};

export default Checkout;
