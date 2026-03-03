import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Quote, Vendor, Project } from '../api/client';
import Modal from '../components/Modal';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ vendor_id: '', project_id: '', amount: '', date_received: '' });

  const load = () => {
    api.listQuotes().then(setQuotes);
    api.listVendors().then(setVendors);
    api.listProjects().then(setProjects);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ vendor_id: '', project_id: '', amount: '', date_received: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      vendor_id: Number(form.vendor_id),
      project_id: form.project_id ? Number(form.project_id) : null,
      amount: Number(form.amount),
      date_received: form.date_received,
    };
    if (editId) {
      await api.updateQuote(editId, data);
    } else {
      await api.createQuote(data);
    }
    resetForm();
    load();
  };

  const startEdit = (q: Quote) => {
    setForm({
      vendor_id: String(q.vendor_id), project_id: q.project_id ? String(q.project_id) : '',
      amount: String(q.amount), date_received: q.date_received,
    });
    setEditId(q.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this quote?')) return;
    await api.deleteQuote(id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          Add Quote
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Quote' : 'Add Quote'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <select required value={form.vendor_id} onChange={e => setForm({...form, vendor_id: e.target.value})}
            className="border rounded px-3 py-2 text-sm">
            <option value="">Select Vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}
            className="border rounded px-3 py-2 text-sm">
            <option value="">No Project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input required placeholder="Amount" type="number" step="0.01" value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input required type="date" value={form.date_received} onChange={e => setForm({...form, date_received: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Vendor</th>
              <th className="text-left px-4 py-3 font-medium">Project</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quotes.map(q => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium"><Link to={`/quotes/${q.id}`} className="text-blue-600 hover:underline">${q.amount.toFixed(2)}</Link></td>
                <td className="px-4 py-3">{q.vendor ? <Link to={`/vendors/${q.vendor.id}`} className="text-blue-600 hover:underline">{q.vendor.name}</Link> : '—'}</td>
                <td className="px-4 py-3">{q.project ? <Link to={`/projects/${q.project.id}`} className="text-blue-600 hover:underline">{q.project.name}</Link> : '—'}</td>
                <td className="px-4 py-3">{new Date(q.date_received).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(q)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quotes.length === 0 && <p className="text-gray-500 text-sm p-4">No quotes found.</p>}
      </div>
    </div>
  );
}
