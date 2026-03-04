import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Project } from '../api/client';
import Modal from '../components/Modal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', status: 'planned' as Project['status'],
    budget: '', actual_cost: '', start_date: '', end_date: '',
  });

  const load = () => api.listProjects(filter || undefined).then(setProjects);
  useEffect(() => { load(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description || null,
      status: form.status,
      budget: form.budget ? Number(form.budget) : null,
      actual_cost: form.actual_cost ? Number(form.actual_cost) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    if (editId) {
      await api.updateProject(editId, data);
    } else {
      await api.createProject(data);
    }
    resetForm();
    load();
  };

  const resetForm = () => {
    setForm({ name: '', description: '', status: 'planned', budget: '', actual_cost: '', start_date: '', end_date: '' });
    setShowForm(false);
    setEditId(null);
  };

  const startEdit = (p: Project) => {
    setForm({
      name: p.name, description: p.description || '', status: p.status,
      budget: p.budget?.toString() || '', actual_cost: p.actual_cost?.toString() || '',
      start_date: p.start_date || '', end_date: p.end_date || '',
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project?')) return;
    await api.deleteProject(id);
    load();
  };

  const statusColors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          Add Project
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Project['status']})}
            className="border rounded px-3 py-2 text-sm">
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <input placeholder="Budget" type="number" step="0.01" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Actual Cost" type="number" step="0.01" value={form.actual_cost} onChange={e => setForm({...form, actual_cost: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Start Date" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="End Date" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="border rounded px-3 py-2 text-sm col-span-2" rows={2} />
          <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      {/* <div className="flex gap-2 mb-4">
        {['', 'planned', 'in_progress', 'done'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded text-sm ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div> */}

      <div className="mb-4 text-sm text-gray-700">
        Total Spent: <span className="font-semibold">{fmt$(projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0))}</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Budget</th>
              <th className="text-left px-4 py-3 font-medium">Actual Cost</th>
              <th className="text-left px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link></td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status]}`}>{p.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3">{p.budget ? fmt$(p.budget) : '—'}</td>
                <td className="px-4 py-3">{p.actual_cost ? fmt$(p.actual_cost) : '—'}</td>
                <td className="px-4 py-3 text-xs">
                  {p.start_date && new Date(p.start_date).toLocaleDateString()}
                  {p.start_date && p.end_date && ' — '}
                  {p.end_date && new Date(p.end_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && <p className="text-gray-500 text-sm p-4">No projects found.</p>}
      </div>
    </div>
  );
}
