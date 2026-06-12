import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Category } from '../api/client';
import Modal from '../components/Modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => api.listCategories().then(setCategories);
  useEffect(() => { load(); }, []);

  const reset = () => { setName(''); setEditId(null); setShowForm(false); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editId) await api.updateCategory(editId, name.trim());
      else await api.createCategory(name.trim());
      reset();
      load();
    } catch {
      setError('That name is already taken.');
    }
  };

  const startEdit = (c: Category) => { setName(c.name); setEditId(c.id); setError(null); setShowForm(true); };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Log entries using it will become uncategorized.')) return;
    await api.deleteCategory(id);
    load();
  };

  const inputCls = 'border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-warm-900">Categories</h1>
        <button onClick={() => { reset(); setShowForm(true); }}
          className="bg-accent-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-accent-600 text-sm">
          Add Category
        </button>
      </div>

      <Modal open={showForm} onClose={reset} title={editId ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required autoFocus placeholder="Name" value={name} onChange={e => setName(e.target.value)} className={`${inputCls} w-full`} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4 font-medium text-warm-800">{c.name}</td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(c)} className="text-accent-700 hover:text-accent-900 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No categories yet.</p>}
      </div>
    </div>
  );
}
