import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt$ } from '../api/client';
import type { Project, Quote } from '../api/client';
import { parseLocalDate } from '../utils/dates';
import FileAttachments from '../components/FileAttachments';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    if (!id) return;
    const pid = Number(id);
    api.getProject(pid).then(setProject);
    api.listQuotes({ project_id: pid }).then(setQuotes);
  }, [id]);

  if (!project) return <p className="text-warm-400 font-medium animate-pulse">Loading...</p>;

  const statusColors: Record<string, string> = {
    planned: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 rounded-full',
    in_progress: 'bg-accent-50 text-accent-800 ring-1 ring-inset ring-accent-200 rounded-full',
    done: 'bg-sage-50 text-sage-800 ring-1 ring-inset ring-sage-200 rounded-full',
  };

  return (
    <div>
      <Link to="/projects" className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors">&larr; Back to Projects</Link>
      <h1 className="font-heading text-2xl text-warm-900 mt-2 mb-4">{project.name}</h1>
      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Status</div>
            <span className={`px-2 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Budget</div>
            <div>{project.budget ? fmt$(project.budget) : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Actual Cost</div>
            <div>{project.actual_cost ? fmt$(project.actual_cost) : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">Start Date</div>
            <div>{project.start_date ? parseLocalDate(project.start_date).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-warm-500 text-xs font-semibold uppercase tracking-wider mb-1">End Date</div>
            <div>{project.end_date ? parseLocalDate(project.end_date).toLocaleDateString() : '—'}</div>
          </div>
        </div>
        {project.description && <p className="text-warm-600 leading-relaxed border-t border-warm-100 pt-4 mt-4">{project.description}</p>}
      </div>

      <h2 className="font-heading text-lg text-warm-800 mb-2">Quotes</h2>
      {quotes.length === 0 ? <p className="text-warm-400 text-sm italic mb-6">No quotes for this project.</p> : (
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-warm-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Vendor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-warm-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-5 py-4"><Link to={`/quotes/${q.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{fmt$(q.amount)}</Link></td>
                  <td className="px-5 py-4">{q.vendor ? <Link to={`/vendors/${q.vendor.id}`} className="text-accent-800 hover:text-accent-600 font-medium transition-colors">{q.vendor.name}</Link> : '—'}</td>
                  <td className="px-5 py-4">{parseLocalDate(q.date_received).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FileAttachments entityType="project" entityId={Number(id)} />
    </div>
  );
}
