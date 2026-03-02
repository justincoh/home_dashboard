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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-8">
            <Link to="/" className="text-xl font-bold text-gray-900">Home Dashboard</Link>
            <div className="flex gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
