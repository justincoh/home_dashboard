import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Vendor, Quote, Contract } from '../api/client';

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

  if (!vendor) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <Link to="/vendors" className="text-blue-600 hover:underline text-sm">&larr; Back to Vendors</Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">{vendor.name}</h1>
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Service Type:</span> {vendor.service_type}</div>
          <div><span className="font-medium">Phone:</span> {vendor.phone || '—'}</div>
          <div><span className="font-medium">Email:</span> {vendor.email || '—'}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Quotes</h2>
      {quotes.length === 0 ? <p className="text-gray-500 text-sm mb-6">No quotes.</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Project</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotes.map(q => (
                <tr key={q.id}>
                  <td className="px-4 py-3"><Link to={`/quotes/${q.id}`} className="text-blue-600 hover:underline">${q.amount.toFixed(2)}</Link></td>
                  <td className="px-4 py-3">{new Date(q.date_received).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{q.project ? <Link to={`/projects/${q.project.id}`} className="text-blue-600 hover:underline">{q.project.name}</Link> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2">Contracts & Warranties</h2>
      {contracts.length === 0 ? <p className="text-gray-500 text-sm">No contracts.</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3"><Link to={`/contracts/${c.id}`} className="text-blue-600 hover:underline">{c.name}</Link></td>
                  <td className="px-4 py-3 capitalize">{c.type}</td>
                  <td className="px-4 py-3">{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
