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
        <h1 className="text-2xl font-bold">Vendors</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', phone: '', email: '', service_type: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          Add Vendor
        </button>
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Service Type" required value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
        className="border rounded px-3 py-2 text-sm mb-4 w-full" />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Service Type</th>
              <th className="text-left px-4 py-3 font-medium">Phone</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Link to={`/vendors/${v.id}`} className="text-blue-600 hover:underline">{v.name}</Link></td>
                <td className="px-4 py-3">{v.service_type}</td>
                <td className="px-4 py-3">{v.phone || '—'}</td>
                <td className="px-4 py-3">{v.email || '—'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(v)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-sm p-4">No vendors found.</p>}
      </div>
    </div>
  );
}
