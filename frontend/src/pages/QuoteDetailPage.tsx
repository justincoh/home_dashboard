import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Quote } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import FileAttachments from '../components/FileAttachments';

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getQuote(Number(id)).then(setQuote);
  }, [id]);

  if (!quote) return <p className="text-holo-500 font-medium animate-pulse">Loading...</p>;

  return (
    <div>
      <Link to="/quotes" className="text-holo-500 hover:text-neon-400 text-sm font-medium transition-colors">&larr; Back to Quotes</Link>
      <h1 className="font-heading text-2xl text-holo-50 mt-2 mb-4">Quote — {fmt$(quote.amount)}</h1>
      <div className="bg-void-400 rounded-xl border border-void-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Amount</div>
            <div>{fmt$(quote.amount)}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Date Received</div>
            <div>{parseLocalDate(quote.date_received).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Vendor</div>
            <div>{quote.vendor ? <Link to={`/vendors/${quote.vendor.id}`} className="text-neon-400 hover:text-neon-300 font-medium transition-colors">{quote.vendor.name}</Link> : '—'}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Project</div>
            <div>{quote.project ? <Link to={`/projects/${quote.project.id}`} className="text-neon-400 hover:text-neon-300 font-medium transition-colors">{quote.project.name}</Link> : '—'}</div>
          </div>
        </div>
      </div>
      <FileAttachments entityType="quote" entityId={Number(id)} />
    </div>
  );
}
