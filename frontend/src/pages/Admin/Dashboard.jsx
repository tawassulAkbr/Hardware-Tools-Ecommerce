import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Boxes, CircleDollarSign, PackageCheck, Users } from 'lucide-react';
import { api, getAuth, money } from '../../api';

const emptyProduct = { name: '', description: '', price: '', stock: '', imageUrl: '', categoryId: '' };

const AdminDashboard = () => {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'BUYER' });
  const isSales = getAuth()?.user?.role === 'SALES_PERSON';

  const load = useCallback(async () => {
    try {
      const [p, c, o] = await Promise.all([api('/products'), api('/categories'), api('/admin/orders')]);
      setProducts(p); setCategories(c); setOrders(o);
      if (!isSales) {
        const [d, u, l, m] = await Promise.all([api('/admin/dashboard'), api('/admin/users'), api('/admin/logs'), api('/admin/maintenance')]);
        setStats(d); setUsers(u); setLogs(l); setSettings(m);
      }
    } catch (err) { setError(err.message); }
  }, [isSales]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      await api(editingId ? `/products/${editingId}` : '/products', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setForm(emptyProduct); setEditingId(null); await load();
    } catch (err) { setError(err.message); }
  };
  const edit = (p) => { setEditingId(p.id); setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, imageUrl: p.imageUrl || '', categoryId: p.categoryId }); };
  const remove = async (id) => { if (confirm('Delete product?')) { await api(`/products/${id}`, { method: 'DELETE' }); await load(); } };
  const updateOrder = async (id, patch) => { await api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); await load(); };
  const updateUser = async (id, patch) => { await api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); await load(); };
  const createUser = async (e) => {
    e.preventDefault();
    try { await api('/admin/users', { method: 'POST', body: JSON.stringify(userForm) }); setUserForm({ name: '', email: '', password: '', role: 'BUYER' }); await load(); }
    catch (err) { setError(err.message); }
  };

  const tabs = isSales ? ['inventory', 'orders'] : ['dashboard', 'inventory', 'users', 'orders', 'sales', 'logs', 'maintenance'];
  const childCategories = categories.filter((c) => c.parentId);
  const activeOrders = orders.filter((order) => order.status !== 'CANCELLED');
  const pendingOrders = orders.filter((order) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status));
  const averageOrder = activeOrders.length ? stats?.totalSales / activeOrders.length : 0;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-bold">{isSales ? 'Sales Operations' : 'Admin Dashboard'}</h1>
      {error && <div className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</div>}
      <div className="mt-5 flex flex-wrap gap-2">{tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded px-4 py-2 capitalize ${tab === t ? 'bg-black text-white' : 'bg-white border'}`}>{t}</button>)}</div>

      {tab === 'dashboard' && stats && (
        <section className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card icon={CircleDollarSign} label="Total sales" value={money(stats.totalSales)} detail={`${activeOrders.length} completed orders`} />
            <Card icon={PackageCheck} label="Total orders" value={stats.totalOrders} detail={`${pendingOrders.length} currently active`} />
            <Card icon={Users} label="Customers" value={stats.totalUsers} detail="Registered accounts" />
            <Card icon={Boxes} label="Inventory" value={stats.totalProducts} detail={`${stats.lowStockProducts.length} low-stock items`} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Sales snapshot">
              <div className="mb-5 grid grid-cols-2 gap-3"><div className="bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Average order</p><b className="mt-1 block text-xl">{money(averageOrder)}</b></div><div className="bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Pending work</p><b className="mt-1 block text-xl">{pendingOrders.length}</b></div></div>
              {Object.entries(stats.byPayment || {}).map(([key, value]) => <div key={key} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{key}</span><b>{money(value)}</b></div><div className="h-2 bg-gray-100"><div className="h-2 bg-blue-600" style={{ width: `${Math.min(100, (value / Math.max(1, stats.totalSales)) * 100)}%` }} /></div></div>)}
              {!Object.keys(stats.byPayment || {}).length && <p className="text-sm text-gray-500">Sales will appear here after the first order.</p>}
            </Panel>
            <Panel title="Recent orders">{stats.recentOrders.map((o) => <Row key={o.id} a={`#${o.id} ${o.user?.name || ''}`} b={`${o.status} ${money(o.totalAmount)}`} />)}{!stats.recentOrders.length && <p className="text-sm text-gray-500">No orders yet.</p>}</Panel>
          </div>
          <div className="mt-6"><Panel title="Low-stock watchlist">{stats.lowStockProducts.map((p) => <Row key={p.id} a={p.name} b={`${p.stock} left`} />)}{!stats.lowStockProducts.length && <p className="text-sm text-gray-500">Inventory levels look healthy.</p>}</Panel></div>
        </section>
      )}

      {tab === 'inventory' && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={saveProduct} className="h-fit space-y-3 rounded border bg-white p-5">
            <h2 className="font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            {['name', 'description', 'price', 'stock', 'imageUrl'].map((key) => <input key={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={!['imageUrl'].includes(key)} className="w-full rounded border px-3 py-2" placeholder={key} />)}
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="w-full rounded border px-3 py-2"><option value="">Category</option>{childCategories.map((c) => <option key={c.id} value={c.id}>{c.parent?.name} / {c.name}</option>)}</select>
            <button className="rounded bg-black px-4 py-2 text-white">Save</button>
          </form>
          <Table headers={['Product', 'Category', 'Price', 'Stock', 'Actions']}>{products.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.category?.name}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><button onClick={() => edit(p)} className="mr-2 underline">Edit</button><button onClick={() => remove(p.id)} className="text-red-700 underline">Delete</button></td></tr>)}</Table>
        </section>
      )}

      {tab === 'users' && <>
        <form onSubmit={createUser} className="mt-6 grid gap-3 rounded border bg-white p-5 md:grid-cols-5">
          <input required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="rounded border px-3 py-2" placeholder="Name" />
          <input required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="rounded border px-3 py-2" placeholder="Email" />
          <input required minLength="6" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="rounded border px-3 py-2" placeholder="Temporary password" />
          <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="rounded border px-3 py-2"><option>BUYER</option><option>SALES_PERSON</option><option>ADMIN</option></select>
          <button className="rounded bg-black px-4 py-2 text-white">Create account</button>
        </form>
        <Table headers={['Name', 'Email', 'Role', 'Status']}>{users.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}><option>BUYER</option><option>SALES_PERSON</option><option>ADMIN</option></select></td><td><select value={u.status} onChange={(e) => updateUser(u.id, { status: e.target.value })}><option>ACTIVE</option><option>DISABLED</option></select></td></tr>)}</Table>
      </>}

      {tab === 'orders' && <Table headers={['Order', 'Customer', 'Total', 'Status', 'Tracking', 'Ship date']}>{orders.map((o) => <tr key={o.id}><td>#{o.id}</td><td>{o.user?.name}</td><td>{money(o.totalAmount)}</td><td><select value={o.status} onChange={(e) => updateOrder(o.id, { status: e.target.value })}>{['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => <option key={s}>{s}</option>)}</select></td><td><input defaultValue={o.carrierName || ''} onBlur={(e) => updateOrder(o.id, { carrierName: e.target.value })} className="w-28 rounded border px-2" placeholder="Carrier" /> <input defaultValue={o.trackingNumber || ''} onBlur={(e) => updateOrder(o.id, { trackingNumber: e.target.value })} className="w-32 rounded border px-2" placeholder="Tracking" /></td><td><input type="date" defaultValue={o.shippingDate ? new Date(o.shippingDate).toISOString().slice(0, 10) : ''} onBlur={(e) => updateOrder(o.id, { shippingDate: e.target.value || null })} className="rounded border px-2" /></td></tr>)}</Table>}

      {tab === 'sales' && stats && <Panel title="Sales by Payment">{Object.entries(stats.byPayment || {}).map(([k, v]) => <div key={k} className="mb-3"><div className="mb-1 flex justify-between"><span>{k}</span><b>{money(v)}</b></div><div className="h-3 rounded bg-gray-200"><div className="h-3 rounded bg-black" style={{ width: `${Math.min(100, (v / Math.max(1, stats.totalSales)) * 100)}%` }} /></div></div>)}</Panel>}
      {tab === 'logs' && <Panel title="Execution logs">{logs.map((log) => <Row key={log.id} a={`${log.action} ${log.entity}`} b={new Date(log.createdAt).toLocaleString()} />)}{!logs.length && <p className="text-sm text-gray-500">No logs recorded yet.</p>}</Panel>}
      {tab === 'maintenance' && <Maintenance settings={settings} onSave={async (values) => { await api('/admin/maintenance', { method: 'PATCH', body: JSON.stringify(values) }); await load(); }} />}
    </div>
  );
};

const Card = ({ icon: Icon, label, value, detail }) => <div className="rounded border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-medium text-gray-500">{label}</p>{Icon && <Icon className="h-5 w-5 text-blue-600" />}</div><b className="mt-3 block text-2xl tracking-tight text-gray-900">{value}</b><p className="mt-1 text-xs text-gray-500">{detail}</p></div>;
const Panel = ({ title, children }) => <div className="rounded border border-gray-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-gray-900">{title}</h2><BarChart3 className="h-4 w-4 text-gray-400" /></div>{children}</div>;
const Row = ({ a, b }) => <div className="flex justify-between border-t py-2 text-sm"><span>{a}</span><b>{b}</b></div>;
const Table = ({ headers, children }) => <div className="mt-6 overflow-x-auto rounded border bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-gray-100">{headers.map((h) => <th key={h} className="p-3">{h}</th>)}</thead><tbody className="[&_td]:border-t [&_td]:p-3">{children}</tbody></table></div>;
const Maintenance = ({ settings, onSave }) => { const values = Object.fromEntries(settings.map((item) => [item.key, item.value])); const [form, setForm] = useState({ maintenanceMode: values.maintenanceMode || 'false', announcement: values.announcement || '', shippingFee: values.shippingFee || '299' }); return <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-6 max-w-xl space-y-4 rounded border bg-white p-5"><label className="flex items-center gap-3"><input type="checkbox" checked={form.maintenanceMode === 'true'} onChange={(e) => setForm({ ...form, maintenanceMode: String(e.target.checked) })} /> Maintenance mode</label><label className="block text-sm">Announcement<textarea value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">Shipping fee (PKR)<input value={form.shippingFee} onChange={(e) => setForm({ ...form, shippingFee: e.target.value })} className="mt-1 w-full rounded border p-2" inputMode="decimal" /></label><button className="rounded bg-black px-4 py-2 text-white">Save settings</button></form>; };

export default AdminDashboard;
