import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { LogEntry, Provider, Project, Category, LogEntryInput } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import FileAttachments from '../components/FileAttachments';
import Modal from '../components/Modal';

export default function LogEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<LogEntry | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    entry_date: '', title: '', amount: '', provider_id: '', category_id: '', description: '',
    project_id: '', usage_value: '', usage_unit: '', recurring: false, frequency: '', next_due: '',
  });

  const load = () => api.getLogEntry(Number(id)).then(setEntry);

  useEffect(() => {
    if (!id) return;
    load();
    api.listProviders().then(setProviders);
    api.listProjects().then(setProjects);
    api.listCategories().then(setCategories);
  }, [id]);

  const startEdit = () => {
    if (!entry) return;
    setForm({
      entry_date: entry.entry_date || '',
      title: entry.title,
      amount: entry.amount != null ? String(entry.amount) : '',
      provider_id: entry.provider_id ? String(entry.provider_id) : '',
      category_id: entry.category_id ? String(entry.category_id) : '',
      description: entry.description || '',
      project_id: entry.project_id ? String(entry.project_id) : '',
      usage_value: entry.usage_value != null ? String(entry.usage_value) : '',
      usage_unit: entry.usage_unit || '',
      recurring: entry.recurring,
      frequency: entry.frequency || '',
      next_due: entry.next_due || '',
    });
    setShowEdit(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: LogEntryInput = {
      entry_date: form.entry_date || null,
      title: form.title,
      description: form.description || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      provider_id: form.provider_id ? Number(form.provider_id) : null,
      project_id: form.project_id ? Number(form.project_id) : null,
      amount: form.amount ? Number(form.amount) : null,
      usage_value: form.usage_value ? Number(form.usage_value) : null,
      usage_unit: form.usage_unit || null,
      recurring: form.recurring,
      frequency: form.frequency || null,
      next_due: form.next_due || null,
    };
    await api.updateLogEntry(Number(id), data);
    setShowEdit(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this entry and its attachments?')) return;
    await api.deleteLogEntry(Number(id));
    navigate('/');
  };

  const addCategory = async () => {
    const name = window.prompt('New category name')?.trim();
    if (!name) return;
    try {
      const cat = await api.createCategory(name);
      setCategories(await api.listCategories());
      setForm(f => ({ ...f, category_id: String(cat.id) }));
    } catch {
      alert('Could not create category (maybe it already exists).');
    }
  };

  if (!entry) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  const provider = providers.find(p => p.id === entry.provider_id);
  const project = projects.find(p => p.id === entry.project_id);
  const inputCls = 'border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400';

  return (
    <div>
      <Link to="/" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Log</Link>
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="font-heading text-2xl text-warm-900">{entry.title}</h1>
        <div className="space-x-2">
          <button onClick={startEdit} className="text-accent-700 hover:text-accent-900 text-sm font-medium">Edit</button>
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Date</div>
            <div>{entry.entry_date ? parseLocalDate(entry.entry_date).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Amount</div>
            <div>{entry.amount != null ? fmt$(entry.amount) : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Category</div>
            <div>{entry.category?.name || '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Provider</div>
            <div>{provider ? <Link to={`/providers/${provider.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{provider.name}</Link> : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Project</div>
            <div>{project ? <Link to={`/projects/${project.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{project.name}</Link> : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Usage</div>
            <div>{entry.usage_value != null ? `${entry.usage_value} ${entry.usage_unit || ''}` : '—'}</div>
          </div>
          {entry.recurring && (
            <div>
              <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Reminder</div>
              <div>every {entry.frequency || '?'}{entry.next_due ? ` · next ${parseLocalDate(entry.next_due).toLocaleDateString()}` : ''}</div>
            </div>
          )}
        </div>
        {entry.description && <p className="text-warm-600 leading-relaxed border-t border-warm-100 pt-4 mt-4">{entry.description}</p>}
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Entry">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} className={inputCls} />
          <input required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
          <input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} />
          <select value={form.provider_id} onChange={e => setForm({ ...form, provider_id: e.target.value })} className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50">
            <option value="">No provider</option>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={form.category_id}
            onChange={e => { if (e.target.value === '__new__') addCategory(); else setForm({ ...form, category_id: e.target.value }); }}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50">
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">+ New category…</option>
          </select>
          <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50">
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input placeholder="Usage value" type="number" step="0.01" value={form.usage_value} onChange={e => setForm({ ...form, usage_value: e.target.value })} className={inputCls} />
          <input placeholder="Usage unit" value={form.usage_unit} onChange={e => setForm({ ...form, usage_unit: e.target.value })} className={inputCls} />
          <textarea placeholder="Notes" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputCls} col-span-2`} rows={2} />
          <label className="flex items-center gap-2 text-sm text-warm-700">
            <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} /> Reminder
          </label>
          <input placeholder="Frequency (1y…)" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className={inputCls} disabled={!form.recurring} />
          <input type="date" value={form.next_due} onChange={e => setForm({ ...form, next_due: e.target.value })} className={`${inputCls} col-span-2`} disabled={!form.recurring} />
          <button type="submit" className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">Update</button>
        </form>
      </Modal>

      <FileAttachments entityType="log_entry" entityId={Number(id)} />
    </div>
  );
}
