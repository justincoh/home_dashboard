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

  if (!quote) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <Link to="/quotes" className="text-blue-600 hover:underline text-sm">&larr; Back to Quotes</Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Quote — {fmt$(quote.amount)}</h1>
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Amount:</span> {fmt$(quote.amount)}</div>
          <div><span className="font-medium">Date Received:</span> {parseLocalDate(quote.date_received).toLocaleDateString()}</div>
          <div><span className="font-medium">Vendor:</span>{' '}
            {quote.vendor ? <Link to={`/vendors/${quote.vendor.id}`} className="text-blue-600 hover:underline">{quote.vendor.name}</Link> : '—'}
          </div>
          <div><span className="font-medium">Project:</span>{' '}
            {quote.project ? <Link to={`/projects/${quote.project.id}`} className="text-blue-600 hover:underline">{quote.project.name}</Link> : '—'}
          </div>
        </div>
      </div>
      <FileAttachments entityType="quote" entityId={Number(id)} />
    </div>
  );
}
