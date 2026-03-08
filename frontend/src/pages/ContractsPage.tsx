import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Contract, Vendor } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import Modal from '../components/Modal';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'contract' as Contract['type'], vendor_id: '',
    start_date: '', end_date: '', cost: '', payment_terms: '', notes: '',
  });

  const load = () => {
    api.listContracts().then(setContracts);
    api.listVendors().then(setVendors);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', type: 'contract', vendor_id: '', start_date: '', end_date: '', cost: '', payment_terms: '', notes: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, type: form.type,
      vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
      start_date: form.start_date, end_date: form.end_date || null,
      cost: form.cost ? Number(form.cost) : null,
      payment_terms: form.payment_terms || null, notes: form.notes || null,
    };
    if (editId) {
      await api.updateContract(editId, data);
    } else {
      await api.createContract(data);
    }
    resetForm();
    load();
  };

  const startEdit = (c: Contract) => {
    setForm({
      name: c.name, type: c.type, vendor_id: c.vendor_id ? String(c.vendor_id) : '',
      start_date: c.start_date, end_date: c.end_date || '', cost: c.cost ? String(c.cost) : '',
      payment_terms: c.payment_terms || '', notes: c.notes || '',
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this contract?')) return;
    await api.deleteContract(id);
    load();
  };

  const sorted = [...contracts].sort((a, b) => {
    if (!a.end_date) return 1;
    if (!b.end_date) return -1;
    return parseLocalDate(a.end_date).getTime() - parseLocalDate(b.end_date).getTime();
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-holo-50">Contracts & Warranties</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-neon-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-neon-500 text-sm glow-neon">
          Add Contract
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Contract' : 'Add Contract'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value as Contract['type']})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500">
            <option value="contract">Contract</option>
            <option value="warranty">Warranty</option>
          </select>
          <select value={form.vendor_id} onChange={e => setForm({...form, vendor_id: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500">
            <option value="">No Vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input placeholder="Cost" type="number" step="0.01" value={form.cost}
            onChange={e => setForm({...form, cost: e.target.value})} className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <input required type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500" />
          <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500" />
          <input placeholder="Payment Terms" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" rows={2} />
          <button type="submit" className="col-span-2 bg-cyber-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-cyber-500 text-sm glow-cyber">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="bg-void-400 rounded-xl border border-void-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-void-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Vendor</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">End Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Cost</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-void-200">
            {sorted.map(c => (
              <tr key={c.id} className="hover:bg-void-50 transition-colors">
                <td className="px-5 py-4"><Link to={`/contracts/${c.id}`} className="text-neon-400 hover:text-neon-300 font-medium transition-colors">{c.name}</Link></td>
                <td className="px-5 py-4 capitalize">{c.type}</td>
                <td className="px-5 py-4">{c.vendor ? <Link to={`/vendors/${c.vendor.id}`} className="text-neon-400 hover:text-neon-300 font-medium transition-colors">{c.vendor.name}</Link> : '—'}</td>
                <td className="px-5 py-4">{c.end_date ? parseLocalDate(c.end_date).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-4">{c.cost ? fmt$(c.cost) : '—'}</td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(c)} className="text-cyber-400 hover:text-cyber-300 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contracts.length === 0 && <p className="text-holo-600 text-sm italic p-8 text-center">No contracts found.</p>}
      </div>
    </div>
  );
}
