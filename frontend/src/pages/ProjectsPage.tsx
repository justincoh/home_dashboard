import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Project } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import Modal from '../components/Modal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter] = useState('');
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
    planned: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 rounded-full',
    in_progress: 'bg-accent-50 text-accent-800 ring-1 ring-inset ring-accent-200 rounded-full',
    done: 'bg-sage-50 text-sage-800 ring-1 ring-inset ring-sage-200 rounded-full',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-warm-900">Projects</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-accent-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-accent-600 text-sm">
          Add Project
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Project['status']})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50">
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <input placeholder="Budget" type="number" step="0.01" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="Actual Cost" type="number" step="0.01" value={form.actual_cost} onChange={e => setForm({...form, actual_cost: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="Start Date" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="End Date" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400 col-span-2" rows={2} />
          <button type="submit" className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
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

      <div className="mb-4 text-sm text-warm-600">
        Total Spent: <span className="font-semibold text-warm-800">{fmt$(projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0))}</span>
      </div>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Budget</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Actual Cost</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Dates</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4"><Link to={`/projects/${p.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{p.name}</Link></td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>{p.status.replace('_', ' ')}</span>
                </td>
                <td className="px-5 py-4">{p.budget ? fmt$(p.budget) : '—'}</td>
                <td className="px-5 py-4">{p.actual_cost ? fmt$(p.actual_cost) : '—'}</td>
                <td className="px-5 py-4 text-xs text-warm-600">
                  {p.start_date && parseLocalDate(p.start_date).toLocaleDateString()}
                  {p.start_date && p.end_date && ' — '}
                  {p.end_date && parseLocalDate(p.end_date).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(p)} className="text-accent-700 hover:text-accent-900 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No projects found.</p>}
      </div>
    </div>
  );
}
