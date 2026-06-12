import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Provider } from '../api/client';
import Modal from '../components/Modal';

const emptyForm = () => ({
  name: '', service_type: '', phone: '', email: '',
  account_number: '', contract_terms: '', notes: '',
});

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());

  const load = () => api.listProviders().then(setProviders);
  useEffect(() => { load(); }, []);

  const filtered = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.service_type.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, service_type: form.service_type,
      phone: form.phone || null, email: form.email || null,
      account_number: form.account_number || null,
      contract_terms: form.contract_terms || null,
      notes: form.notes || null,
    };
    if (editId) await api.updateProvider(editId, data);
    else await api.createProvider(data);
    resetForm();
    load();
  };

  const startEdit = (p: Provider) => {
    setForm({
      name: p.name, service_type: p.service_type, phone: p.phone || '', email: p.email || '',
      account_number: p.account_number || '', contract_terms: p.contract_terms || '', notes: p.notes || '',
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this provider? Its log entries are kept but detached.')) return;
    await api.deleteProvider(id);
    load();
  };

  const inputCls = 'border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-warm-900">Providers</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-accent-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-accent-600 text-sm">
          Add Provider
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Provider' : 'Add Provider'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
          <input required placeholder="Type (electric, lawn care…)" value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })} className={inputCls} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
          <input placeholder="Account number" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className={`${inputCls} col-span-2`} />
          <textarea placeholder="Contract terms" value={form.contract_terms} onChange={e => setForm({ ...form, contract_terms: e.target.value })} className={`${inputCls} col-span-2`} rows={2} />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${inputCls} col-span-2`} rows={2} />
          <button type="submit" className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <input placeholder="Search providers..." value={search} onChange={e => setSearch(e.target.value)}
        className={`${inputCls} mb-4 w-full`} />

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Account #</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Phone</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4"><Link to={`/providers/${p.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{p.name}</Link></td>
                <td className="px-5 py-4">{p.service_type}</td>
                <td className="px-5 py-4">{p.account_number || '—'}</td>
                <td className="px-5 py-4">{p.phone || '—'}</td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(p)} className="text-accent-700 hover:text-accent-900 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No providers found.</p>}
      </div>
    </div>
  );
}
