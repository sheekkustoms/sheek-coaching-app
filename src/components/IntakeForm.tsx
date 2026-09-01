import { useState } from 'react';
import { Loader2, Check, ArrowRight, ArrowLeft, Rocket, Store, Heart, Target, ClipboardCheck, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { BusinessStage } from '@/lib/types';

interface IntakeFormProps {
  onComplete: () => void;
}

const SECTIONS = [
  { id: 0, title: 'Where You Are Right Now', icon: Target },
  { id: 1, title: 'Your Business Vision', icon: Sparkles },
  { id: 2, title: 'Why You Chose Me', icon: Heart },
  { id: 3, title: 'Your Commitment', icon: ClipboardCheck },
  { id: 4, title: 'Review & Submit', icon: Check },
];

export function IntakeForm({ onComplete }: IntakeFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasStore, setHasStore] = useState<'yes' | 'no' | ''>('');
  const [storeUrl, setStoreUrl] = useState('');
  const [hasSales, setHasSales] = useState<'yes' | 'no' | ''>('');
  const [sellingDuration, setSellingDuration] = useState('');
  const [businessIdea, setBusinessIdea] = useState('');
  const [products, setProducts] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [whySheek, setWhySheek] = useState('');
  const [wantFromProgram, setWantFromProgram] = useState('');
  const [needMostHelp, setNeedMostHelp] = useState('');
  const [willFollowThrough, setWillFollowThrough] = useState<'yes' | 'no' | ''>('');
  const [willDoHomework, setWillDoHomework] = useState<'yes' | 'no' | ''>('');
  const [willParticipate, setWillParticipate] = useState<'yes' | 'no' | ''>('');
  const [expectations, setExpectations] = useState('');

  const determinedStage: BusinessStage = hasStore === 'yes' ? 'established' : 'just_starting';

  const canProceed = (): boolean => {
    if (step === 0) return hasStore !== '' && (hasStore !== 'yes' || storeUrl.trim() !== '') && hasSales !== '';
    if (step === 1) return businessIdea.trim() !== '' && products.trim() !== '';
    if (step === 2) return whySheek.trim() !== '' && wantFromProgram.trim() !== '' && needMostHelp.trim() !== '';
    if (step === 3) return willFollowThrough === 'yes' && willDoHomework === 'yes' && willParticipate === 'yes' && expectations.trim() !== '';
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    const responses: Record<string, string> = {
      has_store: hasStore,
      store_url: storeUrl,
      has_sales: hasSales,
      selling_duration: sellingDuration,
      business_idea: businessIdea,
      products: products,
      target_customer: targetCustomer,
      why_sheek: whySheek,
      want_from_program: wantFromProgram,
      need_most_help: needMostHelp,
      will_follow_through: willFollowThrough,
      will_do_homework: willDoHomework,
      will_participate: willParticipate,
      expectations: expectations,
    };

    const { error: upsertError } = await supabase.from('mentorship_intake').upsert({
      user_id: user.id,
      business_stage: determinedStage,
      intake_responses: responses,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    setSaving(false);

    if (upsertError) {
      setError('Something went wrong saving your intake. Please try again.');
      return;
    }

    onComplete();
  };

  const next = () => { if (step < SECTIONS.length - 1) setStep(step + 1); };
  const back = () => { if (step > 0) setStep(step - 1); };

  const inputClass = "w-full resize-vertical border border-gold/20 bg-white/3 p-3.5 text-[14px] leading-[1.6] text-cream outline-none transition-colors placeholder:text-muted/50 focus:border-gold";
  const labelClass = "mb-2 block text-[12px] font-bold uppercase tracking-[0.14em] text-gold";
  const hintClass = "mb-3 text-[12px] leading-[1.6] text-cream-dim";
  const yesNoBtnClass = (selected: string, val: string) =>
    `flex-1 border-2 px-5 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] transition-all ${
      selected === val ? 'border-gold bg-gold/12 text-gold' : 'border-gold/15 bg-white/3 text-cream-dim hover:border-gold/30'
    }`;

  return (
    <div className="min-h-screen bg-luxbg text-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero header */}
      <div className="border-b border-gold/10 px-6 py-10 sm:px-10 sm:py-14" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,149,58,0.12) 0%, transparent 60%), #18080E' }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
            <Sparkles size={14} /> Sheek Academy Mentorship
          </div>
          <h1 className="font-lux text-4xl font-bold leading-[0.95] sm:text-5xl" style={{ color: '#FBF4EC' }}>
            Before We Begin,<br /><em className="italic text-gold">Let Me Get to Know You.</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-[1.8] text-cream-dim">
            This intake form is the first thing I need from you. Your answers help me understand exactly where you are, what you need, and how I can help you most. Take your time — be honest and thorough. This sets the direction for your entire coaching journey.
          </p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="border-b border-gold/8 bg-luxmid px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                      isDone ? 'border-green bg-green text-ivory' :
                      isCurrent ? 'border-gold bg-gold/12 text-gold' :
                      'border-white/8 bg-white/3 text-muted'
                    }`}
                  >
                    {isDone ? <Check size={15} /> : <Icon size={15} />}
                  </div>
                  <span className={`hidden text-[9px] font-bold uppercase tracking-[0.1em] sm:block ${isCurrent ? 'text-gold' : isDone ? 'text-green' : 'text-muted'}`}>
                    {s.title}
                  </span>
                </div>
                {i < SECTIONS.length - 1 && (
                  <div className={`mx-1 h-px flex-1 sm:mx-2 ${i < step ? 'bg-green/40' : 'bg-white/8'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form body */}
      <div className="px-6 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Step 0: Where You Are */}
          {step === 0 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="font-lux text-2xl font-bold text-ivory sm:text-3xl">Where You Are Right Now</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">This helps me know if we're building from scratch or optimizing what you already have.</p>
              </div>

              <div className="mb-7">
                <label className={labelClass}>Do you already have a website or online store where you sell products?</label>
                <p className={hintClass}>This is the key question — it tells me which path to take you on.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setHasStore('no')} className={yesNoBtnClass(hasStore, 'no')}>
                    <Rocket size={16} className="mb-1.5 inline" /><br />No, I'm Starting Fresh
                  </button>
                  <button type="button" onClick={() => setHasStore('yes')} className={yesNoBtnClass(hasStore, 'yes')}>
                    <Store size={16} className="mb-1.5 inline" /><br />Yes, I Have a Store
                  </button>
                </div>
              </div>

              {hasStore === 'yes' && (
                <div className="mb-7 animate-fade-in">
                  <label className={labelClass}>What's your website or store URL?</label>
                  <p className={hintClass}>Paste the link so I can review your shop before our first session.</p>
                  <input
                    type="url"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="https://yourstore.com or etsy.com/shop/yourshop"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="mb-7">
                <label className={labelClass}>Have you made any sales yet?</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setHasSales('no')} className={yesNoBtnClass(hasSales, 'no')}>No Sales Yet</button>
                  <button type="button" onClick={() => setHasSales('yes')} className={yesNoBtnClass(hasSales, 'yes')}>Yes, I Have Sales</button>
                </div>
              </div>

              {hasSales === 'yes' && (
                <div className="mb-7 animate-fade-in">
                  <label className={labelClass}>How long have you been selling?</label>
                  <input
                    type="text"
                    value={sellingDuration}
                    onChange={(e) => setSellingDuration(e.target.value)}
                    placeholder="e.g. 6 months, 2 years, just started last week..."
                    className={inputClass}
                  />
                </div>
              )}

              {/* Stage indicator */}
              {hasStore !== '' && (
                <div className="border border-gold/15 bg-gold/6 p-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    {determinedStage === 'just_starting' ? (
                      <Rocket size={20} className="text-gold" />
                    ) : (
                      <Store size={20} className="text-gold" />
                    )}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Your Path</div>
                      <div className="text-[14px] font-bold text-ivory">
                        {determinedStage === 'just_starting'
                          ? 'Just Starting Out — We\'re building from zero together'
                          : 'Established Business — We\'re auditing and optimizing what you have'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Business Vision */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="font-lux text-2xl font-bold text-ivory sm:text-3xl">Your Business Vision</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">Tell me about what you want to build. Don't worry about being perfect — just be real.</p>
              </div>

              <div className="mb-6">
                <label className={labelClass}>What do you want to do for a business?</label>
                <p className={hintClass}>In your own words, describe the business you want to build.</p>
                <textarea
                  value={businessIdea}
                  onChange={(e) => setBusinessIdea(e.target.value)}
                  placeholder="I want to..."
                  className={inputClass}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div className="mb-6">
                <label className={labelClass}>What products do you make (or want to make)?</label>
                <p className={hintClass}>List the products you already make or the ones you're thinking about making.</p>
                <textarea
                  value={products}
                  onChange={(e) => setProducts(e.target.value)}
                  placeholder="I make / I want to make..."
                  className={inputClass}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div className="mb-6">
                <label className={labelClass}>Who do you want to sell to? (Optional)</label>
                <p className={hintClass}>Who's your ideal customer? Who would buy your products?</p>
                <textarea
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                  placeholder="My ideal customer is..."
                  className={inputClass}
                  style={{ minHeight: '80px' }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Why Sheek */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="font-lux text-2xl font-bold text-ivory sm:text-3xl">Why You Chose Me</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">I really want to understand what brought you here and what you need from me.</p>
              </div>

              <div className="mb-6">
                <label className={labelClass}>Why did you choose me for coaching?</label>
                <p className={hintClass}>What made you pick this program? Be honest — this helps me understand what you're looking for.</p>
                <textarea
                  value={whySheek}
                  onChange={(e) => setWhySheek(e.target.value)}
                  placeholder="I chose you because..."
                  className={inputClass}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div className="mb-6">
                <label className={labelClass}>What do you want to get out of this coaching program?</label>
                <p className={hintClass}>What's your goal? What would make this worth your time and money?</p>
                <textarea
                  value={wantFromProgram}
                  onChange={(e) => setWantFromProgram(e.target.value)}
                  placeholder="I want to get..."
                  className={inputClass}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div className="mb-6">
                <label className={labelClass}>What do you really need the most help with?</label>
                <p className={hintClass}>Be specific. What's the thing you struggle with the most? What would change everything for you if you figured it out?</p>
                <textarea
                  value={needMostHelp}
                  onChange={(e) => setNeedMostHelp(e.target.value)}
                  placeholder="I really need help with..."
                  className={inputClass}
                  style={{ minHeight: '100px' }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Commitment */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="font-lux text-2xl font-bold text-ivory sm:text-3xl">Your Commitment</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">This program works when you work it. I need to know you're all in.</p>
              </div>

              <div className="mb-6">
                <label className={labelClass}>Will you follow through with everything we discuss?</label>
                <p className={hintClass}>This means implementing what we talk about, even when it's uncomfortable or outside your comfort zone.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setWillFollowThrough('yes')} className={yesNoBtnClass(willFollowThrough, 'yes')}>Yes, I Will</button>
                  <button type="button" onClick={() => setWillFollowThrough('no')} className={yesNoBtnClass(willFollowThrough, 'no')}>I'll Try</button>
                </div>
              </div>

              <div className="mb-6">
                <label className={labelClass}>Will you hand in your homework on time?</label>
                <p className={hintClass}>Each week has deliverables due before the next session. This keeps the program moving.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setWillDoHomework('yes')} className={yesNoBtnClass(willDoHomework, 'yes')}>Yes, On Time</button>
                  <button type="button" onClick={() => setWillDoHomework('no')} className={yesNoBtnClass(willDoHomework, 'no')}>No Promises</button>
                </div>
              </div>

              <div className="mb-6">
                <label className={labelClass}>Will you fully participate in every session?</label>
                <p className={hintClass}>Showing up means being present, asking questions, and engaging — not just watching.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setWillParticipate('yes')} className={yesNoBtnClass(willParticipate, 'yes')}>Yes, Fully</button>
                  <button type="button" onClick={() => setWillParticipate('no')} className={yesNoBtnClass(willParticipate, 'no')}>I'll Do My Best</button>
                </div>
              </div>

              <div className="mb-6">
                <label className={labelClass}>In your own words, what are your expectations?</label>
                <p className={hintClass}>Tell me what you expect from me, from this program, and from yourself. Put it all out there.</p>
                <textarea
                  value={expectations}
                  onChange={(e) => setExpectations(e.target.value)}
                  placeholder="My expectations are..."
                  className={inputClass}
                  style={{ minHeight: '120px' }}
                />
              </div>

              {(willFollowThrough !== 'yes' || willDoHomework !== 'yes' || willParticipate !== 'yes') && (
                <div className="border border-burg/30 bg-burg/12 p-4">
                  <p className="text-[12px] leading-relaxed text-burg-soft">
                    I appreciate your honesty. This program requires full commitment to get results. If you're not ready to go all in, that's okay — but let's talk about it in our first session.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="font-lux text-2xl font-bold text-ivory sm:text-3xl">Review & Submit</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">Here's everything you told me. Make sure it feels right before you submit.</p>
              </div>

              {/* Stage card */}
              <div className="mb-5 border border-gold/20 bg-gold/8 p-5">
                <div className="flex items-center gap-3">
                  {determinedStage === 'just_starting' ? <Rocket size={22} className="text-gold" /> : <Store size={22} className="text-gold" />}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Your Coaching Path</div>
                    <div className="text-[15px] font-bold text-ivory">
                      {determinedStage === 'just_starting' ? 'Just Starting Out' : 'Established Business'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <ReviewItem label="Has a Store / Website" value={hasStore === 'yes' ? `Yes — ${storeUrl}` : 'No, starting fresh'} />
                <ReviewItem label="Has Sales" value={hasSales === 'yes' ? `Yes — selling for ${sellingDuration || 'a while'}` : 'No sales yet'} />
                <ReviewItem label="Business Vision" value={businessIdea} />
                <ReviewItem label="Products" value={products} />
                {targetCustomer && <ReviewItem label="Target Customer" value={targetCustomer} />}
                <ReviewItem label="Why Sheek" value={whySheek} />
                <ReviewItem label="Wants From Program" value={wantFromProgram} />
                <ReviewItem label="Needs Most Help With" value={needMostHelp} />
                <ReviewItem label="Will Follow Through" value={willFollowThrough === 'yes' ? 'Yes' : 'Will try'} />
                <ReviewItem label="Will Do Homework On Time" value={willDoHomework === 'yes' ? 'Yes' : 'No promises'} />
                <ReviewItem label="Will Fully Participate" value={willParticipate === 'yes' ? 'Yes' : 'Best effort'} />
                <ReviewItem label="Expectations" value={expectations} />
              </div>

              {error && (
                <div className="mt-5 border border-burg/40 bg-burg/15 p-4 text-[13px] text-burg-soft">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={back}
              disabled={step === 0 || saving}
              className="flex items-center gap-2 border border-gold/15 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-cream-dim transition-colors hover:border-gold/30 hover:text-cream disabled:opacity-30"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {step < SECTIONS.length - 1 ? (
              <button
                onClick={next}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-gold px-7 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-luxbg transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 bg-gold px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-luxbg transition-colors hover:bg-gold-soft disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? 'Submitting...' : 'Submit Intake'}
              </button>
            )}
          </div>

          {/* Step validation hint */}
          {!canProceed() && step < SECTIONS.length - 1 && (
            <div className="mt-4 text-center text-[11px] text-muted">
              {step === 0 && 'Please answer the store and sales questions to continue.'}
              {step === 1 && 'Please tell me about your business idea and products to continue.'}
              {step === 2 && 'Please answer all three questions to continue.'}
              {step === 3 && 'Please answer all commitment questions and share your expectations to continue.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gold/10 bg-luxcard p-4">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">{label}</div>
      <div className="whitespace-pre-line text-[13px] leading-[1.6] text-cream">{value}</div>
    </div>
  );
}
