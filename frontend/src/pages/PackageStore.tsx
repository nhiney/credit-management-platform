import { useEffect, useState } from 'react';
import { Zap, Check, Loader2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Package, User } from '@/types';
import { cn } from '@/lib/utils';

interface PackageStoreProps {
  onPurchaseSuccess: () => Promise<User>;
}

const TIER_STYLE: Record<string, { ring: string; badge: string; btn: string }> = {
  Basic: {
    ring: 'ring-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    btn: 'bg-slate-900 hover:bg-slate-700 text-white',
  },
  Pro: {
    ring: 'ring-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25',
  },
  Enterprise: {
    ring: 'ring-violet-300',
    badge: 'bg-violet-100 text-violet-700',
    btn: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25',
  },
};

const DEFAULT_STYLE = TIER_STYLE['Basic'];

export default function PackageStorePage({ onPurchaseSuccess }: PackageStoreProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Package[]>('/packages')
      .then((res) => setPackages(res.data))
      .catch(() => toast.error('Failed to load packages'))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (pkg: Package) => {
    setPurchasing(pkg.id);
    try {
      const res = await api.post<{ message: string; creditsAdded: number; newBalance: number }>(
        '/purchase',
        { packageId: pkg.id },
      );
      toast.success(`${res.data.message} · +${res.data.creditsAdded} credits`);
      await onPurchaseSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Purchase failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setPurchasing(null);
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
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
          <ShoppingBag className="h-3.5 w-3.5" />
          Package Store
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Choose Your Plan</h1>
        <p className="mt-2 text-slate-500">Purchase credits and unlock AI-powered features</p>
      </div>

      {/* Package grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => {
          const isPro = pkg.name === 'Pro';
          const style = TIER_STYLE[pkg.name] ?? DEFAULT_STYLE;

          return (
            <div
              key={pkg.id}
              className={cn(
                'relative flex flex-col rounded-2xl bg-white p-6 ring-2 shadow-sm transition hover:shadow-md',
                style.ring,
                isPro && 'scale-105',
              )}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-5">
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', style.badge)}>
                  {pkg.name}
                </span>
                <p className="mt-3 text-4xl font-bold text-slate-900">
                  ${Number(pkg.price).toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">one-time purchase</p>
              </div>

              {/* Credits */}
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="text-lg font-bold text-slate-900">{pkg.creditAmount}</span>
                <span className="text-sm text-slate-500">credits included</span>
              </div>

              {/* Description */}
              {pkg.description && (
                <p className="mb-5 text-sm text-slate-600">{pkg.description}</p>
              )}

              {/* Features */}
              <div className="mb-6 flex-1 space-y-2.5">
                {pkg.packageFeatures.map(({ feature }) => (
                  <div key={feature.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {feature.codeName.replace(/_/g, ' ')}
                      </p>
                      {feature.description && (
                        <p className="text-xs text-slate-500">{feature.description}</p>
                      )}
                      <p className="text-xs font-medium text-slate-400">
                        {feature.creditCost} credit{feature.creditCost !== 1 ? 's' : ''} / use
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing === pkg.id}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition disabled:opacity-60',
                  style.btn,
                )}
              >
                {purchasing === pkg.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Buy Now
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-slate-400">
        This is a demo environment. No real payment is processed.
      </p>
    </main>
  );
}
