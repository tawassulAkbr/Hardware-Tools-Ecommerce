import { useEffect, useState } from 'react';
import { api, getAuth, money } from '../../api';

const Dashboard = () => {
  const auth = getAuth();
  const [orders, setOrders] = useState([]);
  const [trackId, setTrackId] = useState('');
  const [tracked, setTracked] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ name: auth?.user?.name || '', phone: auth?.user?.phone || '', address: auth?.user?.address || '' });
  const [saved, setSaved] = useState('');

  useEffect(() => { api('/orders/mine').then(setOrders).catch((err) => setError(err.message)); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api(`/orders/mine/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders(await api('/orders/mine'));
    } catch (err) { setError(err.message); }
  };

  const track = async (e) => {
    e.preventDefault(); setTrackError(''); setTracked(null);
    try { setTracked(await api(`/orders/track/${trackId.trim().toUpperCase()}`)); } catch (err) { setTrackError(err.message); }
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setSaved(''); setError('');
    try {
      const result = await api('/auth/me', { method: 'PATCH', body: JSON.stringify(profile) });
      const next = { ...getAuth(), user: result.user }; localStorage.setItem('toolkit_auth', JSON.stringify(next));
      window.dispatchEvent(new Event('auth-change')); setSaved('Profile updated.');
    } catch (err) { setError(err.message); }
  };

  const deleteProfile = async () => {
    if (!confirm('Deactivate your account?')) return;
    await api('/auth/me', { method: 'DELETE' }); localStorage.removeItem('toolkit_auth'); window.location.href = '/';
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
      <p className="mt-1 text-gray-600">{auth?.user?.name} - {auth?.user?.email}</p>
      {error && <div className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</div>}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded border bg-white p-5"><p className="text-sm text-gray-500">Total Orders</p><b className="text-2xl">{orders.length}</b></div>
        <form onSubmit={track} className="rounded border bg-white p-5 md:col-span-2">
          <label className="text-sm text-gray-600">Track by Order ID</label>
          <div className="mt-2 flex gap-2"><input value={trackId} onChange={(e) => setTrackId(e.target.value)} className="flex-1 rounded border px-3 py-2" placeholder="9-character ID" /><button className="rounded bg-black px-4 text-white">Track</button></div>
          {trackError && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{trackError}</p>}
          {tracked && <p className="mt-3 rounded bg-emerald-50 p-2 text-sm text-emerald-800">Status: <b>{tracked.status}</b> Carrier: {tracked.carrierName || 'Pending'} Tracking: {tracked.trackingNumber || 'Pending'}</p>}
        </form>
      </div>
      <form onSubmit={saveProfile} className="mt-8 rounded border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Customer profile</h2><p className="text-sm text-gray-500">Keep delivery details ready for your next order.</p></div>{saved && <span className="text-sm text-emerald-600">{saved}</span>}</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3"><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="rounded border px-3 py-2" placeholder="Name" required /><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="rounded border px-3 py-2" placeholder="Contact" required /><input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="rounded border px-3 py-2" placeholder="Address" required /></div>
        <div className="mt-4 flex gap-3"><button className="rounded bg-black px-4 py-2 text-sm font-semibold text-white">Save profile</button><button type="button" onClick={deleteProfile} className="rounded border border-red-200 px-4 py-2 text-sm text-red-700">Deactivate account</button></div>
      </form>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Order History</h2>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded border bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div><b>#{order.id}</b><p className="text-sm text-gray-600">{order.status} - {money(order.totalAmount)} - {order.paymentMethod}</p></div>
              <div className="flex gap-2">
                {['PENDING', 'CONFIRMED'].includes(order.status) && <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="rounded border px-3 py-2 text-sm">Cancel</button>}
                {order.status === 'DELIVERED' && <button onClick={() => updateStatus(order.id, 'RETURN_REQUESTED')} className="rounded border px-3 py-2 text-sm">Request Return</button>}
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">{order.items.map((i) => `${i.product.name} x ${i.quantity}`).join(', ')}</div>
          </div>
        ))}
        {!orders.length && <div className="rounded bg-white p-6 text-gray-600">No orders yet.</div>}
      </div>
    </div>
  );
};

export default Dashboard;
