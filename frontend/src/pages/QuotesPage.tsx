import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Quote, Provider, Project } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import Modal from '../components/Modal';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ provider_id: '', project_id: '', amount: '', date_received: '', notes: '' });
  const [newProvider, setNewProvider] = useState<{ name: string; service_type: string } | null>(null);
  const [newProject, setNewProject] = useState<{ name: string; status: Project['status'] } | null>(null);

  const load = () => {
    api.listQuotes().then(setQuotes);
    api.listProviders().then(setProviders);
    api.listProjects().then(setProjects);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ provider_id: '', project_id: '', amount: '', date_received: '', notes: '' });
    setNewProvider(null);
    setNewProject(null);
    setShowForm(false);
    setEditId(null);
  };

  const saveNewProvider = async () => {
    if (!newProvider) return;
    const name = newProvider.name.trim();
    const service_type = newProvider.service_type.trim();
    if (!name || !service_type) return;
    try {
      const p = await api.createProvider({
        name, service_type,
        phone: null, email: null, account_number: null, contract_terms: null, notes: null,
      });
      setProviders(await api.listProviders());
      setForm(f => ({ ...f, provider_id: String(p.id) }));
      setNewProvider(null);
    } catch {
      alert('Could not create provider.');
    }
  };

  const saveNewProject = async () => {
    if (!newProject) return;
    const name = newProject.name.trim();
    if (!name) return;
    try {
      const p = await api.createProject({
        name, status: newProject.status,
        description: null, budget: null, actual_cost: null, start_date: null, end_date: null,
      });
      setProjects(await api.listProjects());
      setForm(f => ({ ...f, project_id: String(p.id) }));
      setNewProject(null);
    } catch {
      alert('Could not create project.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      provider_id: Number(form.provider_id),
      project_id: form.project_id ? Number(form.project_id) : null,
      amount: Number(form.amount),
      date_received: form.date_received,
      notes: form.notes || null,
    };
    if (editId) await api.updateQuote(editId, data);
    else await api.createQuote(data);
    resetForm();
    load();
  };

  const startEdit = (q: Quote) => {
    setForm({
      provider_id: String(q.provider_id), project_id: q.project_id ? String(q.project_id) : '',
      amount: String(q.amount), date_received: q.date_received, notes: q.notes || '',
    });
    setNewProvider(null);
    setNewProject(null);
    setEditId(q.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this quote?')) return;
    await api.deleteQuote(id);
    load();
  };

  const inputCls = 'border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400';
  const selectCls = 'border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-warm-900">Quotes</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-accent-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-accent-600 text-sm">
          Add Quote
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Quote' : 'Add Quote'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <select required value={form.provider_id}
            onChange={e => { if (e.target.value === '__new__') setNewProvider({ name: '', service_type: '' }); else setForm({ ...form, provider_id: e.target.value }); }}
            className={selectCls}>
            <option value="">Select Provider</option>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="__new__">+ New provider&hellip;</option>
          </select>
          <select value={form.project_id}
            onChange={e => { if (e.target.value === '__new__') setNewProject({ name: '', status: 'planned' }); else setForm({ ...form, project_id: e.target.value }); }}
            className={selectCls}>
            <option value="">No Project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="__new__">+ New project&hellip;</option>
          </select>

          {newProvider && (
            <div className="col-span-2 rounded-lg border border-warm-200 bg-warm-50 p-3 space-y-2">
              <div className="text-xs font-semibold text-warm-500 uppercase tracking-wider">New Provider</div>
              <input autoFocus placeholder="Name" value={newProvider.name}
                onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveNewProvider(); } }}
                className={`${inputCls} w-full bg-white`} />
              <input placeholder="Service type (e.g. electrician)" value={newProvider.service_type}
                onChange={e => setNewProvider({ ...newProvider, service_type: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveNewProvider(); } }}
                className={`${inputCls} w-full bg-white`} />
              <div className="flex gap-2">
                <button type="button" onClick={saveNewProvider}
                  disabled={!newProvider.name.trim() || !newProvider.service_type.trim()}
                  className="bg-sage-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-sage-800 disabled:opacity-40">
                  Save Provider
                </button>
                <button type="button" onClick={() => setNewProvider(null)}
                  className="text-warm-500 hover:text-warm-700 px-3 py-1.5 text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}

          {newProject && (
            <div className="col-span-2 rounded-lg border border-warm-200 bg-warm-50 p-3 space-y-2">
              <div className="text-xs font-semibold text-warm-500 uppercase tracking-wider">New Project</div>
              <input autoFocus placeholder="Name" value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveNewProject(); } }}
                className={`${inputCls} w-full bg-white`} />
              <select value={newProject.status}
                onChange={e => setNewProject({ ...newProject, status: e.target.value as Project['status'] })}
                className={`${selectCls} w-full bg-white`}>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={saveNewProject} disabled={!newProject.name.trim()}
                  className="bg-sage-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-sage-800 disabled:opacity-40">
                  Save Project
                </button>
                <button type="button" onClick={() => setNewProject(null)}
                  className="text-warm-500 hover:text-warm-700 px-3 py-1.5 text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}
          <input required placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} />
          <input required type="date" value={form.date_received} onChange={e => setForm({ ...form, date_received: e.target.value })} className={inputCls} />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${inputCls} col-span-2`} rows={3} />
          <button type="submit" className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Provider</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Project</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {quotes.map(q => (
              <tr key={q.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4 font-medium"><Link to={`/quotes/${q.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{fmt$(q.amount)}</Link></td>
                <td className="px-5 py-4">{q.provider ? <Link to={`/providers/${q.provider.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{q.provider.name}</Link> : '—'}</td>
                <td className="px-5 py-4">{q.project ? <Link to={`/projects/${q.project.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{q.project.name}</Link> : '—'}</td>
                <td className="px-5 py-4">{parseLocalDate(q.date_received).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(q)} className="text-accent-700 hover:text-accent-900 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quotes.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No quotes found.</p>}
      </div>
    </div>
  );
}
