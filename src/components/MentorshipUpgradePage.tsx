import { useState } from 'react';
import { Crown, Sparkles, Check, Loader2, ArrowRight, Star, Zap, Heart, TrendingUp, Users, Award, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  { icon: Crown, title: 'Private 1:1 Coaching', desc: 'Three private calls with Sheek personally — a full business autopsy, a mid-program check-in, and a launch debrief.' },
  { icon: TrendingUp, title: '12-Week Business Curriculum', desc: 'A complete step-by-step program that takes you from where you are right now to a real, working business.' },
  { icon: Users, title: 'Group Coaching Sessions', desc: 'Weekly live group sessions where you learn alongside other makers and get direct feedback.' },
  { icon: Zap, title: 'Weekly Deliverables & Feedback', desc: 'Every week has real work to turn in. Sheek reviews it personally and pushes you forward.' },
  { icon: Award, title: 'Frameworks You Keep Forever', desc: 'Pricing formulas, content systems, launch templates — yours to use long after the program ends.' },
  { icon: Heart, title: 'Personalized Game Plan', desc: 'Your intake form shapes a custom roadmap built specifically for your business and your goals.' },
];

const PHASES = [
  { phase: 'Phase 1', name: 'Diagnose', weeks: 'Weeks 1–3', desc: 'Full business autopsy, pricing truth session, and buyer profiling.' },
  { phase: 'Phase 2', name: 'Rebuild', weeks: 'Weeks 4–6', desc: 'Offer suite, content that sells, and platform mastery.' },
  { phase: 'Phase 3', name: 'Position', weeks: 'Weeks 7–9', desc: 'Repeat customer machine, brand voice, and authority building.' },
  { phase: 'Phase 4', name: 'Launch', weeks: 'Weeks 10–12', desc: 'Launch machine, launch week execution, and final debrief.' },
];

export function MentorshipUpgradePage() {
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxbg text-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-16 sm:px-10 sm:py-24" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,149,58,0.18) 0%, transparent 55%), #18080E' }}>
        <div className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-burg/15 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/8 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
            <Sparkles size={14} /> Members-Only Coaching Program
          </div>

          <h1 className="font-lux text-5xl font-bold leading-[0.95] sm:text-6xl" style={{ color: '#FBF4EC' }}>
            Upgrade to <em className="italic text-gold">Mentorship.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.85] text-cream-dim">
            This isn't another course you watch and forget. It's 12 weeks of private 1:1 coaching, live group sessions, and real deliverables that transform your craft into a business that actually pays you.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={startUpgrade}
              disabled={checkingOut}
              className="group flex items-center gap-2.5 bg-gold px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-luxbg transition-all hover:bg-gold-soft disabled:opacity-50"
              style={{ boxShadow: '0 0 40px rgba(201,149,58,0.25)' }}
            >
              {checkingOut ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
              {checkingOut ? 'Preparing Checkout...' : 'Upgrade to Mentorship'}
              {!checkingOut && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
            </button>
            <div className="flex items-center gap-1 text-[12px] text-cream-dim">
              <Star size={13} className="fill-gold text-gold" />
              <Star size={13} className="fill-gold text-gold" />
              <Star size={13} className="fill-gold text-gold" />
              <Star size={13} className="fill-gold text-gold" />
              <Star size={13} className="fill-gold text-gold" />
              <span className="ml-1.5">Limited spots per cohort</span>
            </div>
          </div>

          {error && (
            <div className="mt-5 inline-block border border-burg/40 bg-burg/15 px-4 py-2.5 text-[13px] text-burg-soft">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Features grid */}
      <div className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">What You Get</div>
            <h2 className="font-lux text-3xl font-bold text-ivory sm:text-4xl">Everything in the Mentorship Program</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group border border-gold/10 bg-luxcard p-7 transition-all hover:border-gold/30"
                  style={{ boxShadow: '0 0 24px rgba(201,149,58,0.04)' }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-gold/20 bg-gold/8 transition-colors group-hover:bg-gold/15">
                    <Icon size={20} className="text-gold" />
                  </div>
                  <h3 className="mb-2 font-lux text-lg font-bold text-ivory">{f.title}</h3>
                  <p className="text-[13px] leading-[1.7] text-cream-dim">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 12-week journey */}
      <div className="border-y border-gold/10 bg-luxmid px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">The 12-Week Journey</div>
            <h2 className="font-lux text-3xl font-bold text-ivory sm:text-4xl">Your Path From Idea to Launch</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((p, i) => (
              <div key={p.phase} className="relative border border-gold/12 bg-luxcard p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/12 text-[13px] font-bold text-gold">{i + 1}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{p.phase}</span>
                </div>
                <h3 className="mb-1 font-lux text-xl font-bold text-ivory">{p.name}</h3>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{p.weeks}</div>
                <p className="text-[12px] leading-[1.65] text-cream-dim">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's included checklist */}
      <div className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">Full Access Includes</div>
            <h2 className="font-lux text-3xl font-bold text-ivory sm:text-4xl">Every Tool, Every Session, Every Framework</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              '3 private 1:1 calls with Sheek',
              '9 weekly group coaching sessions',
              'Personalized business autopsy',
              'Custom 12-week game plan',
              'Pricing recalculated for every product',
              'Complete buyer persona worksheet',
              '3-tier offer suite architecture',
              '30-day content calendar built for you',
              'Platform-specific SEO optimization',
              '5-email repeat customer sequence',
              'Brand voice style guide',
              '14-day launch machine template',
              'Weekly deliverable feedback',
              'Private cohort community access',
              'Frameworks & templates (yours forever)',
              'Post-program 90-day action plan',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 border border-gold/8 bg-luxcard px-4 py-3.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green/15">
                  <Check size={12} className="text-green" />
                </span>
                <span className="text-[13px] leading-[1.5] text-cream">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-28" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(123,29,48,0.25) 0%, transparent 55%), #18080E' }}>
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10" style={{ boxShadow: '0 0 40px rgba(201,149,58,0.2)' }}>
            <Crown size={30} className="text-gold" />
          </div>
          <h2 className="font-lux text-4xl font-bold leading-[0.95] sm:text-5xl" style={{ color: '#FBF4EC' }}>
            Ready to Build Your <em className="italic text-gold">Business?</em>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-[1.85] text-cream-dim">
            Spots are limited in each cohort so Sheek can give every member real attention. When you're ready, your seat is waiting.
          </p>

          <div className="mt-8">
            <button
              onClick={startUpgrade}
              disabled={checkingOut}
              className="group flex mx-auto items-center gap-2.5 bg-gold px-10 py-4.5 text-[13px] font-bold uppercase tracking-[0.16em] text-luxbg transition-all hover:bg-gold-soft disabled:opacity-50"
              style={{ boxShadow: '0 0 40px rgba(201,149,58,0.3)' }}
            >
              {checkingOut ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {checkingOut ? 'Preparing Checkout...' : 'Claim Your Spot'}
              {!checkingOut && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </div>

          {error && (
            <div className="mt-5 inline-block border border-burg/40 bg-burg/15 px-4 py-2.5 text-[13px] text-burg-soft">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
