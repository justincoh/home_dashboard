import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/50"
      style={{ animation: 'modalBackdropEnter 0.2s ease-out' }}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-warm-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'modalContentEnter 0.25s ease-out' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="font-heading text-lg text-warm-800">{title}</h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
