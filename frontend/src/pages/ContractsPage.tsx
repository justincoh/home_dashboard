import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Contract, Vendor } from '../api/client';
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
    return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Contracts & Warranties</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          Add Contract
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Contract' : 'Add Contract'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value as Contract['type']})}
            className="border rounded px-3 py-2 text-sm">
            <option value="contract">Contract</option>
            <option value="warranty">Warranty</option>
          </select>
          <select value={form.vendor_id} onChange={e => setForm({...form, vendor_id: e.target.value})}
            className="border rounded px-3 py-2 text-sm">
            <option value="">No Vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input placeholder="Cost" type="number" step="0.01" value={form.cost}
            onChange={e => setForm({...form, cost: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input required type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Payment Terms" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            className="border rounded px-3 py-2 text-sm" rows={2} />
          <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Vendor</th>
              <th className="text-left px-4 py-3 font-medium">End Date</th>
              <th className="text-left px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Link to={`/contracts/${c.id}`} className="text-blue-600 hover:underline">{c.name}</Link></td>
                <td className="px-4 py-3 capitalize">{c.type}</td>
                <td className="px-4 py-3">{c.vendor ? <Link to={`/vendors/${c.vendor.id}`} className="text-blue-600 hover:underline">{c.vendor.name}</Link> : '—'}</td>
                <td className="px-4 py-3">{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">{c.cost ? `$${c.cost.toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contracts.length === 0 && <p className="text-gray-500 text-sm p-4">No contracts found.</p>}
      </div>
    </div>
  );
}
