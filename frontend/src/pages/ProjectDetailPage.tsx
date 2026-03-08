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

  if (!project) return <p className="text-holo-500 font-medium animate-pulse">Loading...</p>;

  const statusColors: Record<string, string> = {
    planned: 'bg-cyber-800/30 text-cyber-300 ring-1 ring-inset ring-cyber-700 rounded-full',
    in_progress: 'bg-neon-900/30 text-neon-300 ring-1 ring-inset ring-neon-700 rounded-full',
    done: 'bg-matrix-800/30 text-matrix-200 ring-1 ring-inset ring-matrix-700 rounded-full',
  };

  return (
    <div>
      <Link to="/projects" className="text-holo-500 hover:text-neon-400 text-sm font-medium transition-colors">&larr; Back to Projects</Link>
      <h1 className="font-heading text-2xl text-holo-50 mt-2 mb-4">{project.name}</h1>
      <div className="bg-void-400 rounded-xl border border-void-200 p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Status</div>
            <span className={`px-2 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Budget</div>
            <div>{project.budget ? fmt$(project.budget) : '—'}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Actual Cost</div>
            <div>{project.actual_cost ? fmt$(project.actual_cost) : '—'}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">Start Date</div>
            <div>{project.start_date ? parseLocalDate(project.start_date).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-holo-500 text-xs font-semibold uppercase tracking-wider mb-1">End Date</div>
            <div>{project.end_date ? parseLocalDate(project.end_date).toLocaleDateString() : '—'}</div>
          </div>
        </div>
        {project.description && <p className="text-holo-300 leading-relaxed border-t border-void-200 pt-4 mt-4">{project.description}</p>}
      </div>

      <h2 className="font-heading text-lg text-holo-100 mb-2">Quotes</h2>
      {quotes.length === 0 ? <p className="text-holo-600 text-sm italic mb-6">No quotes for this project.</p> : (
        <div className="bg-void-400 rounded-xl border border-void-200 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-void-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Vendor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-holo-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-void-200">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-void-50 transition-colors">
                  <td className="px-5 py-4"><Link to={`/quotes/${q.id}`} className="text-neon-400 hover:text-neon-300 font-medium transition-colors">{fmt$(q.amount)}</Link></td>
                  <td className="px-5 py-4">{q.vendor ? <Link to={`/vendors/${q.vendor.id}`} className="text-neon-400 hover:text-neon-300 font-medium transition-colors">{q.vendor.name}</Link> : '—'}</td>
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
