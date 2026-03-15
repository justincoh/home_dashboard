import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { MaintenanceTask, MaintenanceLog } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import Modal from '../components/Modal';

function formatFrequency(freq: string): string | null {
  const match = freq.trim().match(/^(\d+)\s*(d|w|m|y)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const labels: Record<string, [string, string]> = {
    d: ['day', 'days'],
    w: ['week', 'weeks'],
    m: ['month', 'months'],
    y: ['year', 'years'],
  };
  const [singular, plural] = labels[unit];
  return `${n} ${n === 1 ? singular : plural}`;
}

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeCost, setCompleteCost] = useState('');

  const load = () => {
    if (!id) return;
    const taskId = Number(id);
    api.getMaintenance(taskId).then(setTask);
    api.listMaintenanceLogs(taskId).then(setLogs);
  };

  useEffect(() => { load(); }, [id]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = completeCost ? parseFloat(completeCost) : undefined;
    await api.completeMaintenance(Number(id), cost);
    setShowCompleteModal(false);
    setCompleteCost('');
    load();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await api.deleteMaintenance(Number(id));
    navigate('/maintenance');
  };

  if (!task) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  const totalCost = logs.reduce((sum, log) => sum + (log.cost ?? 0), 0);

  return (
    <div>
      <Link to="/maintenance" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Maintenance</Link>
      <h1 className="font-heading text-2xl text-warm-900 mt-2 mb-4">{task.name}</h1>

      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Type</div>
            <div>{task.recurring ? `Every ${formatFrequency(task.frequency) || task.frequency}` : 'One Time'}</div>
          </div>
          {task.recurring && (
            <div>
              <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Next Due</div>
              <div>{task.next_due ? parseLocalDate(task.next_due).toLocaleDateString() : 'Not set'}</div>
            </div>
          )}
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Last Completed</div>
            <div>{task.last_completed ? parseLocalDate(task.last_completed).toLocaleDateString() : 'Never'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Cost</div>
            <div>{totalCost > 0 ? fmt$(totalCost) : '—'}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setShowCompleteModal(true)}
            className="bg-sage-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-sage-800 shadow-sm">
            Mark Complete
          </button>
          <button onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 shadow-sm">
            Delete
          </button>
        </div>
      </div>

      <Modal open={showCompleteModal} onClose={() => { setShowCompleteModal(false); setCompleteCost(''); }} title="Complete Task">
        <form onSubmit={handleComplete} className="space-y-3">
          <div>
            <label className="block text-xs text-warm-500 mb-1">Cost (optional)</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={completeCost}
              onChange={e => setCompleteCost(e.target.value)}
              className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400 w-full" />
          </div>
          <button type="submit" className="w-full bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
            Complete Task
          </button>
        </form>
      </Modal>

      <h2 className="font-heading text-lg text-warm-800 mb-2">Completion Log</h2>
      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4">{parseLocalDate(log.completed_at).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right">{log.cost != null ? fmt$(log.cost) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No completions recorded.</p>}
      </div>
    </div>
  );
}
