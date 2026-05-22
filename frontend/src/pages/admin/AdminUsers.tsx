import { useEffect, useState } from 'react';
import {
  Loader2,
  Zap,
  ShieldCheck,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { User, PaginatedResponse } from '@/types';
import { cn } from '@/lib/utils';
import AdminNav from '@/components/layout/AdminNav';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<User>>(`/users?page=${page}&limit=20`);
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              {meta.total} registered user{meta.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">User</th>
                <th className="px-5 py-4 text-left">Role</th>
                <th className="px-5 py-4 text-left">Credits</th>
                <th className="px-5 py-4 text-left">Active Packages</th>
                <th className="px-5 py-4 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <UserIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.email}</p>
                          <p className="text-xs text-slate-400">{user.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                          user.role === 'ADMIN'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {user.role === 'ADMIN' && <ShieldCheck className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 font-semibold text-amber-600">
                        <Zap className="h-3.5 w-3.5" />
                        {user.currentCredits}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {(user.userPackages ?? []).length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(user.userPackages ?? []).map((up) => (
                            <span
                              key={up.id}
                              className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {up.package.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
              <span>
                Page {meta.page} of {meta.totalPages} · {meta.total} users
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
