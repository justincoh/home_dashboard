import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { AnnualReport } from '../api/client';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

interface ExpenseItem {
  id: number;
  name: string;
  cost: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface ExpenseCardProps {
  title: string;
  total: number;
  emptyMessage: string;
  basePath: string;
  items: ExpenseItem[];
}

function ExpenseCard({ title, total, emptyMessage, basePath, items }: ExpenseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-warm-200 p-6 hover:border-warm-300 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg text-warm-800">{title}</h2>
        <span className="font-heading text-lg text-warm-900">{fmt$(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-warm-400 text-sm italic">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {items.map(item => (
            <li key={item.id} className="flex justify-between items-start text-sm">
              <div>
                <Link to={`${basePath}/${item.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">
                  {item.name}
                </Link>
                {item.start_date && (
                  <p className="text-warm-400 text-xs mt-0.5">
                    {item.start_date}{item.end_date ? ` — ${item.end_date}` : ''}
                  </p>
                )}
              </div>
              <span className="font-medium text-warm-800 whitespace-nowrap ml-2">
                {item.cost != null ? fmt$(item.cost) : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
          <div className="bg-warm-900 text-white rounded-xl p-6 mb-6">
            <p className="text-warm-400 text-sm font-medium mb-1">Grand Total for {report.year}</p>
            <p className="font-heading text-3xl">{fmt$(report.grand_total)}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Utilities -- uses a table layout, so rendered directly */}
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

            <ExpenseCard
              title="Projects"
              total={report.projects_total}
              emptyMessage="No project expenses this year."
              basePath="/projects"
              items={report.projects.map(p => ({
                id: p.id, name: p.name, cost: p.actual_cost,
                start_date: p.start_date, end_date: p.end_date,
              }))}
            />

            <ExpenseCard
              title="Contracts"
              total={report.contracts_total}
              emptyMessage="No contract expenses this year."
              basePath="/contracts"
              items={report.contracts.map(c => ({
                id: c.id, name: c.name, cost: c.cost,
                start_date: c.start_date, end_date: c.end_date,
              }))}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
