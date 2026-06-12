import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { LogEntry, Provider, Project, Category, LogEntryInput } from '../api/client';
import { parseLocalDate } from '../utils/dates';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  entry_date: today(),
  title: '',
  amount: '',
  provider_id: '',
  category_id: '',
  description: '',
  project_id: '',
  usage_value: '',
  usage_unit: '',
  recurring: false,
  frequency: '',
  next_due: '',
});

export default function LogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [fCategory, setFCategory] = useState('');
  const [fProvider, setFProvider] = useState('');
  const [fYear, setFYear] = useState('');

  const providerName = (id: number | null) => providers.find(p => p.id === id)?.name ?? null;
  const categoryName = (id: number | null) => categories.find(c => c.id === id)?.name ?? null;

  const loadEntries = () => {
    const params: { category_id?: number; provider_id?: number; year?: number } = {};
    if (fCategory) params.category_id = Number(fCategory);
    if (fProvider) params.provider_id = Number(fProvider);
    if (fYear) params.year = Number(fYear);
    api.listLogEntries(params).then(setEntries);
  };

  const addCategory = async () => {
    const name = window.prompt('New category name')?.trim();
    if (!name) return;
    try {
      const cat = await api.createCategory(name);
      const list = await api.listCategories();
      setCategories(list);
      setForm(f => ({ ...f, category_id: String(cat.id) }));
    } catch {
      alert('Could not create category (maybe it already exists).');
    }
  };

  useEffect(() => {
    api.listProviders().then(setProviders);
    api.listProjects().then(setProjects);
    api.listCategories().then(setCategories);
  }, []);

  useEffect(() => { loadEntries(); }, [fCategory, fProvider, fYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
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
      const created = await api.createLogEntry(data);
      if (file) await api.uploadFile('log_entry', created.id, file);
      setForm(emptyForm());
      setFile(null);
      setMore(false);
      api.listCategories().then(setCategories);
      loadEntries();
    } finally {
      setSaving(false);
    }
  };

  const years = Array.from(new Set(
    entries.map(e => e.entry_date?.slice(0, 4)).filter(Boolean) as string[]
  ));
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y > currentYear - 6; y--) if (!years.includes(String(y))) years.push(String(y));
  years.sort().reverse();

  const filteredTotal = entries.reduce((s, e) => s + (e.amount ?? 0), 0);

  const inputCls = 'border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400';

  return (
    <div>
      <h1 className="font-heading text-2xl text-warm-900 mb-4">Log</h1>

      {/* Quick add */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-warm-200 p-5 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <input required type="date" value={form.entry_date}
            onChange={e => setForm({ ...form, entry_date: e.target.value })}
            className={inputCls} />
          <input required placeholder="What happened?" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className={`${inputCls} col-span-2`} />
          <input placeholder="Amount" type="number" step="0.01" value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className={inputCls} />
          <select value={form.provider_id} onChange={e => setForm({ ...form, provider_id: e.target.value })}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50">
            <option value="">Provider…</option>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={form.category_id}
            onChange={e => { if (e.target.value === '__new__') addCategory(); else setForm({ ...form, category_id: e.target.value }); }}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50">
            <option value="">Category…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">+ New category…</option>
          </select>
        </div>

        {more && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 border-t border-warm-100 pt-3">
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
              className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 md:col-span-2">
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input placeholder="Usage value" type="number" step="0.01" value={form.usage_value}
              onChange={e => setForm({ ...form, usage_value: e.target.value })} className={inputCls} />
            <input placeholder="Usage unit (kWh…)" value={form.usage_unit}
              onChange={e => setForm({ ...form, usage_unit: e.target.value })} className={inputCls} />
            <textarea placeholder="Notes" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={`${inputCls} md:col-span-4`} rows={2} />
            <label className="flex items-center gap-2 text-sm text-warm-700">
              <input type="checkbox" checked={form.recurring}
                onChange={e => setForm({ ...form, recurring: e.target.checked })} />
              Reminder
            </label>
            <input placeholder="Frequency (1y, 6m…)" value={form.frequency}
              onChange={e => setForm({ ...form, frequency: e.target.value })}
              className={inputCls} disabled={!form.recurring} />
            <label className="text-xs text-warm-500 flex flex-col gap-1 md:col-span-2">
              Next due
              <input type="date" value={form.next_due}
                onChange={e => setForm({ ...form, next_due: e.target.value })}
                className={inputCls} disabled={!form.recurring} />
            </label>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <button type="button" onClick={() => setMore(m => !m)}
            className="text-accent-700 hover:text-accent-900 text-sm font-medium">
            {more ? '− Fewer options' : '+ More options'}
          </button>
          <button type="submit" disabled={saving}
            className="ml-auto bg-sage-700 text-white px-5 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2 className="font-heading text-lg text-warm-800">Recent</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          <select value={fCategory} onChange={e => setFCategory(e.target.value)}
            className="border border-warm-300 rounded-lg px-3 py-1.5 text-sm text-warm-800 bg-white">
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={fProvider} onChange={e => setFProvider(e.target.value)}
            className="border border-warm-300 rounded-lg px-3 py-1.5 text-sm text-warm-800 bg-white">
            <option value="">All providers</option>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={fYear} onChange={e => setFYear(e.target.value)}
            className="border border-warm-300 rounded-lg px-3 py-1.5 text-sm text-warm-800 bg-white">
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-3 text-sm text-warm-600">
        {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · total{' '}
        <span className="font-semibold text-warm-800">{fmt$(filteredTotal)}</span>
      </div>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Provider</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Category</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {entries.map(e => (
              <tr key={e.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4 whitespace-nowrap text-warm-600">
                  {e.entry_date ? parseLocalDate(e.entry_date).toLocaleDateString() : (
                    <span className="text-warm-400 italic">reminder</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Link to={`/log/${e.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{e.title}</Link>
                  {e.recurring && e.next_due && (
                    <span className="ml-2 text-xs text-warm-400">↻ due {parseLocalDate(e.next_due).toLocaleDateString()}</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {e.provider_id ? (
                    <Link to={`/providers/${e.provider_id}`} className="text-accent-800 hover:text-accent-600 transition-colors">{providerName(e.provider_id)}</Link>
                  ) : '—'}
                </td>
                <td className="px-5 py-4">{categoryName(e.category_id) || '—'}</td>
                <td className="px-5 py-4 text-right font-medium">{e.amount != null ? fmt$(e.amount) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No entries yet.</p>}
      </div>
    </div>
  );
}
