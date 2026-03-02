import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import type { FileAttachment } from '../api/client';

interface Props {
  entityType: string;
  entityId: number;
}

export default function FileAttachments({ entityType, entityId }: Props) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = () => api.listFiles(entityType, entityId).then(setFiles);

  useEffect(() => { load(); }, [entityType, entityId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await api.uploadFile(entityType, entityId, file);
    if (fileInput.current) fileInput.current.value = '';
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file?')) return;
    await api.deleteFile(id);
    load();
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Attachments</h3>
      <input ref={fileInput} type="file" onChange={handleUpload} className="mb-3 text-sm" />
      {files.length === 0 ? (
        <p className="text-gray-500 text-sm">No files attached.</p>
      ) : (
        <ul className="space-y-1">
          {files.map(f => (
            <li key={f.id} className="flex items-center gap-3 text-sm">
              <a href={api.getFileUrl(f.id)} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                {f.filename}
              </a>
              <span className="text-gray-400">{new Date(f.uploaded_at).toLocaleDateString()}</span>
              <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
