import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Utility, UtilityBill, FileAttachment } from '../api/client';
import { parseLocalDate } from '../utils/dates';
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

  if (!utility) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  // Simple bar chart using CSS
  const chartBills = [...bills].reverse().slice(-12);
  const maxAmount = Math.max(...chartBills.map(b => b.amount), 1);

  return (
    <div>
      <Link to="/utilities" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Utilities</Link>
      <h1 className="font-heading text-2xl text-warm-900 mt-2 mb-4">{utility.provider_name}</h1>

      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Type</div>
            <div className="capitalize">{utility.utility_type}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Account #</div>
            <div>{utility.account_number || '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Contact</div>
            <div>{utility.contact_info || '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Notes</div>
            <div>{utility.notes || '—'}</div>
          </div>
        </div>
        {utility.contract_terms && <p className="text-warm-600 leading-relaxed border-t border-warm-100 pt-4 mt-4">{utility.contract_terms}</p>}
      </div>

      {/* Usage Chart */}
      {chartBills.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
          <h2 className="font-heading text-lg text-warm-800 mb-3">Cost History</h2>
          <div className="flex items-end gap-1" style={{ height: '160px' }}>
            {chartBills.map(b => (
              <div key={b.id} className="flex-1 flex flex-col items-center h-full justify-end">
                <div className="text-[10px] text-warm-600 mb-1">{fmt$(b.amount, 0)}</div>
                <div className="w-full bg-accent-600 hover:bg-accent-700 transition-colors rounded-t-md min-h-[2px]" style={{ height: `${(b.amount / maxAmount) * 100}%` }}
                  title={fmt$(b.amount)}></div>
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            {chartBills.map(b => (
              <div key={b.id} className="flex-1 text-center text-[10px] text-warm-400 truncate">
                {parseLocalDate(b.bill_date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bills */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-heading text-lg text-warm-800">Bills</h2>
        <button onClick={() => { resetBillForm(); setShowBillForm(true); }}
          className="bg-accent-700 text-white px-3 py-1 rounded-lg text-sm hover:bg-accent-600 shadow-sm">
          Add Bill
        </button>
      </div>

      <Modal open={showBillForm} onClose={resetBillForm} title={editBillId ? 'Edit Bill' : 'Add Bill'}>
        <form onSubmit={handleBillSubmit} className="grid grid-cols-2 gap-3">
          <input required type="date" value={billForm.bill_date} onChange={e => setBillForm({...billForm, bill_date: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50" />
          <input required placeholder="Amount" type="number" step="0.01" value={billForm.amount}
            onChange={e => setBillForm({...billForm, amount: e.target.value})} className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="Usage Value" type="number" step="0.01" value={billForm.usage_value}
            onChange={e => setBillForm({...billForm, usage_value: e.target.value})} className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <input placeholder="Usage Unit (kWh, gallons...)" value={billForm.usage_unit}
            onChange={e => setBillForm({...billForm, usage_unit: e.target.value})} className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400" />
          <button type="submit" className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
            {editBillId ? 'Update' : 'Add Bill'}
          </button>
        </form>
      </Modal>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Usage</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Cost per Unit</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">PDF</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {bills.map(b => (
              <tr key={b.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4">{parseLocalDate(b.bill_date).toLocaleDateString()}</td>
                <td className="px-5 py-4 font-medium">{fmt$(b.amount)}</td>
                <td className="px-5 py-4">{b.usage_value != null ? `${b.usage_value} ${b.usage_unit || ''}` : '—'}</td>
                <td className="px-5 py-4">{b.usage_value ? fmt$(b.amount / b.usage_value) : '—'}</td>
                <td className="px-5 py-4">
                  {billFiles[b.id] ? (
                    <span className="flex items-center gap-2">
                      <a href={api.getFileUrl(billFiles[b.id].id)} target="_blank" rel="noreferrer"
                        className="text-accent-700 hover:text-accent-900 text-xs font-medium transition-colors">{billFiles[b.id].filename}</a>
                      <button onClick={() => handleFileDelete(b.id, billFiles[b.id].id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium">x</button>
                    </span>
                  ) : (
                    <>
                      <input type="file" accept=".pdf" ref={el => { fileInputRefs.current[b.id] = el; }}
                        onChange={e => { if (e.target.files?.[0]) handleFileUpload(b.id, e.target.files[0]); }}
                        className="hidden" />
                      <button onClick={() => fileInputRefs.current[b.id]?.click()}
                        className="text-accent-700 hover:text-accent-900 text-xs font-medium">Upload</button>
                    </>
                  )}
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  <button onClick={() => startEditBill(b)} className="text-accent-700 hover:text-accent-900 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDeleteBill(b.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No bills recorded.</p>}
      </div>
    </div>
  );
}
