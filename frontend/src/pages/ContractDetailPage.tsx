import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Contract } from '../api/client';
import FileAttachments from '../components/FileAttachments';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getContract(Number(id)).then(setContract);
  }, [id]);

  if (!contract) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <Link to="/contracts" className="text-blue-600 hover:underline text-sm">&larr; Back to Contracts</Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">{contract.name}</h1>
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Type:</span> <span className="capitalize">{contract.type}</span></div>
          <div><span className="font-medium">Vendor:</span>{' '}
            {contract.vendor ? <Link to={`/vendors/${contract.vendor.id}`} className="text-blue-600 hover:underline">{contract.vendor.name}</Link> : '—'}
          </div>
          <div><span className="font-medium">Start Date:</span> {new Date(contract.start_date).toLocaleDateString()}</div>
          <div><span className="font-medium">End Date:</span> {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '—'}</div>
          <div><span className="font-medium">Cost:</span> {contract.cost ? fmt$(contract.cost) : '—'}</div>
          <div><span className="font-medium">Payment Terms:</span> {contract.payment_terms || '—'}</div>
        </div>
        {contract.notes && <p className="mt-3 text-sm text-gray-600">{contract.notes}</p>}
      </div>
      <FileAttachments entityType="contract" entityId={Number(id)} />
    </div>
  );
}
