import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import type { DashboardData } from '../api/client';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => { api.getDashboard().then(setData); }, []);

  if (!data) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  return (
    <div>
      <h1 className="font-heading text-2xl text-warm-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Maintenance */}
        <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
          <h2 className="font-heading text-lg text-warm-800 mb-3">Upcoming Maintenance</h2>
          {data.upcoming_maintenance.length === 0 ? (
            <p className="text-warm-400 text-sm italic">No upcoming tasks.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcoming_maintenance.map(t => (
                <li key={t.id} className="flex justify-between text-sm">
                  <Link to="/maintenance" className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{t.name}</Link>
                  <span className={`${t.next_due && parseLocalDate(t.next_due) < new Date() ? 'text-red-600 font-semibold' : 'text-warm-400'}`}>
                    {t.next_due ? parseLocalDate(t.next_due).toLocaleDateString() : 'No date'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active Projects — hidden when empty */}
        {data.active_projects.length > 0 && (
          <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
            <h2 className="font-heading text-lg text-warm-800 mb-3">Active Projects</h2>
            <ul className="space-y-2">
              {data.active_projects.map(p => (
                <li key={p.id} className="flex justify-between text-sm">
                  <Link to={`/projects/${p.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{p.name}</Link>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                    p.status === 'in_progress' ? 'bg-accent-50 text-accent-800 ring-accent-200' : 'bg-blue-50 text-blue-700 ring-blue-200'
                  }`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expiring Contracts — hidden when empty */}
        {data.expiring_contracts.length > 0 && (
          <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
            <h2 className="font-heading text-lg text-warm-800 mb-3">Expiring Contracts</h2>
            <ul className="space-y-2">
              {data.expiring_contracts.map(c => (
                <li key={c.id} className="flex justify-between text-sm">
                  <Link to={`/contracts/${c.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{c.name}</Link>
                  <span className="text-warm-400">{c.end_date ? parseLocalDate(c.end_date).toLocaleDateString() : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Bills */}
        <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
          <h2 className="font-heading text-lg text-warm-800 mb-3">Recent Utility Bills</h2>
          {data.recent_bills.length === 0 ? (
            <p className="text-warm-400 text-sm italic">No recent bills.</p>
          ) : (
            <ul className="space-y-2">
              {data.recent_bills.map(b => (
                <li key={b.id} className="flex justify-between text-sm">
                  <span className="text-warm-600">{b.provider_name ? `${b.provider_name} — ` : ''}{parseLocalDate(b.bill_date).toLocaleDateString()}</span>
                  <span className="font-medium text-warm-800">{fmt$(b.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
