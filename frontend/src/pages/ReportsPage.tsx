import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { AnnualReport } from '../api/client';
import { parseLocalDate } from '../utils/dates';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

function BreakdownBar({ label, total, max, to }: { label: string; total: number; max: number; to?: string }) {
  const pct = max > 0 ? (total / max) * 100 : 0;
  return (
    <li className="text-sm">
      <div className="flex justify-between mb-1">
        <span className="text-warm-700">
          {to ? <Link to={to} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{label}</Link> : label}
        </span>
        <span className="font-medium text-warm-800">{fmt$(total)}</span>
      </div>
      <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
        <div className="h-full bg-accent-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

export default function ReportsPage() {
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState<AnnualReport | null>(null);
  const [loadedYear, setLoadedYear] = useState<number | null>(null);
  const loading = loadedYear !== year;

  useEffect(() => {
    let stale = false;
    api.getAnnualReport(year).then(data => {
      if (stale) return;
      setReport(data);
      setLoadedYear(year);
    });
    return () => { stale = true; };
  }, [year]);

  const catMax = report ? Math.max(...report.by_category.map(c => c.total), 1) : 1;
  const provMax = report ? Math.max(...report.by_provider.map(p => p.total), 1) : 1;
  const projMax = report ? Math.max(...report.by_project.map(p => p.total), 1) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-warm-900">Annual Expense Report</h1>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-accent-500">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-warm-400 font-medium animate-pulse">Loading...</p>
      ) : report ? (
        <>
          <div className="bg-warm-900 text-white rounded-xl p-6 mb-6">
            <p className="text-warm-400 text-sm font-medium mb-1">Grand Total for {report.year}</p>
            <p className="font-heading text-3xl">{fmt$(report.grand_total)}</p>
            <p className="text-warm-400 text-xs mt-2">
              Log {fmt$(report.log_total)} · Contracts {fmt$(report.contracts_total)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-warm-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg text-warm-800">By Category</h2>
                <span className="font-heading text-lg text-warm-900">{fmt$(report.log_total)}</span>
              </div>
              {report.by_category.length === 0 ? (
                <p className="text-warm-400 text-sm italic">No logged expenses this year.</p>
              ) : (
                <ul className="space-y-3">
                  {report.by_category.map(c => (
                    <BreakdownBar key={c.category} label={c.category} total={c.total} max={catMax} />
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-warm-200 p-6">
              <h2 className="font-heading text-lg text-warm-800 mb-4">By Provider</h2>
              {report.by_provider.length === 0 ? (
                <p className="text-warm-400 text-sm italic">No provider expenses this year.</p>
              ) : (
                <ul className="space-y-3">
                  {report.by_provider.map(p => (
                    <BreakdownBar key={p.provider_id} label={p.provider_name} total={p.total} max={provMax} to={`/providers/${p.provider_id}`} />
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-warm-200 p-6">
              <h2 className="font-heading text-lg text-warm-800 mb-4">By Project</h2>
              {report.by_project.length === 0 ? (
                <p className="text-warm-400 text-sm italic">No project-tagged expenses this year.</p>
              ) : (
                <ul className="space-y-3">
                  {report.by_project.map(p => (
                    <BreakdownBar key={p.project_id} label={p.project_name} total={p.total} max={projMax} to={`/projects/${p.project_id}`} />
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-warm-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg text-warm-800">Contracts</h2>
                <span className="font-heading text-lg text-warm-900">{fmt$(report.contracts_total)}</span>
              </div>
              {report.contracts.length === 0 ? (
                <p className="text-warm-400 text-sm italic">No contract expenses this year.</p>
              ) : (
                <ul className="space-y-3">
                  {report.contracts.map(c => (
                    <li key={c.id} className="flex justify-between items-start text-sm">
                      <div>
                        <Link to={`/contracts/${c.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{c.name}</Link>
                        {c.start_date && (
                          <p className="text-warm-400 text-xs mt-0.5">
                            {parseLocalDate(c.start_date).toLocaleDateString()}{c.end_date ? ` — ${parseLocalDate(c.end_date).toLocaleDateString()}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-warm-800 whitespace-nowrap ml-2">{c.cost != null ? fmt$(c.cost) : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
