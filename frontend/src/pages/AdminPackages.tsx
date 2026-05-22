import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  X,
  Check,
  Zap,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Feature, Package } from '@/types';
import { cn } from '@/lib/utils';

interface PackageForm {
  name: string;
  description: string;
  price: string;
  creditAmount: string;
  isActive: boolean;
  featureIds: string[];
}

const EMPTY_FORM: PackageForm = {
  name: '',
  description: '',
  price: '',
  creditAmount: '',
  isActive: true,
  featureIds: [],
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [pkgRes, featRes] = await Promise.all([
        api.get<Package[]>('/packages/admin/all'),
        api.get<Feature[]>('/packages/features'),
      ]);
      setPackages(pkgRes.data);
      setFeatures(featRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description ?? '',
      price: pkg.price,
      creditAmount: String(pkg.creditAmount),
      isActive: pkg.isActive,
      featureIds: pkg.packageFeatures.map((pf) => pf.feature.id),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const toggleFeature = (id: string) => {
    setForm((f) => ({
      ...f,
      featureIds: f.featureIds.includes(id)
        ? f.featureIds.filter((fid) => fid !== id)
        : [...f.featureIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.price || isNaN(Number(form.price))) return toast.error('Valid price is required');
    if (!form.creditAmount || isNaN(Number(form.creditAmount)))
      return toast.error('Valid credit amount is required');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        creditAmount: Number(form.creditAmount),
        isActive: form.isActive,
        featureIds: form.featureIds,
      };

      if (editing) {
        await api.patch(`/packages/${editing.id}`, payload);
        toast.success('Package updated');
      } else {
        await api.post('/packages', payload);
        toast.success('Package created');
      }

      closeModal();
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Save failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/packages/${id}`);
      toast.success('Package deleted');
      setConfirmDeleteId(null);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Delete failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setDeletingId(null);
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Panel
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Package Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create, edit, and delete credit packages</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition"
        >
          <Plus className="h-4 w-4" />
          New Package
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Name</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Price</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Credits</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Features</th>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  No packages yet. Click "New Package" to create one.
                </td>
              </tr>
            )}
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-slate-50 transition">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{pkg.name}</p>
                  {pkg.description && (
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{pkg.description}</p>
                  )}
                </td>
                <td className="px-5 py-4 font-medium text-slate-700">
                  ${Number(pkg.price).toFixed(2)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Zap className="h-3.5 w-3.5" />
                    <span className="font-semibold">{pkg.creditAmount}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {pkg.packageFeatures.length === 0 ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      pkg.packageFeatures.map(({ feature }) => (
                        <span
                          key={feature.id}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {feature.codeName}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      pkg.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {confirmDeleteId === pkg.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">Sure?</span>
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          disabled={deletingId === pkg.id}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-500 transition disabled:opacity-60"
                        >
                          {deletingId === pkg.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Yes'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(pkg.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? 'Edit Package' : 'New Package'}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-4 px-6 py-5">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Package Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pro"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this package"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Price & Credits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="9.99"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Credits <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.creditAmount}
                    onChange={(e) => setForm((f) => ({ ...f, creditAmount: e.target.value }))}
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Features</label>
                <div className="space-y-2">
                  {features.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFeature(f.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition',
                        form.featureIds.includes(f.id)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition',
                          form.featureIds.includes(f.id)
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300',
                        )}
                      >
                        {form.featureIds.includes(f.id) && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{f.codeName}</p>
                        {f.description && (
                          <p className="text-xs text-slate-500 truncate">{f.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {f.creditCost} cr/use
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Active</p>
                  <p className="text-xs text-slate-400">Visible to users in the package store</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  {form.isActive ? (
                    <ToggleRight className="h-8 w-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editing ? (
                  'Save Changes'
                ) : (
                  'Create Package'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
