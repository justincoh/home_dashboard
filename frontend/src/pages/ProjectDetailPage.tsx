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

  if (!project) return <p className="text-gray-500">Loading...</p>;

  const statusColors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
  };

  return (
    <div>
      <Link to="/projects" className="text-blue-600 hover:underline text-sm">&larr; Back to Projects</Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">{project.name}</h1>
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Status:</span>{' '}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[project.status]}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <div><span className="font-medium">Budget:</span> {project.budget ? fmt$(project.budget) : '—'}</div>
          <div><span className="font-medium">Actual Cost:</span> {project.actual_cost ? fmt$(project.actual_cost) : '—'}</div>
          <div><span className="font-medium">Start Date:</span> {project.start_date ? parseLocalDate(project.start_date).toLocaleDateString() : '—'}</div>
          <div><span className="font-medium">End Date:</span> {project.end_date ? parseLocalDate(project.end_date).toLocaleDateString() : '—'}</div>
        </div>
        {project.description && <p className="mt-3 text-sm text-gray-600">{project.description}</p>}
      </div>

      <h2 className="text-lg font-semibold mb-2">Quotes</h2>
      {quotes.length === 0 ? <p className="text-gray-500 text-sm mb-6">No quotes for this project.</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotes.map(q => (
                <tr key={q.id}>
                  <td className="px-4 py-3"><Link to={`/quotes/${q.id}`} className="text-blue-600 hover:underline">{fmt$(q.amount)}</Link></td>
                  <td className="px-4 py-3">{q.vendor ? <Link to={`/vendors/${q.vendor.id}`} className="text-blue-600 hover:underline">{q.vendor.name}</Link> : '—'}</td>
                  <td className="px-4 py-3">{parseLocalDate(q.date_received).toLocaleDateString()}</td>
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
