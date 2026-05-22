import { useEffect, useState } from 'react';
import {
  Zap,
  ImageIcon,
  Send,
  BarChart3,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type {
  User,
  Feature,
  UserPackage,
  GenerateImageResult,
  AutoPostResult,
  AnalyzeDataResult,
} from '@/types';
import { cn } from '@/lib/utils';

const FEATURE_META: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bg: string;
    inputLabel: string;
    inputPlaceholder: string;
    inputType: 'text' | 'textarea';
    endpoint: string;
    bodyKey: string;
    requiredPlan: string;
  }
> = {
  auto_post: {
    icon: Send,
    label: 'Auto Post',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    inputLabel: 'Post Content',
    inputPlaceholder: 'Write your social media post here…',
    inputType: 'textarea',
    endpoint: '/ai/auto-post',
    bodyKey: 'content',
    requiredPlan: 'Basic',
  },
  generate_image: {
    icon: ImageIcon,
    label: 'Generate Image',
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
    inputLabel: 'Image Prompt',
    inputPlaceholder: 'A futuristic city at sunset, cyberpunk style…',
    inputType: 'text',
    endpoint: '/ai/generate',
    bodyKey: 'prompt',
    requiredPlan: 'Pro',
  },
  analyze_data: {
    icon: BarChart3,
    label: 'Analyze Data',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    inputLabel: 'Data to Analyze',
    inputPlaceholder: 'Q1: $120k, Q2: $145k, Q3: $98k, Q4: $210k',
    inputType: 'textarea',
    endpoint: '/ai/analyze',
    bodyKey: 'data',
    requiredPlan: 'Enterprise',
  },
};

