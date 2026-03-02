import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Utility } from '../api/client';
import Modal from '../components/Modal';

export default function UtilitiesPage() {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    provider_name: '', account_number: '', contact_info: '', contract_terms: '', utility_type: '',
  });

  const load = () => api.listUtilities().then(setUtilities);
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ provider_name: '', account_number: '', contact_info: '', contract_terms: '', utility_type: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      provider_name: form.provider_name, utility_type: form.utility_type,
      account_number: form.account_number || null, contact_info: form.contact_info || null,
      contract_terms: form.contract_terms || null,
    };
    if (editId) {
      await api.updateUtility(editId, data);
    } else {
      await api.createUtility(data);
    }
    resetForm();
    load();
  };

  const startEdit = (u: Utility) => {
    setForm({
      provider_name: u.provider_name, utility_type: u.utility_type,
      account_number: u.account_number || '', contact_info: u.contact_info || '',
      contract_terms: u.contract_terms || '',
    });
    setEditId(u.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this utility?')) return;
    await api.deleteUtility(id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Utilities</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          Add Utility
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Utility' : 'Add Utility'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Provider Name" value={form.provider_name}
            onChange={e => setForm({...form, provider_name: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input required placeholder="Type (electric, gas, water...)" value={form.utility_type}
            onChange={e => setForm({...form, utility_type: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Account Number" value={form.account_number}
            onChange={e => setForm({...form, account_number: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Contact Info" value={form.contact_info}
            onChange={e => setForm({...form, contact_info: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <textarea placeholder="Contract Terms" value={form.contract_terms}
            onChange={e => setForm({...form, contract_terms: e.target.value})} className="border rounded px-3 py-2 text-sm col-span-2" rows={2} />
          <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Account #</th>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {utilities.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Link to={`/utilities/${u.id}`} className="text-blue-600 hover:underline">{u.provider_name}</Link></td>
                <td className="px-4 py-3 capitalize">{u.utility_type}</td>
                <td className="px-4 py-3">{u.account_number || '—'}</td>
                <td className="px-4 py-3">{u.contact_info || '—'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(u)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {utilities.length === 0 && <p className="text-gray-500 text-sm p-4">No utilities found.</p>}
      </div>
    </div>
  );
}
