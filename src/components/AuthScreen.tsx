import { useState, type FormEvent } from 'react';
import { Scissors, Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-forest-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-goldline bg-forest-100 shadow-gold-glow">
              <Scissors className="text-gold" size={30} />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ivory">
              Oh Sew Sheek <span className="text-gold italic font-normal">Academy</span>
            </h1>
            <p className="mt-2 text-xs text-earth-tan flex items-center justify-center gap-1.5 uppercase tracking-widest font-semibold">
              <Sparkles size={11} className="text-gold" /> Master Atelier of Craft & Couture
            </p>
          </div>

          <div className="rounded-3xl border border-goldline/50 bg-forest-100/90 p-6 sm:p-8 shadow-gold-glow backdrop-blur-md">
            <div className="mb-5 flex rounded-2xl bg-forest-50 p-1 border border-white/5">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    mode === m
                      ? 'bg-gradient-to-r from-gold to-gold-deep text-earth-50 shadow-gold-glow'
                      : 'text-ivory-muted hover:text-ivory'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/70" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-goldline/50 bg-forest-50 py-2.5 pl-10 pr-3 text-xs text-ivory outline-none focus:border-gold transition-colors placeholder:text-ivory-muted/40"
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/70" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-goldline/50 bg-forest-50 py-2.5 pl-10 pr-3 text-xs text-ivory outline-none focus:border-gold transition-colors placeholder:text-ivory-muted/40"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-error/30 bg-error/10 px-3.5 py-2 text-xs text-error-soft">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-gold to-gold-deep text-earth-50 font-bold py-3 rounded-full text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="animate-spin" size={14} />}
                {mode === 'signin' ? 'Enter Academy ✦' : 'Join the Atelier ✦'}
              </button>
            </form>

            <div className="mt-6 text-center text-[11px] text-ivory-muted">
              {mode === 'signin' ? (
                <>
                  New maker?{' '}
                  <button onClick={() => setMode('signup')} className="text-gold font-bold hover:underline">
                    Request Atelier Access
                  </button>
                </>
              ) : (
                <>
                  Already enrolled?{' '}
                  <button onClick={() => setMode('signin')} className="text-gold font-bold hover:underline">
                    Sign in to your portal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
