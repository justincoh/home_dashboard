import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { MaintenanceTask } from '../api/client';
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

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', frequency: '',
    last_completed: '', next_due: '',
  });
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [completeCost, setCompleteCost] = useState('');

  const load = () => api.listMaintenance().then(setTasks);
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', frequency: '', last_completed: '', next_due: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      frequency: form.frequency.trim().toLowerCase(),
      last_completed: form.last_completed || null,
      next_due: form.next_due || null,
    };
    if (editId) {
      await api.updateMaintenance(editId, data);
    } else {
      await api.createMaintenance(data);
    }
    resetForm();
    load();
  };

  const startEdit = (t: MaintenanceTask) => {
    setForm({
      name: t.name, frequency: t.frequency,
      last_completed: t.last_completed || '', next_due: t.next_due || '',
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeId) return;
    const cost = completeCost ? parseFloat(completeCost) : undefined;
    await api.completeMaintenance(completeId, cost);
    setCompleteId(null);
    setCompleteCost('');
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    await api.deleteMaintenance(id);
    load();
  };

  const urgencyColor = (nextDue: string | null) => {
    if (!nextDue) return '';
    const days = Math.ceil((parseLocalDate(nextDue).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'bg-red-50 border-l-4 border-red-500';
    if (days < 7) return 'bg-orange-50 border-l-4 border-orange-500';
    if (days < 30) return 'bg-yellow-50 border-l-4 border-accent-500';
    return '';
  };

  const freqPreview = formatFrequency(form.frequency);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-warm-900">Maintenance</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-accent-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-accent-600 text-sm">
          Add Task
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Task' : 'Add Task'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Task Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400 col-span-2" />
          <div className="col-span-2">
            <div className="flex items-center gap-3">
              <input required placeholder="e.g. 2w, 3m, 1y" value={form.frequency}
                onChange={e => setForm({...form, frequency: e.target.value})}
                className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 placeholder:text-warm-400 flex-1" />
              {form.frequency && (
                <span className={`text-sm ${freqPreview ? 'text-sage-600' : 'text-red-500'}`}>
                  {freqPreview ? `Every ${freqPreview}` : 'Invalid format'}
                </span>
              )}
            </div>
            <p className="text-xs text-warm-400 mt-1">d = days, w = weeks, m = months, y = years</p>
          </div>
          <div>
            <label className="block text-xs text-warm-500 mb-1">Last Completed</label>
            <input type="date" value={form.last_completed} onChange={e => setForm({...form, last_completed: e.target.value})}
              className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 w-full" />
          </div>
          <div>
            <label className="block text-xs text-warm-500 mb-1">Next Due</label>
            <input type="date" value={form.next_due} onChange={e => setForm({...form, next_due: e.target.value})}
              className="border border-warm-300 rounded-lg px-3.5 py-2.5 text-sm text-warm-800 bg-warm-50 w-full" />
          </div>
          <button type="submit" disabled={!freqPreview} className="col-span-2 bg-sage-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-sage-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <Modal open={completeId !== null} onClose={() => { setCompleteId(null); setCompleteCost(''); }} title="Complete Task">
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

      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className={`bg-white rounded-xl border border-warm-200 p-4 flex items-center justify-between ${urgencyColor(t.next_due)}`}>
            <div>
              <Link to={`/maintenance/${t.id}`} className="font-medium text-accent-800 hover:text-accent-600 transition-colors">{t.name}</Link>
              <div className="text-xs text-warm-400 mt-1">
                Every {formatFrequency(t.frequency) || t.frequency} &middot;
                Due: {t.next_due ? parseLocalDate(t.next_due).toLocaleDateString() : 'Not set'} &middot;
                Last: {t.last_completed ? parseLocalDate(t.last_completed).toLocaleDateString() : 'Never'}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCompleteId(t.id)} className="bg-sage-700 text-white px-3 py-1 rounded-lg text-xs hover:bg-sage-800">
                Mark Complete
              </button>
              <button onClick={() => startEdit(t)} className="text-accent-700 hover:text-accent-900 text-xs font-medium">Edit</button>
              <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-warm-400 text-sm italic p-8 text-center">No maintenance tasks.</p>}
      </div>
    </div>
  );
}
