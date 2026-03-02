import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { MaintenanceTask } from '../api/client';
import Modal from '../components/Modal';

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', frequency: 'monthly' as MaintenanceTask['frequency'],
    last_completed: '', next_due: '',
  });

  const load = () => api.listMaintenance().then(setTasks);
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', frequency: 'monthly', last_completed: '', next_due: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      frequency: form.frequency,
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

  const handleComplete = async (id: number) => {
    await api.completeMaintenance(id);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    await api.deleteMaintenance(id);
    load();
  };

  const urgencyColor = (nextDue: string | null) => {
    if (!nextDue) return '';
    const days = Math.ceil((new Date(nextDue).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'bg-red-50 border-l-4 border-red-500';
    if (days < 7) return 'bg-orange-50 border-l-4 border-orange-500';
    if (days < 30) return 'bg-yellow-50 border-l-4 border-yellow-400';
    return '';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          Add Task
        </button>
      </div>

      <Modal open={showForm} onClose={resetForm} title={editId ? 'Edit Task' : 'Add Task'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Task Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value as MaintenanceTask['frequency']})}
            className="border rounded px-3 py-2 text-sm">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semi_annual">Semi-Annual</option>
            <option value="annual">Annual</option>
          </select>
          <input type="date" placeholder="Last Completed" value={form.last_completed} onChange={e => setForm({...form, last_completed: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input type="date" placeholder="Next Due" value={form.next_due} onChange={e => setForm({...form, next_due: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <button type="submit" className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            {editId ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className={`bg-white rounded-lg shadow p-4 flex items-center justify-between ${urgencyColor(t.next_due)}`}>
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {t.frequency.replace('_', '-')} &middot;
                Due: {t.next_due ? new Date(t.next_due).toLocaleDateString() : 'Not set'} &middot;
                Last: {t.last_completed ? new Date(t.last_completed).toLocaleDateString() : 'Never'}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleComplete(t.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                Mark Complete
              </button>
              <button onClick={() => startEdit(t)} className="text-blue-600 hover:underline text-xs">Edit</button>
              <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline text-xs">Delete</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-gray-500 text-sm">No maintenance tasks.</p>}
      </div>
    </div>
  );
}
