import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Contract } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import FileAttachments from '../components/FileAttachments';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getContract(Number(id)).then(setContract);
  }, [id]);

  if (!contract) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  return (
    <div>
      <Link to="/contracts" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Contracts</Link>
      <h1 className="font-heading text-2xl text-warm-900 mt-2 mb-4">{contract.name}</h1>
      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Type</div>
            <div className="capitalize">{contract.type}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Vendor</div>
            <div>{contract.vendor ? <Link to={`/vendors/${contract.vendor.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{contract.vendor.name}</Link> : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Start Date</div>
            <div>{parseLocalDate(contract.start_date).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">End Date</div>
            <div>{contract.end_date ? parseLocalDate(contract.end_date).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Cost</div>
            <div>{contract.cost ? fmt$(contract.cost) : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Payment Terms</div>
            <div>{contract.payment_terms || '—'}</div>
          </div>
        </div>
        {contract.notes && <p className="text-warm-600 leading-relaxed border-t border-warm-100 pt-4 mt-4">{contract.notes}</p>}
      </div>
      <FileAttachments entityType="contract" entityId={Number(id)} />
    </div>
  );
}
