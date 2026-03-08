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
    planned: 'bg-cyber-800/30 text-cyber-300 ring-1 ring-inset ring-cyber-700 rounded-full',
    in_progress: 'bg-neon-900/30 text-neon-300 ring-1 ring-inset ring-neon-700 rounded-full',
    done: 'bg-matrix-800/30 text-matrix-200 ring-1 ring-inset ring-matrix-700 rounded-full',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-holo-50">Projects</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-neon-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-neon-500 text-sm glow-neon">
          Add Project
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Project['status']})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500">
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <input placeholder="Budget" type="number" step="0.01" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <input placeholder="Actual Cost" type="number" step="0.01" value={form.actual_cost} onChange={e => setForm({...form, actual_cost: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <input placeholder="Start Date" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <input placeholder="End Date" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="border border-void-200 rounded-lg px-3.5 py-2.5 text-sm text-holo-100 bg-void-500 placeholder:text-holo-600 col-span-2" rows={2} />
          <button type="submit" className="col-span-2 bg-cyber-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-cyber-500 text-sm glow-cyber">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="mb-4 text-sm text-holo-400">
        Total Spent: <span className="font-semibold text-holo-100">{fmt$(projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0))}</span>
      </div>

      <div className="bg-void-400 rounded-xl border border-void-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-void-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Budget</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Actual Cost</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Dates</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-void-200">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-void-50 transition-colors">
                <td className="px-5 py-4"><Link to={`/projects/${p.id}`} className="text-neon-400 hover:text-neon-300 font-medium transition-colors">{p.name}</Link></td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>{p.status.replace('_', ' ')}</span>
                </td>
                <td className="px-5 py-4">{p.budget ? fmt$(p.budget) : '—'}</td>
                <td className="px-5 py-4">{p.actual_cost ? fmt$(p.actual_cost) : '—'}</td>
                <td className="px-5 py-4 text-xs text-holo-400">
                  {p.start_date && parseLocalDate(p.start_date).toLocaleDateString()}
                  {p.start_date && p.end_date && ' — '}
                  {p.end_date && parseLocalDate(p.end_date).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(p)} className="text-cyber-400 hover:text-cyber-300 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && <p className="text-holo-600 text-sm italic p-8 text-center">No projects found.</p>}
      </div>
    </div>
  );
}
