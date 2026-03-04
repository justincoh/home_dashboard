import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardData } from '../api/client';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => { api.getDashboard().then(setData); }, []);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Maintenance */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Upcoming Maintenance</h2>
          {data.upcoming_maintenance.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming tasks.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcoming_maintenance.map(t => (
                <li key={t.id} className="flex justify-between text-sm">
                  <Link to="/maintenance" className="text-blue-600 hover:underline">{t.name}</Link>
                  <span className={`${t.next_due && new Date(t.next_due) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {t.next_due ? new Date(t.next_due).toLocaleDateString() : 'No date'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Active Projects</h2>
          {data.active_projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No active projects.</p>
          ) : (
            <ul className="space-y-2">
              {data.active_projects.map(p => (
                <li key={p.id} className="flex justify-between text-sm">
                  <Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    p.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expiring Contracts */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Expiring Contracts</h2>
          {data.expiring_contracts.length === 0 ? (
            <p className="text-gray-500 text-sm">No contracts expiring soon.</p>
          ) : (
            <ul className="space-y-2">
              {data.expiring_contracts.map(c => (
                <li key={c.id} className="flex justify-between text-sm">
                  <Link to={`/contracts/${c.id}`} className="text-blue-600 hover:underline">{c.name}</Link>
                  <span className="text-gray-500">{c.end_date ? new Date(c.end_date).toLocaleDateString() : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Recent Utility Bills</h2>
          {data.recent_bills.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent bills.</p>
          ) : (
            <ul className="space-y-2">
              {data.recent_bills.map(b => (
                <li key={b.id} className="flex justify-between text-sm">
                  <span>{b.provider_name ? `${b.provider_name} — ` : ''}{new Date(b.bill_date).toLocaleDateString()}</span>
                  <span className="font-medium">${b.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
