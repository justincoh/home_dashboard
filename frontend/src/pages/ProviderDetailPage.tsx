import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Provider, LogEntry, Quote, Contract, FileAttachment } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import Modal from '../components/Modal';

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [entryFiles, setEntryFiles] = useState<Record<number, FileAttachment[]>>({});
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: '', service_type: '', phone: '', email: '',
    account_number: '', contract_terms: '', notes: '',
  });

  const loadProvider = () => api.getProvider(Number(id)).then(setProvider);

  useEffect(() => {
    if (!id) return;
    const pid = Number(id);
    api.getProvider(pid).then(setProvider);
    api.listLogEntries({ provider_id: pid }).then(setEntries);
    api.listQuotes({ provider_id: pid }).then(setQuotes);
    api.listContracts().then(all => setContracts(all.filter(c => c.provider_id === pid)));
  }, [id]);

  useEffect(() => {
    entries.forEach(e => {
      api.listFiles('log_entry', e.id).then(files => {
        if (files.length > 0) setEntryFiles(prev => ({ ...prev, [e.id]: files }));
      });
    });
  }, [entries]);

  if (!provider) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  const total = entries.reduce((s, e) => s + (e.amount ?? 0), 0);
  const hasUsage = entries.some(e => e.usage_value != null);
  const hasFiles = Object.keys(entryFiles).length > 0;
  const inputCls = 'border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400';

  const startEdit = () => {
    setForm({
      name: provider.name, service_type: provider.service_type,
      phone: provider.phone || '', email: provider.email || '',
      account_number: provider.account_number || '',
      contract_terms: provider.contract_terms || '', notes: provider.notes || '',
    });
    setShowEdit(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateProvider(provider.id, {
      name: form.name, service_type: form.service_type,
      phone: form.phone || null, email: form.email || null,
      account_number: form.account_number || null,
      contract_terms: form.contract_terms || null, notes: form.notes || null,
    });
    setShowEdit(false);
    loadProvider();
  };

  return (
    <div>
      <Link to="/providers" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Providers</Link>
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="font-heading text-2xl text-warm-900">{provider.name}</h1>
        <button onClick={startEdit} className="text-accent-700 hover:text-accent-900 text-sm font-medium">Edit</button>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Provider">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
          <input required placeholder="Type (electric, lawn care…)" value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })} className={inputCls} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
          <input placeholder="Account number" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className={`${inputCls} col-span-2`} />
          <textarea placeholder="Contract terms" value={form.contract_terms} onChange={e => setForm({ ...form, contract_terms: e.target.value })} className={`${inputCls} col-span-2`} rows={2} />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${inputCls} col-span-2`} rows={2} />
          <button type="submit" className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">Update</button>
        </form>
      </Modal>

      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Type</div>
            <div>{provider.service_type}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Account #</div>
            <div>{provider.account_number || '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Phone</div>
            <div>{provider.phone || '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Email</div>
            <div>{provider.email || '—'}</div>
          </div>
        </div>
        {provider.contract_terms && <p className="text-warm-600 leading-relaxed border-t border-warm-100 pt-4 mt-4">{provider.contract_terms}</p>}
        {provider.notes && <p className="text-warm-500 text-sm leading-relaxed mt-2">{provider.notes}</p>}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-lg text-warm-800">Log History</h2>
        <span className="text-sm text-warm-600">total <span className="font-semibold text-warm-800">{fmt$(total)}</span></span>
      </div>
      {entries.length === 0 ? <p className="text-warm-400 text-sm italic mb-8">No log entries.</p> : (
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-warm-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Title</th>
                {hasUsage && <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Usage</th>}
                {hasUsage && <th className="text-right px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">$ / Unit</th>}
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Amount</th>
                {hasFiles && <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">PDF</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-warm-600">{e.entry_date ? parseLocalDate(e.entry_date).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-4"><Link to={`/log/${e.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{e.title}</Link></td>
                  {hasUsage && <td className="px-5 py-4">{e.usage_value != null ? `${e.usage_value} ${e.usage_unit || ''}` : '—'}</td>}
                  {hasUsage && <td className="px-5 py-4 text-right">{e.usage_value && e.amount != null ? `${fmt$(e.amount / e.usage_value, 3)}${e.usage_unit ? ` / ${e.usage_unit}` : ''}` : '—'}</td>}
                  <td className="px-5 py-4 text-right font-medium">{e.amount != null ? fmt$(e.amount) : '—'}</td>
                  {hasFiles && (
                    <td className="px-5 py-4">
                      {entryFiles[e.id]?.length ? (
                        <span className="flex flex-col gap-1">
                          {entryFiles[e.id].map(f => (
                            <a key={f.id} href={api.getFileUrl(f.id)} target="_blank" rel="noreferrer"
                              className="text-accent-700 hover:text-accent-900 text-xs font-medium transition-colors">{f.filename}</a>
                          ))}
                        </span>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="font-heading text-lg text-warm-800 mb-2">Quotes</h2>
      {quotes.length === 0 ? <p className="text-warm-400 text-sm italic mb-8">No quotes.</p> : (
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-warm-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Project</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-5 py-4"><Link to={`/quotes/${q.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{fmt$(q.amount)}</Link></td>
                  <td className="px-5 py-4">{parseLocalDate(q.date_received).toLocaleDateString()}</td>
                  <td className="px-5 py-4">{q.project ? <Link to={`/projects/${q.project.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{q.project.name}</Link> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="font-heading text-lg text-warm-800 mb-2">Contracts & Warranties</h2>
      {contracts.length === 0 ? <p className="text-warm-400 text-sm italic">No contracts.</p> : (
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {contracts.map(c => (
                <tr key={c.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-5 py-4"><Link to={`/contracts/${c.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{c.name}</Link></td>
                  <td className="px-5 py-4 capitalize">{c.type}</td>
                  <td className="px-5 py-4">{c.end_date ? parseLocalDate(c.end_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
