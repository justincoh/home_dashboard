import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/projects', label: 'Projects' },
  { path: '/maintenance', label: 'Maintenance' },
  { path: '/utilities', label: 'Utilities' },
  { path: '/contracts', label: 'Contracts' },
  { path: '/vendors', label: 'Vendors' },
  { path: '/quotes', label: 'Quotes' },
];

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen">
      <nav className="bg-warm-900 border-b-2 border-accent-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-8">
            <Link to="/" className="font-heading text-xl text-warm-50 tracking-wide">Home Dashboard</Link>
            <div className="flex gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                      ? 'bg-warm-800 text-accent-400'
                      : 'text-warm-400 hover:text-warm-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
