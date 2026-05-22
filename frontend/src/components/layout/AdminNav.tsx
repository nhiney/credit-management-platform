import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/packages', label: 'Packages', icon: Package, exact: false },
  { to: '/admin/users', label: 'Users', icon: Users, exact: false },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight, exact: false },
];

export default function AdminNav() {
  const { pathname } = useLocation();

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
        {LINKS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition',
                active
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
