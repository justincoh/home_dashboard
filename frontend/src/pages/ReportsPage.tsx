import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { AnnualReport } from '../api/client';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

export default function ReportsPage() {
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState<AnnualReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAnnualReport(year).then(data => {
      setReport(data);
      setLoading(false);
    });
  }, [year]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-warm-900">Annual Expense Report</h1>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-warm-400 font-medium animate-pulse">Loading...</p>
      ) : report ? (
        <>
          {/* Grand Total */}
          <div className="bg-warm-900 text-white rounded-xl p-6 mb-6">
            <p className="text-warm-400 text-sm font-medium mb-1">Grand Total for {report.year}</p>
            <p className="font-heading text-3xl">{fmt$(report.grand_total)}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Utilities */}
            <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg text-warm-800">Utilities</h2>
                <span className="font-heading text-lg text-warm-900">{fmt$(report.utilities_total)}</span>
              </div>
              {report.utilities_breakdown.length === 0 ? (
                <p className="text-warm-400 text-sm italic">No utility bills this year.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-warm-500 text-left border-b border-warm-100">
                      <th className="pb-2 font-medium">Provider</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.utilities_breakdown.map(u => (
                      <tr key={u.utility_id} className="border-b border-warm-50">
                        <td className="py-2">
                          <Link to={`/utilities/${u.utility_id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">
                            {u.provider_name}
                          </Link>
                          <span className="text-warm-400 ml-1 text-xs">({u.utility_type})</span>
                        </td>
                        <td className="py-2 text-right text-warm-800 font-medium">{fmt$(u.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Projects */}
            <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg text-warm-800">Projects</h2>
                <span className="font-heading text-lg text-warm-900">{fmt$(report.projects_total)}</span>
              </div>
              {report.projects.length === 0 ? (
                <p className="text-warm-400 text-sm italic">No project expenses this year.</p>
              ) : (
                <ul className="space-y-3">
                  {report.projects.map(p => (
                    <li key={p.id} className="flex justify-between items-start text-sm">
                      <div>
                        <Link to={`/projects/${p.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">
                          {p.name}
                        </Link>
                        {p.start_date && (
                          <p className="text-warm-400 text-xs mt-0.5">
                            {p.start_date}{p.end_date ? ` — ${p.end_date}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-warm-800 whitespace-nowrap ml-2">{p.actual_cost != null ? fmt$(p.actual_cost) : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Contracts */}
            <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
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
                        <Link to={`/contracts/${c.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">
                          {c.name}
                        </Link>
                        {c.start_date && (
                          <p className="text-warm-400 text-xs mt-0.5">
                            {c.start_date}{c.end_date ? ` — ${c.end_date}` : ''}
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
