import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { MaintenanceTask, MaintenanceLog, FileAttachment } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import Modal from '../components/Modal';
import FileAttachments from '../components/FileAttachments';

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
  const [editLog, setEditLog] = useState<MaintenanceLog | null>(null);
  const [editLogForm, setEditLogForm] = useState({ completed_at: '', cost: '' });
  const [logFiles, setLogFiles] = useState<Record<number, FileAttachment>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const load = () => {
    if (!id) return;
    const taskId = Number(id);
    api.getMaintenance(taskId).then(setTask);
    api.listMaintenanceLogs(taskId).then(setLogs);
  };

  useEffect(() => { load(); }, [id]);

  const loadLogFiles = (logIds: number[]) => {
    logIds.forEach(logId => {
      api.listFiles('maintenance_log', logId).then(files => {
        if (files.length > 0) {
          setLogFiles(prev => ({ ...prev, [logId]: files[0] }));
        }
      });
    });
  };

  useEffect(() => {
    if (logs.length > 0) {
      loadLogFiles(logs.map(l => l.id));
    }
  }, [logs]);

  const handleLogFileUpload = async (logId: number, file: File) => {
    const attachment = await api.uploadFile('maintenance_log', logId, file);
    setLogFiles(prev => ({ ...prev, [logId]: attachment }));
    if (fileInputRefs.current[logId]) fileInputRefs.current[logId]!.value = '';
  };

  const handleLogFileDelete = async (logId: number, fileId: number) => {
    if (!confirm('Delete this file?')) return;
    await api.deleteFile(fileId);
    setLogFiles(prev => {
      const next = { ...prev };
      delete next[logId];
      return next;
    });
  };

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

  const startEditLog = (log: MaintenanceLog) => {
    setEditLog(log);
    setEditLogForm({
      completed_at: log.completed_at,
      cost: log.cost != null ? String(log.cost) : '',
    });
  };

  const handleEditLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog) return;
    await api.updateMaintenanceLog(editLog.id, {
      completed_at: editLogForm.completed_at,
      cost: editLogForm.cost ? parseFloat(editLogForm.cost) : null,
    });
    setEditLog(null);
    load();
  };

  const handleDeleteLog = async (logId: number) => {
    if (!confirm('Delete this log entry?')) return;
    await api.deleteMaintenanceLog(logId);
    load();
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
        {!task.recurring && (
          <FileAttachments entityType="maintenance" entityId={Number(id)} />
        )}
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

      <Modal open={editLog !== null} onClose={() => setEditLog(null)} title="Edit Log Entry">
        <form onSubmit={handleEditLog} className="space-y-3">
          <div>
            <label className="block text-xs text-warm-500 mb-1">Date</label>
            <input type="date" required value={editLogForm.completed_at}
              onChange={e => setEditLogForm({ ...editLogForm, completed_at: e.target.value })}
              className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 w-full" />
          </div>
          <div>
            <label className="block text-xs text-warm-500 mb-1">Cost (optional)</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={editLogForm.cost}
              onChange={e => setEditLogForm({ ...editLogForm, cost: e.target.value })}
              className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400 w-full" />
          </div>
          <button type="submit" className="w-full bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm">
            Save
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
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">File</th>
              <th className="px-5 py-3.5 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-warm-50 transition-colors">
                <td className="px-5 py-4">{parseLocalDate(log.completed_at).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-right">{log.cost != null ? fmt$(log.cost) : '—'}</td>
                <td className="px-5 py-4">
                  {logFiles[log.id] ? (
                    <span className="flex items-center gap-2">
                      <a href={api.getFileUrl(logFiles[log.id].id)} target="_blank" rel="noreferrer"
                        className="text-accent-700 hover:text-accent-900 text-xs font-medium transition-colors">{logFiles[log.id].filename}</a>
                      <button onClick={() => handleLogFileDelete(log.id, logFiles[log.id].id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium">x</button>
                    </span>
                  ) : (
                    <>
                      <input type="file" ref={el => { fileInputRefs.current[log.id] = el; }}
                        onChange={e => { if (e.target.files?.[0]) handleLogFileUpload(log.id, e.target.files[0]); }}
                        className="hidden" />
                      <button onClick={() => fileInputRefs.current[log.id]?.click()}
                        className="text-accent-700 hover:text-accent-900 text-xs font-medium">Upload</button>
                    </>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => startEditLog(log)} className="text-accent-700 hover:text-accent-900 text-xs font-medium mr-2">Edit</button>
                  <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No completions recorded.</p>}
      </div>
    </div>
  );
}
