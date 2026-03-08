import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { SearchResult } from '../api/client';

const ENTITY_LABELS: Record<string, string> = {
  vendor: 'Vendors',
  project: 'Projects',
  contract: 'Contracts',
  utility: 'Utilities',
  maintenance: 'Maintenance',
};

const ENTITY_PATHS: Record<string, string> = {
  vendor: '/vendors',
  project: '/projects',
  contract: '/contracts',
  utility: '/utilities',
  maintenance: '/maintenance',
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      setSearched(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      api.search(query).then(data => {
        setResults(data);
        setOpen(true);
        setSearched(true);
      });
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Group results by entity_type
  const grouped: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!grouped[r.entity_type]) grouped[r.entity_type] = [];
    grouped[r.entity_type].push(r);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0 || searched) setOpen(true); }}
        onKeyDown={handleKeyDown}
        className="w-48 lg:w-64 bg-warm-800 text-warm-100 border border-warm-700 rounded-lg px-3 py-1.5 text-sm placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
      />
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-warm-200 shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length === 0 && searched ? (
            <p className="p-4 text-warm-400 text-sm italic">No results found.</p>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-warm-500 uppercase tracking-wider">
                  {ENTITY_LABELS[type] || type}
                </p>
                {items.map(item => (
                  <Link
                    key={`${item.entity_type}-${item.id}`}
                    to={`${ENTITY_PATHS[item.entity_type] || `/${item.entity_type}s`}/${item.id}`}
                    onClick={() => { setOpen(false); setQuery(''); }}
                    className="block px-4 py-2 hover:bg-warm-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-warm-800">{item.name}</span>
                    {item.subtitle && (
                      <span className="text-xs text-warm-400 ml-2">{item.subtitle}</span>
                    )}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
