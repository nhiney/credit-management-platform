import { useEffect, useState, useCallback } from 'react';
import { Zap, TrendingUp, TrendingDown, RefreshCw, Loader2, XCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { User, Transaction, PaginatedResponse } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardProps {
  onCreditRefresh: () => Promise<User>;
}

const TYPE_CONFIG = {
  CREDIT_IN: {
    label: 'Credit In',
    icon: TrendingUp,
    className: 'text-emerald-600 bg-emerald-50',
    amountClass: 'text-emerald-600',
    prefix: '+',
  },
  CREDIT_OUT: {
    label: 'Credit Out',
    icon: TrendingDown,
    className: 'text-red-500 bg-red-50',
    amountClass: 'text-red-500',
    prefix: '-',
  },
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function DashboardPage({ onCreditRefresh }: DashboardProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    try {
      const [profileRes, txRes] = await Promise.all([
        api.get<User>('/users/me'),
        api.get<PaginatedResponse<Transaction>>(`/transactions/me?page=${page}&limit=10`),
      ]);
      setProfile(profileRes.data);
      setTransactions(txRes.data.data);
      setMeta(txRes.data.meta);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (packageId: string) => {
    setCancellingId(packageId);
    try {
      await api.delete(`/purchase/${packageId}`);
      toast.success('Package cancelled successfully');
      setConfirmCancelId(null);
      await Promise.all([onCreditRefresh(), fetchData()]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cancellation failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setCancellingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([onCreditRefresh(), fetchData()]);
      toast.success('Data refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">{profile?.email}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Zap className="h-4 w-4 text-amber-500" />
            Current Balance
          </div>
          <p className="text-4xl font-bold text-slate-900">{profile?.currentCredits ?? 0}</p>
          <p className="mt-1 text-sm text-slate-400">credits available</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Total Transactions
          </div>
          <p className="text-4xl font-bold text-slate-900">{meta.total}</p>
          <p className="mt-1 text-sm text-slate-400">all time</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Zap className="h-4 w-4 text-blue-500" />
            Active Packages
          </div>
          <p className="text-4xl font-bold text-slate-900">{profile?.userPackages?.length ?? 0}</p>
          <p className="mt-1 text-sm text-slate-400">subscriptions</p>
        </div>
      </div>

      {/* Active packages */}
      {profile?.userPackages && profile.userPackages.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Active Packages</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.userPackages.map((up) => (
              <div
                key={up.id}
                className="flex flex-col rounded-xl border border-blue-100 bg-blue-50 p-4"
              >
                {/* Package info */}
                <div className="mb-3 flex-1">
                  <p className="font-semibold text-blue-900">{up.package.name}</p>
                  <p className="mt-1 text-xs text-blue-600">
                    {up.package.packageFeatures.map((pf) => pf.feature.codeName).join(' · ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Since{' '}
                    {new Date(up.purchasedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Cancel action */}
                {confirmCancelId === up.package.id ? (
                  <div className="flex items-center gap-2 border-t border-blue-200 pt-3">
                    <p className="flex-1 text-xs text-slate-600">Cancel this package?</p>
                    <button
                      onClick={() => handleCancel(up.package.id)}
                      disabled={cancellingId === up.package.id}
                      className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-60"
                    >
                      {cancellingId === up.package.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmCancelId(null)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancelId(up.package.id)}
                    className="mt-2 flex items-center gap-1.5 self-start rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel Package
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Transaction History</h2>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Zap className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-slate-500">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Balance After</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const cfg = TYPE_CONFIG[tx.transactionType];
                  const Icon = cfg.icon;
                  return (
                    <tr key={tx.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                            cfg.className,
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {tx.description ?? tx.feature?.codeName ?? tx.package?.name ?? '—'}
                      </td>
                      <td className={cn('px-6 py-4 font-semibold tabular-nums', cfg.amountClass)}>
                        {cfg.prefix}
                        {tx.amount}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-slate-700">{tx.balanceAfter}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            STATUS_CLASS[tx.status],
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
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

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} total
                </span>
                <div className="flex gap-2">
                  {meta.page > 1 && (
                    <button
                      onClick={() => fetchData(meta.page - 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
                    >
                      Previous
                    </button>
                  )}
                  {meta.page < meta.totalPages && (
                    <button
                      onClick={() => fetchData(meta.page + 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
