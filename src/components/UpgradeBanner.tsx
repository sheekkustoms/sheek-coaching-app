import { useState } from 'react';
import { Crown, X, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DISMISS_KEY = 'mentorship-banner-dismissed';

export function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  };

  const startUpgrade = async () => {
    setCheckingOut(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to upgrade.');
        setCheckingOut(false);
        return;
      }
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mentorship-checkout`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout.');
        setCheckingOut(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
      setCheckingOut(false);
    }
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-goldline bg-gradient-to-r from-forest-100 via-forest-200 to-earth-100 p-5 sm:p-6 shadow-gold-glow">
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/20 text-gold shadow-gold-glow">
            <Crown size={20} />
          </span>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-ivory flex items-center gap-2">
              Unlock the <span className="text-gold italic font-normal">12-Week Mentorship & Strategy Calls</span>
            </h3>
            <p className="mt-0.5 text-xs text-earth-tan leading-relaxed">
              Step-by-step weekly homework, 1:1 strategy calls with Sheek, verified certification ranks, and private coaching reviews.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {error && <span className="text-xs text-error-soft">{error}</span>}
          <button
            onClick={startUpgrade}
            disabled={checkingOut}
            className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold px-5 py-2.5 rounded-full text-xs shadow-gold-glow hover:brightness-110 transition-all disabled:opacity-50"
          >
            {checkingOut ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />}
            Upgrade to Mentorship
            <ArrowRight size={13} />
          </button>
          <button
            onClick={dismiss}
            className="rounded-full p-1.5 text-ivory-muted hover:text-ivory transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeBanner;
