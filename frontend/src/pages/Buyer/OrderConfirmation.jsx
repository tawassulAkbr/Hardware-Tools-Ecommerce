import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, Mail, PackageCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, money } from '../../api';

const OrderConfirmation = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(state?.order || null);

  useEffect(() => { if (!order) api(`/orders/${id}`).then(setOrder).catch(() => {}); }, [id, order]);

  if (!order) return <div className="mx-auto max-w-5xl px-6 py-16 text-gray-500">Loading confirmation...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-center gap-3 text-sm"><span className="flex items-center gap-2 text-gray-400"><CheckCircle2 className="h-4 w-4" /> Cart</span><span className="h-px w-10 bg-blue-600" /><span className="flex items-center gap-2 text-gray-400"><CheckCircle2 className="h-4 w-4" /> Checkout</span><span className="h-px w-10 bg-blue-600" /><span className="font-semibold text-blue-600">Confirmation</span></div>
        <section className="overflow-hidden border border-gray-200 bg-white">
          <div className="bg-[#111827] px-6 py-12 text-center text-white sm:px-10"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400 text-[#111827]"><CheckCircle2 className="h-9 w-9" /></div><p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Order placed successfully</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Thanks for your order.</h1><p className="mt-3 text-gray-300">We have your request and will keep you updated as it moves forward.</p></div>
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_280px]">
            <div><div className="flex items-center justify-between border-b border-gray-200 pb-4"><div><p className="text-sm text-gray-500">Order number</p><h2 className="text-xl font-bold">#{order.id}</h2></div><span className="border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{order.status}</span></div><div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="flex gap-3"><PackageCheck className="h-5 w-5 text-blue-600" /><span><b className="block text-sm">Processing</b><small className="text-gray-500">We are preparing it</small></span></div><div className="flex gap-3"><Mail className="h-5 w-5 text-blue-600" /><span><b className="block text-sm">Confirmation</b><small className="text-gray-500">Email delivery attempted</small></span></div><div className="flex gap-3"><ClipboardCheck className="h-5 w-5 text-blue-600" /><span><b className="block text-sm">Payment</b><small className="text-gray-500">{order.paymentMethod}</small></span></div></div><div className="mt-8"><h3 className="mb-3 font-semibold">Items in this order</h3><div className="divide-y border-y border-gray-200">{order.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center bg-gray-50 p-1"><img src={item.product.imageUrl} alt="" className="h-full w-full object-contain" /></div><span className="truncate text-sm">{item.product.name} <span className="text-gray-500">x {item.quantity}</span></span></div><b className="text-sm">{money(item.price * item.quantity)}</b></div>)}</div></div></div>
            <aside className="h-fit bg-gray-50 p-5"><h3 className="font-semibold">Delivery summary</h3><p className="mt-4 text-sm font-medium">{order.customerName}</p><p className="mt-1 text-sm text-gray-500">{order.phone}</p><p className="mt-3 text-sm leading-6 text-gray-500">{order.address}</p><div className="mt-5 border-t border-gray-200 pt-4"><div className="flex justify-between text-sm text-gray-500"><span>Total paid</span><b className="text-lg text-gray-900">{money(order.totalAmount)}</b></div></div></aside>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-gray-200 bg-gray-50 px-6 py-5 sm:px-10"><Link to="/products" className="inline-flex items-center gap-2 bg-black px-5 py-3 text-sm font-semibold text-white">Continue shopping <ArrowRight className="h-4 w-4" /></Link><Link to="/dashboard" className="px-5 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600">View order history</Link></div>
        </section>
      </div>
    </div>
  );
};

export default OrderConfirmation;
