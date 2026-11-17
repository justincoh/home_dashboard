import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Quote } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import FileAttachments from '../components/FileAttachments';

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getQuote(Number(id)).then(setQuote);
  }, [id]);

  const saveNotes = async () => {
    if (!quote || notesDraft === null) return;
    setSavingNotes(true);
    try {
      const updated = await api.updateQuote(quote.id, {
        provider_id: quote.provider_id, project_id: quote.project_id,
        amount: quote.amount, date_received: quote.date_received,
        notes: notesDraft.trim() || null,
      });
      setQuote({ ...quote, notes: updated.notes });
      setNotesDraft(null);
    } catch {
      alert('Could not save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  if (!quote) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  return (
    <div>
      <Link to="/quotes" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Quotes</Link>
      <h1 className="font-heading text-2xl text-warm-900 mt-2 mb-4">Quote — {fmt$(quote.amount)}</h1>
      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Amount</div>
            <div>{fmt$(quote.amount)}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Date Received</div>
            <div>{parseLocalDate(quote.date_received).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Provider</div>
            <div>{quote.provider ? <Link to={`/providers/${quote.provider.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{quote.provider.name}</Link> : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Project</div>
            <div>{quote.project ? <Link to={`/projects/${quote.project.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{quote.project.name}</Link> : '—'}</div>
          </div>
        </div>
        <div className="border-t border-warm-100 pt-4 mt-4 text-sm">
          <div className="flex justify-between items-center mb-1">
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider">Notes</div>
            {notesDraft === null && (
              <button onClick={() => setNotesDraft(quote.notes || '')}
                className="text-accent-700 hover:text-accent-900 text-xs font-medium">
                {quote.notes ? 'Edit' : 'Add notes'}
              </button>
            )}
          </div>
          {notesDraft === null ? (
            quote.notes
              ? <p className="text-warm-600 leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
              : <p className="text-warm-400 italic">No notes.</p>
          ) : (
            <div className="space-y-2">
              <textarea autoFocus value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={5}
                onKeyDown={e => {
                  if (e.key === 'Escape') setNotesDraft(null);
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveNotes(); }
                }}
                className="w-full border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
              <div className="flex gap-2">
                <button onClick={saveNotes} disabled={savingNotes}
                  className="bg-sage-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-sage-800 disabled:opacity-40">
                  {savingNotes ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setNotesDraft(null)}
                  className="text-warm-500 hover:text-warm-700 px-3 py-1.5 text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <FileAttachments entityType="quote" entityId={Number(id)} />
    </div>
  );
}
