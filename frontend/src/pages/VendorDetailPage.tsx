import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Vendor, Quote, Contract } from '../api/client';
import { parseLocalDate } from '../utils/dates';

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    if (!id) return;
    const vid = Number(id);
    api.getVendor(vid).then(setVendor);
    api.listQuotes({ vendor_id: vid }).then(setQuotes);
    api.listContracts().then(all => setContracts(all.filter(c => c.vendor_id === vid)));
  }, [id]);

  if (!vendor) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  return (
    <div>
      <Link to="/vendors" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Vendors</Link>
      <h1 className="font-heading text-2xl text-warm-900 mt-2 mb-4">{vendor.name}</h1>
      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Service Type</div>
            <div>{vendor.service_type}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Phone</div>
            <div>{vendor.phone || '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Email</div>
            <div>{vendor.email || '—'}</div>
          </div>
        </div>
      </div>

      <h2 className="font-heading text-lg text-warm-800 mb-2">Quotes</h2>
      {quotes.length === 0 ? <p className="text-warm-400 text-sm italic mb-6">No quotes.</p> : (
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
