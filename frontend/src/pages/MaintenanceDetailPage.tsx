import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { MaintenanceTask, MaintenanceLog } from '../api/client';
import { parseLocalDate } from '../utils/dates';

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

  const load = () => {
    if (!id) return;
    const taskId = Number(id);
    api.getMaintenance(taskId).then(setTask);
    api.listMaintenanceLogs(taskId).then(setLogs);
  };

  useEffect(() => { load(); }, [id]);

  const handleComplete = async () => {
    await api.completeMaintenance(Number(id));
    load();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await api.deleteMaintenance(Number(id));
    navigate('/maintenance');
  };

  if (!task) return <p className="text-holo-500 font-medium animate-pulse">Loading...</p>;

  return (
    <div>
      <Link to="/maintenance" className="text-holo-500 hover:text-neon-400 text-sm font-medium transition-colors">&larr; Back to Maintenance</Link>
      <h1 className="font-heading text-2xl text-holo-50 mt-2 mb-4">{task.name}</h1>

      <div className="bg-void-400 rounded-xl border border-void-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Frequency</div>
            <div>Every {formatFrequency(task.frequency) || task.frequency}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Next Due</div>
            <div>{task.next_due ? parseLocalDate(task.next_due).toLocaleDateString() : 'Not set'}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Last Completed</div>
            <div>{task.last_completed ? parseLocalDate(task.last_completed).toLocaleDateString() : 'Never'}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleComplete}
            className="bg-matrix-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-matrix-600 shadow-sm glow-matrix">
            Mark Complete
          </button>
          <button onClick={handleDelete}
            className="bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 shadow-sm">
            Delete
          </button>
        </div>
      </div>

      <h2 className="font-heading text-lg text-holo-100 mb-2">Completion Log</h2>
      <div className="bg-void-400 rounded-xl border border-void-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-void-100">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-void-200">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-void-50 transition-colors">
                <td className="px-5 py-4">{parseLocalDate(log.completed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-holo-600 text-sm italic p-8 text-center">No completions recorded.</p>}
      </div>
    </div>
  );
}
