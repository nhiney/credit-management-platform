import { useEffect, useState } from 'react';
import {
  Zap,
  Check,
  Loader2,
  ShoppingBag,
  X,
  CreditCard,
  Lock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Package, User, UserPackage } from '@/types';
import { cn } from '@/lib/utils';

interface PackageStoreProps {
  onPurchaseSuccess: () => Promise<User>;
}

const TIER_STYLE: Record<string, { ring: string; badge: string; btn: string; accent: string }> = {
  Basic: {
    ring: 'ring-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    btn: 'bg-slate-900 hover:bg-slate-700 text-white',
    accent: 'text-slate-700',
  },
  Pro: {
    ring: 'ring-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25',
    accent: 'text-blue-700',
  },
  Enterprise: {
    ring: 'ring-violet-300',
    badge: 'bg-violet-100 text-violet-700',
    btn: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25',
    accent: 'text-violet-700',
  },
};

const DEFAULT_STYLE = TIER_STYLE['Basic'];

type CheckoutStep = 'form' | 'processing' | 'success';

function formatCard(raw: string) {
  return raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}
function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function PackageStorePage({ onPurchaseSuccess }: PackageStoreProps) {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Checkout modal state
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [step, setStep] = useState<CheckoutStep>('form');
  const [purchaseResult, setPurchaseResult] = useState<{
    creditsAdded: number;
    newBalance: number;
  } | null>(null);

  // Card form
  const [cardName, setCardName] = useState('John Doe');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');

  useEffect(() => {
    Promise.all([api.get<Package[]>('/packages'), api.get<User>('/users/me')])
      .then(([pkgRes, userRes]) => {
        setPackages(pkgRes.data);
        const owned = new Set(
          (userRes.data.userPackages ?? [])
            .filter((up: UserPackage) => up.status === 'ACTIVE')
            .map((up: UserPackage) => up.package.id),
        );
        setOwnedIds(owned);
      })
      .catch(() => toast.error('Failed to load packages'))
      .finally(() => setLoading(false));
  }, []);

  const openCheckout = (pkg: Package) => {
    setSelectedPkg(pkg);
    setStep('form');
    setPurchaseResult(null);
  };

  const closeCheckout = () => {
    if (step === 'processing') return;
    setSelectedPkg(null);
  };

  const handlePay = async () => {
    if (!selectedPkg) return;
    if (
      !cardName.trim() ||
      cardNumber.replace(/\s/g, '').length < 16 ||
      expiry.length < 5 ||
      cvv.length < 3
    ) {
      toast.error('Please fill in all card details');
      return;
    }

    setStep('processing');

    // Simulate payment gateway delay
    await new Promise((r) => setTimeout(r, 2200));

    try {
      const res = await api.post<{
        message: string;
        creditsAdded: number;
        newBalance: number;
      }>('/purchase', { packageId: selectedPkg.id });

      setPurchaseResult({ creditsAdded: res.data.creditsAdded, newBalance: res.data.newBalance });
      setStep('success');
      setOwnedIds((prev) => new Set([...prev, selectedPkg.id]));
      await onPurchaseSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Purchase failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
      setStep('form');
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
          const isOwned = ownedIds.has(pkg.id);

          return (
            <div
              key={pkg.id}
              className={cn(
                'relative flex flex-col rounded-2xl bg-white p-6 ring-2 shadow-sm transition hover:shadow-md',
                style.ring,
                isPro && 'scale-105',
              )}
            >
              {isPro && !isOwned && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow">
                    Most Popular
                  </span>
                </div>
              )}
              {isOwned && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
                    <Check className="h-3 w-3" /> Owned
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
              {pkg.description && <p className="mb-5 text-sm text-slate-600">{pkg.description}</p>}

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
              {isOwned ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Active Plan
                </div>
              ) : (
                <button
                  onClick={() => openCheckout(pkg)}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition',
                    style.btn,
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Buy Now · ${Number(pkg.price).toFixed(2)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        <Lock className="mr-1 inline h-3 w-3" />
        This is a demo environment. No real payment is processed.
      </p>

      {/* ─── Checkout Modal ─────────────────────────────────── */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* ── Step: Processing ── */}
            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                  <CreditCard className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Processing Payment</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Securely charging ${Number(selectedPkg.price).toFixed(2)}…
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
                  <Lock className="h-3 w-3" />
                  256-bit SSL encrypted
                </div>
              </div>
            )}

            {/* ── Step: Success ── */}
            {step === 'success' && purchaseResult && (
              <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Payment Successful!</h2>
                <p className="mt-2 text-sm text-slate-500">
                  You've purchased the <strong>{selectedPkg.name}</strong> package.
                </p>

                <div className="mt-6 w-full rounded-xl bg-emerald-50 px-5 py-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Credits added</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <Zap className="h-4 w-4" />+{purchaseResult.creditsAdded}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-emerald-200 pt-2">
                    <span className="text-sm text-slate-600">New balance</span>
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <Zap className="h-4 w-4 text-amber-500" />
                      {purchaseResult.newBalance} credits
                    </span>
                  </div>
                </div>

                <div className="mt-4 w-full rounded-xl border border-slate-200 px-5 py-3 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Unlocked Features
                  </p>
                  <div className="space-y-1.5">
                    {selectedPkg.packageFeatures.map(({ feature }) => (
                      <div key={feature.id} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm text-slate-700">
                          {feature.codeName.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex w-full gap-3">
                  <button
                    onClick={closeCheckout}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    Stay Here
                  </button>
                  <button
                    onClick={() => {
                      closeCheckout();
                      navigate('/dashboard');
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: Form ── */}
            {step === 'form' && (
              <>
                {/* Modal header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Checkout</h2>
                    <p className="text-sm text-slate-500">
                      {selectedPkg.name} · ${Number(selectedPkg.price).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={closeCheckout}
                    className="rounded-lg p-1 hover:bg-slate-100 transition"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Order summary */}
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Order Summary
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{selectedPkg.name} Package</span>
                      <span className="font-semibold text-slate-900">
                        ${Number(selectedPkg.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <Zap className="h-3 w-3" />
                      {selectedPkg.creditAmount} credits will be added
                    </div>
                  </div>

                  {/* Card form */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CreditCard className="h-4 w-4" />
                      Payment Details
                      <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                        Demo — no real charge
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Cardholder */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="John Doe"
                        />
                      </div>

                      {/* Card number */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCard(e.target.value))}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-12 text-sm font-mono tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="4242 4242 4242 4242"
                          />
                          <CreditCard className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      {/* Expiry + CVV */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={expiry}
                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="•••"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security note */}
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                    <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                    Payments are simulated. No real charges will be made to your card.
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 px-6 py-4">
                  <button
                    onClick={handlePay}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition',
                      (TIER_STYLE[selectedPkg.name] ?? DEFAULT_STYLE).btn,
                    )}
                  >
                    <Lock className="h-4 w-4" />
                    Pay ${Number(selectedPkg.price).toFixed(2)}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    By clicking Pay you agree to the simulated terms of service.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
