import { Link, useLocation } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/packages', label: 'Packages' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/transactions', label: 'Transactions' },
];

export default function Navbar({ user, onLogout }: NavbarProps) {
  const { pathname } = useLocation();
  const [adminOpen, setAdminOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/features', label: 'Features', icon: Sparkles },
    { to: '/packages', label: 'Packages', icon: ShoppingBag },
  ];

  const isAdminActive = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Zap className="h-4 w-4" />
          </span>
          CreditFlow
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {userLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === to
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          {/* Admin dropdown */}
          {user?.role === 'ADMIN' && (
            <div ref={dropRef} className="relative">
              <button
                onClick={() => setAdminOpen((o) => !o)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isAdminActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', adminOpen && 'rotate-180')}
                />
              </button>

              {adminOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {ADMIN_LINKS.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setAdminOpen(false)}
                      className={cn(
                        'flex items-center px-4 py-2.5 text-sm transition-colors',
                        pathname === to || (to !== '/admin' && pathname.startsWith(to))
                          ? 'bg-violet-50 font-medium text-violet-700'
                          : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User & credits */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
            <Zap className="h-3.5 w-3.5" />
            {user?.currentCredits ?? 0} credits
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">{user?.email}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
