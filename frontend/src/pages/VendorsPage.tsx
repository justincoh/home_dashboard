import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Vendor } from '../api/client';
import Modal from '../components/Modal';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', service_type: '' });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => api.listVendors().then(setVendors);
  useEffect(() => { load(); }, []);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.service_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, phone: form.phone || null, email: form.email || null };
    if (editId) {
      await api.updateVendor(editId, data);
    } else {
      await api.createVendor(data);
    }
    setForm({ name: '', phone: '', email: '', service_type: '' });
    setShowForm(false);
    setEditId(null);
    load();
  };

  const startEdit = (v: Vendor) => {
    setForm({ name: v.name, phone: v.phone || '', email: v.email || '', service_type: v.service_type });
    setEditId(v.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this vendor?')) return;
    await api.deleteVendor(id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-warm-900">Vendors</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', phone: '', email: '', service_type: '' }); }}
          className="bg-accent-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-accent-600 text-sm">
          Add Vendor
        </button>
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="Service Type" required value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <button type="submit" className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
        className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400 mb-4 w-full" />

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Service Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {filtered.map(v => (
              <tr key={v.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4"><Link to={`/vendors/${v.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{v.name}</Link></td>
                <td className="px-5 py-4">{v.service_type}</td>
                <td className="px-5 py-4">{v.phone || '—'}</td>
                <td className="px-5 py-4">{v.email || '—'}</td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(v)} className="text-accent-700 hover:text-accent-900 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No vendors found.</p>}
      </div>
    </div>
  );
}