function ImageResult({ result }: { result: GenerateImageResult }) {
  return (
    <div className="mt-4 space-y-3">
      <img
        src={result.imageUrl}
        alt={result.prompt}
        className="w-full rounded-xl object-cover shadow-md"
        style={{ maxHeight: 280 }}
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Model: {result.model}</span>
        <span>{new Date(result.generatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

function AutoPostResult({ result }: { result: AutoPostResult }) {
  return (
    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Post Scheduled!</span>
      </div>
      <p className="mb-3 text-sm text-slate-700">"{result.content}"</p>
      <div className="flex flex-wrap gap-2">
        {result.platforms.map((p) => (
          <span
            key={p}
            className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize"
          >
            {p}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Scheduled: {new Date(result.scheduledAt).toLocaleString()}
      </p>
    </div>
  );
}

function AnalyzeResult({ result }: { result: AnalyzeDataResult }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-800">{result.summary}</p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
              result.sentiment === 'positive'
                ? 'bg-emerald-200 text-emerald-800'
                : 'bg-red-100 text-red-700',
            )}
          >
            {result.sentiment}
          </span>
          <span className="text-xs text-slate-500">
            Confidence: {Math.round(result.confidence * 100)}%
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {result.insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
          >
            <BarChart3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            <p className="text-sm text-slate-700">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FeatureCardProps {
  feature: Feature;
  isUnlocked: boolean;
  onRefreshUser: () => Promise<User>;
}

function FeatureCard({ feature, isUnlocked, onRefreshUser }: FeatureCardProps) {
  const navigate = useNavigate();
  const meta = FEATURE_META[feature.codeName];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    GenerateImageResult | AutoPostResult | AnalyzeDataResult | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  if (!meta) return null;
  const Icon = meta.icon;

  const handleRun = async () => {
    if (!input.trim()) return toast.error('Please enter some input');
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.post(meta.endpoint, { [meta.bodyKey]: input.trim() });
      setResult(res.data);
      await onRefreshUser();
      toast.success(`-${feature.creditCost} credit${feature.creditCost !== 1 ? 's' : ''} used`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Request failed';
      setError(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border-2 bg-white shadow-sm transition',
        isUnlocked ? 'border-slate-200 hover:shadow-md' : 'border-slate-100 opacity-70',
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 p-5">
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border',
            meta.bg,
          )}
        >
          <Icon className={cn('h-6 w-6', meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{meta.label}</h3>
            {isUnlocked ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Unlocked
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                <Lock className="mr-1 inline h-2.5 w-2.5" />
                Requires {meta.requiredPlan}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500 truncate">{feature.description}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
            <Zap className="h-3.5 w-3.5" />
            {feature.creditCost} cr/use
          </div>
          {isUnlocked && (
            <button
              onClick={() => {
                setOpen((o) => !o);
                setResult(null);
                setError(null);
              }}
              className={cn(
                'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                meta.color,
                'hover:opacity-80',
              )}
            >
              {open ? 'Close' : 'Try it'}
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {!isUnlocked && (
            <button
              onClick={() => navigate('/packages')}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
            >
              <ShoppingBag className="h-3 w-3" />
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Expandable try-it panel */}
      {isUnlocked && open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {meta.inputLabel}
          </label>
          {meta.inputType === 'textarea' ? (
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={meta.inputPlaceholder}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={meta.inputPlaceholder}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          )}

          <button
            onClick={handleRun}
            disabled={loading}
            className={cn(
              'mt-3 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60',
              feature.codeName === 'generate_image'
                ? 'bg-violet-600 hover:bg-violet-500'
                : feature.codeName === 'auto_post'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-emerald-600 hover:bg-emerald-500',
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Icon className="h-4 w-4" />
                Run
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {result && feature.codeName === 'generate_image' && (
            <ImageResult result={result as GenerateImageResult} />
          )}
          {result && feature.codeName === 'auto_post' && (
            <AutoPostResult result={result as AutoPostResult} />
          )}
          {result && feature.codeName === 'analyze_data' && (
            <AnalyzeResult result={result as AnalyzeDataResult} />
          )}
        </div>
      )}
    </div>
  );
}

interface FeaturesPageProps {
  user: User | null;
  onRefreshUser: () => Promise<User>;
}

export default function FeaturesPage({ user, onRefreshUser }: FeaturesPageProps) {
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [unlockedCodes, setUnlockedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        // All features come from packages; extract unique ones
        const [pkgRes, profileRes] = await Promise.all([
          api.get('/packages'),
          api.get<User>('/users/me'),
        ]);

        // Collect all unique features from all packages
        const featureMap = new Map<string, Feature>();
        for (const pkg of pkgRes.data) {
          for (const pf of pkg.packageFeatures) {
            featureMap.set(pf.feature.id, pf.feature);
          }
        }
        setAllFeatures(Array.from(featureMap.values()));

        // Collect unlocked feature codes from user's active packages
        const codes = new Set<string>();
        for (const up of (profileRes.data.userPackages ?? []) as UserPackage[]) {
          if (up.status === 'ACTIVE') {
            for (const pf of up.package.packageFeatures) {
              codes.add(pf.feature.codeName);
            }
          }
        }
        setUnlockedCodes(codes);
      } catch {
        toast.error('Failed to load features');
      } finally {
        setLoading(false);
      }
    };
    loadFeatures();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const unlocked = allFeatures.filter((f) => unlockedCodes.has(f.codeName));
  const locked = allFeatures.filter((f) => !unlockedCodes.has(f.codeName));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
          <Zap className="h-3.5 w-3.5" />
          AI Features
        </div>
        <h1 className="text-2xl font-bold text-slate-900">My Features</h1>
        <p className="mt-1 text-sm text-slate-500">
          Try your unlocked AI-powered features. Each use costs credits.
        </p>
      </div>

      {/* Credit balance reminder */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            {user?.currentCredits ?? 0} credits available
          </p>
          <p className="text-xs text-amber-600">Credits are deducted each time you use a feature</p>
        </div>
      </div>

      {/* Unlocked features */}
      {unlocked.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Unlocked ({unlocked.length})
          </h2>
          <div className="space-y-4">
            {unlocked.map((f) => (
              <FeatureCard key={f.id} feature={f} isUnlocked onRefreshUser={onRefreshUser} />
            ))}
          </div>
        </section>
      )}

      {/* Locked features */}
      {locked.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-700">
            <Lock className="h-4 w-4 text-slate-400" />
            Locked ({locked.length})
          </h2>
          <div className="space-y-4">
            {locked.map((f) => (
              <FeatureCard
                key={f.id}
                feature={f}
                isUnlocked={false}
                onRefreshUser={onRefreshUser}
              />
            ))}
          </div>
        </section>
      )}

      {allFeatures.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Zap className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-slate-500">No features available yet</p>
        </div>
      )}
    </main>
  );
}
