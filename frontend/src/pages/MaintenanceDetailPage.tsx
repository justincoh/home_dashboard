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

  if (!task) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <Link to="/maintenance" className="text-blue-600 hover:underline text-sm">&larr; Back to Maintenance</Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">{task.name}</h1>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Frequency:</span> Every {formatFrequency(task.frequency) || task.frequency}</div>
          <div><span className="font-medium">Next Due:</span> {task.next_due ? parseLocalDate(task.next_due).toLocaleDateString() : 'Not set'}</div>
          <div><span className="font-medium">Last Completed:</span> {task.last_completed ? parseLocalDate(task.last_completed).toLocaleDateString() : 'Never'}</div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleComplete}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
            Mark Complete
          </button>
          <button onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Completion Log</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(log => (
              <tr key={log.id}>
                <td className="px-4 py-3">{parseLocalDate(log.completed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-gray-500 text-sm p-4">No completions recorded.</p>}
      </div>
    </div>
  );
}
