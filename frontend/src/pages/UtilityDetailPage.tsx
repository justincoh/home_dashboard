import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Utility, UtilityBill, FileAttachment } from '../api/client';
import Modal from '../components/Modal';

export default function UtilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [utility, setUtility] = useState<Utility | null>(null);
  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [showBillForm, setShowBillForm] = useState(false);
  const [editBillId, setEditBillId] = useState<number | null>(null);
  const [billForm, setBillForm] = useState({ bill_date: '', amount: '', usage_value: '', usage_unit: '' });
  const [billFiles, setBillFiles] = useState<Record<number, FileAttachment>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!id) return;
    const uid = Number(id);
    api.getUtility(uid).then(setUtility);
    api.listBills(uid).then(setBills);
  }, [id]);

  const loadBills = () => api.listBills(Number(id)).then(setBills);

  const loadBillFiles = (billIds: number[]) => {
    billIds.forEach(billId => {
      api.listFiles('utility_bill', billId).then(files => {
        if (files.length > 0) {
          setBillFiles(prev => ({ ...prev, [billId]: files[0] }));
        }
      });
    });
  };

  useEffect(() => {
    if (bills.length > 0) {
      loadBillFiles(bills.map(b => b.id));
    }
  }, [bills]);

  const handleFileUpload = async (billId: number, file: File) => {
    const attachment = await api.uploadFile('utility_bill', billId, file);
    setBillFiles(prev => ({ ...prev, [billId]: attachment }));
    if (fileInputRefs.current[billId]) fileInputRefs.current[billId]!.value = '';
  };

  const handleFileDelete = async (billId: number, fileId: number) => {
    if (!confirm('Delete this file?')) return;
    await api.deleteFile(fileId);
    setBillFiles(prev => {
      const next = { ...prev };
      delete next[billId];
      return next;
    });
  };

  const resetBillForm = () => {
    setBillForm({ bill_date: '', amount: '', usage_value: '', usage_unit: '' });
    setShowBillForm(false);
    setEditBillId(null);
  };

  const startEditBill = (b: UtilityBill) => {
    setBillForm({
      bill_date: b.bill_date,
      amount: String(b.amount),
      usage_value: b.usage_value != null ? String(b.usage_value) : '',
      usage_unit: b.usage_unit || '',
    });
    setEditBillId(b.id);
    setShowBillForm(true);
  };

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      utility_id: Number(id),
      bill_date: billForm.bill_date,
      amount: Number(billForm.amount),
      usage_value: billForm.usage_value ? Number(billForm.usage_value) : null,
      usage_unit: billForm.usage_unit || null,
    };
    if (editBillId) {
      await api.updateBill(editBillId, data);
    } else {
      await api.createBill(Number(id), data);
    }
    resetBillForm();
    loadBills();
  };

  const handleDeleteBill = async (billId: number) => {
    if (!confirm('Delete this bill?')) return;
    await api.deleteBill(billId);
    loadBills();
  };

  if (!utility) return <p className="text-gray-500">Loading...</p>;

  // Simple bar chart using CSS
  const chartBills = [...bills].reverse().slice(-12);
  const maxAmount = Math.max(...chartBills.map(b => b.amount), 1);

  return (
    <div>
      <Link to="/utilities" className="text-blue-600 hover:underline text-sm">&larr; Back to Utilities</Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">{utility.provider_name}</h1>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Type:</span> <span className="capitalize">{utility.utility_type}</span></div>
          <div><span className="font-medium">Account #:</span> {utility.account_number || '—'}</div>
          <div><span className="font-medium">Contact:</span> {utility.contact_info || '—'}</div>
        </div>
        {utility.contract_terms && <p className="mt-3 text-sm text-gray-600">{utility.contract_terms}</p>}
      </div>

      {/* Usage Chart */}
      {chartBills.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Cost History</h2>
          <div className="flex items-end gap-1 h-40">
            {chartBills.map(b => (
              <div key={b.id} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(b.amount / maxAmount) * 100}%` }}
                  title={`$${b.amount.toFixed(2)}`}></div>
                <span className="text-[10px] text-gray-500 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {new Date(b.bill_date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bills */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Bills</h2>
        <button onClick={() => { resetBillForm(); setShowBillForm(true); }}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
          Add Bill
        </button>
      </div>

      <Modal open={showBillForm} onClose={resetBillForm} title={editBillId ? 'Edit Bill' : 'Add Bill'}>
        <form onSubmit={handleBillSubmit} className="grid grid-cols-2 gap-3">
          <input required type="date" value={billForm.bill_date} onChange={e => setBillForm({...billForm, bill_date: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input required placeholder="Amount" type="number" step="0.01" value={billForm.amount}
            onChange={e => setBillForm({...billForm, amount: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Usage Value" type="number" step="0.01" value={billForm.usage_value}
            onChange={e => setBillForm({...billForm, usage_value: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Usage Unit (kWh, gallons...)" value={billForm.usage_unit}
            onChange={e => setBillForm({...billForm, usage_unit: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            {editBillId ? 'Update' : 'Add Bill'}
          </button>
        </form>
      </Modal>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Usage</th>
              <th className="text-left px-4 py-3 font-medium">Cost per Unit</th>
              <th className="text-left px-4 py-3 font-medium">PDF</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bills.map(b => (
              <tr key={b.id}>
                <td className="px-4 py-3">{new Date(b.bill_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">${b.amount.toFixed(2)}</td>
                <td className="px-4 py-3">{b.usage_value != null ? `${b.usage_value} ${b.usage_unit || ''}` : '—'}</td>
                <td className="px-4 py-3">{b.usage_value ? `$${(b.amount / b.usage_value).toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3">
                  {billFiles[b.id] ? (
                    <span className="flex items-center gap-2">
                      <a href={api.getFileUrl(billFiles[b.id].id)} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline text-xs">{billFiles[b.id].filename}</a>
                      <button onClick={() => handleFileDelete(b.id, billFiles[b.id].id)}
                        className="text-red-500 hover:text-red-700 text-xs">x</button>
                    </span>
                  ) : (
                    <>
                      <input type="file" accept=".pdf" ref={el => { fileInputRefs.current[b.id] = el; }}
                        onChange={e => { if (e.target.files?.[0]) handleFileUpload(b.id, e.target.files[0]); }}
                        className="hidden" />
                      <button onClick={() => fileInputRefs.current[b.id]?.click()}
                        className="text-blue-600 hover:underline text-xs">Upload</button>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEditBill(b)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDeleteBill(b.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p className="text-gray-500 text-sm p-4">No bills recorded.</p>}
      </div>
    </div>
  );
}
