import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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

type FilterType = 'ALL' | 'CREDIT_IN' | 'CREDIT_OUT';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');

  const load = async (page = 1, f: FilterType = filter) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<AdminTransaction>>(
        `/transactions?page=${page}&limit=20`,
      );
      let data = res.data.data;
      if (f !== 'ALL') data = data.filter((t) => t.transactionType === f);
      setTransactions(data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, filter);
  }, [filter]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All Transactions</h1>
            <p className="mt-1 text-sm text-slate-500">{meta.total} total transactions</p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
            <Filter className="ml-2 h-4 w-4 text-slate-400" />
            {(['ALL', 'CREDIT_IN', 'CREDIT_OUT'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {f === 'ALL' ? 'All' : f === 'CREDIT_IN' ? 'Credit In' : 'Credit Out'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">User</th>
                <th className="px-5 py-4 text-left">Type</th>
                <th className="px-5 py-4 text-left">Description</th>
                <th className="px-5 py-4 text-left">Amount</th>
                <th className="px-5 py-4 text-left">Balance Before</th>
                <th className="px-5 py-4 text-left">Balance After</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                  </td>
                </tr>
              )}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No transactions found
                  </td>
                </tr>
              )}
              {!loading &&
                transactions.map((tx) => {
                  const cfg = TYPE_CONFIG[tx.transactionType];
                  const Icon = cfg.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[140px] truncate">
                        {tx.user?.email ?? '—'}
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
                      <td className="px-5 py-3.5 tabular-nums text-slate-500">
                        {tx.balanceBefore}
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
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
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
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
              <span>
                Page {meta.page} of {meta.totalPages} · {meta.total} records
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  onClick={() => load(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
