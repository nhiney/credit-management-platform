import { useEffect, useState } from 'react';
import {
  Users,
  ArrowLeftRight,
  Zap,
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { AdminTransaction, PaginatedResponse } from '@/types';
import { cn } from '@/lib/utils';
import AdminNav from '@/components/layout/AdminNav';

const TYPE_CONFIG = {
  CREDIT_IN: {
    label: 'Credit In',
    icon: TrendingUp,
    cls: 'text-emerald-600 bg-emerald-50',
    amt: 'text-emerald-600',
    prefix: '+',
  },
  CREDIT_OUT: {
    label: 'Credit Out',
    icon: TrendingDown,
    cls: 'text-red-500 bg-red-50',
    amt: 'text-red-500',
    prefix: '-',
  },
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
};

interface Stats {
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  totalCreditsIssued: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTx, setRecentTx] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, txRes] = await Promise.all([
          api.get('/users?limit=1'),
          api.get<PaginatedResponse<AdminTransaction>>('/transactions?page=1&limit=10'),
        ]);

        const allTxRes = await api.get<PaginatedResponse<AdminTransaction>>(
          '/transactions?page=1&limit=1000',
        );
        const allTx = allTxRes.data.data;

        const totalRevenue = allTx
          .filter((t) => t.transactionType === 'CREDIT_IN')
          .reduce((sum, t) => sum + t.amount, 0);

        setStats({
          totalUsers: usersRes.data.meta.total,
          totalTransactions: txRes.data.meta.total,
          totalRevenue,
          totalCreditsIssued: totalRevenue,
        });
        setRecentTx(txRes.data.data);
      } catch {
        toast.error('Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="mt-1 text-sm text-slate-500">System-wide statistics and recent activity</p>
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Total Users',
              value: stats?.totalUsers ?? 0,
              icon: Users,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'Total Transactions',
              value: stats?.totalTransactions ?? 0,
              icon: ArrowLeftRight,
              color: 'text-violet-600',
              bg: 'bg-violet-50',
            },
            {
              label: 'Credits Issued',
              value: stats?.totalCreditsIssued ?? 0,
              icon: Zap,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Credit Revenue',
              value: `${stats?.totalRevenue ?? 0} cr`,
              icon: DollarSign,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className={cn('mb-3 inline-flex items-center gap-2 rounded-xl p-2', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Transactions</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">User</th>
                  <th className="px-5 py-3.5 text-left">Type</th>
                  <th className="px-5 py-3.5 text-left">Description</th>
                  <th className="px-5 py-3.5 text-left">Amount</th>
                  <th className="px-5 py-3.5 text-left">Balance After</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTx.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      No transactions yet
                    </td>
                  </tr>
                )}
                {recentTx.map((tx) => {
                  const cfg = TYPE_CONFIG[tx.transactionType];
                  const Icon = cfg.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {(tx as AdminTransaction).user?.email ?? '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                            cfg.cls,
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 max-w-[180px] truncate">
                        {tx.description ?? '—'}
                      </td>
                      <td className={cn('px-5 py-3.5 font-semibold tabular-nums', cfg.amt)}>
                        {cfg.prefix}
                        {tx.amount}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-slate-700">{tx.balanceAfter}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            STATUS_CLASS[tx.status],
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
