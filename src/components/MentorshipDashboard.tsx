import { useEffect, useState, useCallback } from 'react';
import { Lock, Check, Loader2, Sparkles, BookOpen, PlayCircle, MessageSquare, Users, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { MentorshipProgress, MentorshipDeliverable, BusinessStage, MentorshipIntake, MentorshipWeekContent } from '@/lib/types';
import { IntakeForm } from '@/components/IntakeForm';
import { MentorshipClassroom } from '@/components/mentorship/MentorshipClassroom';
import { SESSION_NAMES } from '@/components/mentorship/WeekDetailLegacy';
import { Community } from '@/components/Community';
import { Members } from '@/components/Members';
import { Calendar } from '@/components/Calendar';

const PHASE_LABELS = [
  '',
  'Phase 1 · Diagnose · Wks 1–3',
  'Phase 2 · Rebuild · Wks 4–6',
  'Phase 3 · Position · Wks 7–9',
  'Phase 4 · Launch · Wks 10–12',
];

type SubNav = 'overview' | 'classroom' | 'community' | 'members' | 'calendar';

export function MentorshipDashboard() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.is_admin === true;
  const [subNav, setSubNav] = useState<SubNav>('overview');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [progress, setProgress] = useState<MentorshipProgress[]>([]);
  const [deliverables, setDeliverables] = useState<MentorshipDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklists, setChecklists] = useState<Record<number, Record<string, boolean>>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submitFlash, setSubmitFlash] = useState<number | null>(null);
  const [intake, setIntake] = useState<MentorshipIntake | null>(null);
  const [stageSaving, setStageSaving] = useState(false);
  const [weekContent, setWeekContent] = useState<MentorshipWeekContent[]>([]);
  const stage: BusinessStage = intake?.business_stage ?? 'established';
  const isJustStarting = stage === 'just_starting';

  const completedSet = new Set(progress.filter((p) => p.completed).map((p) => p.week_number));
  const unlockedThrough = isAdmin ? 12 : (completedSet.size > 0 ? Math.max(...[...completedSet, 1]) + 1 : 1);
  const weeksCompleted = completedSet.size;
  const deliverablesSubmitted = deliverables.length;
  const totalWeeks = 12;
  const pct = Math.round((weeksCompleted / totalWeeks) * 100);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [progRes, delRes, intakeRes, contentRes] = await Promise.all([
      supabase.from('mentorship_progress').select('*').eq('user_id', user.id),
      supabase.from('mentorship_deliverables').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false }),
      supabase.from('mentorship_intake').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('mentorship_week_content').select('*').order('week_number', { ascending: true }),
    ]);
    if (progRes.data) setProgress(progRes.data as MentorshipProgress[]);
    if (intakeRes.data) setIntake(intakeRes.data as MentorshipIntake);
    if (contentRes.data) setWeekContent(contentRes.data as MentorshipWeekContent[]);
    if (delRes.data) {
      setDeliverables(delRes.data as MentorshipDeliverable[]);
      const cl: Record<number, Record<string, boolean>> = {};
      const nt: Record<number, string> = {};
      (delRes.data as MentorshipDeliverable[]).forEach((d) => {
        const latest = cl[d.week_number];
        if (!latest || new Date(d.submitted_at) > new Date(d.submitted_at)) {
          cl[d.week_number] = d.checklist_state || {};
          nt[d.week_number] = d.notes || '';
        }
      });
      setChecklists(cl);
      setNotes(nt);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 7);
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setCountdown({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const toggleCheck = (weekNum: number, idx: number) => {
    setChecklists((prev) => {
      const wk = { ...(prev[weekNum] || {}) };
      wk[`item_${idx}`] = !wk[`item_${idx}`];
      return { ...prev, [weekNum]: wk };
    });
  };

  const submitDeliverable = async (weekNum: number) => {
    if (!user) return;
    const noteText = notes[weekNum]?.trim();
    const cl = checklists[weekNum] || {};
    if (!noteText && Object.keys(cl).filter((k) => cl[k]).length === 0) return;
    setSaving(true);
    await supabase.from('mentorship_deliverables').insert({
      user_id: user.id,
      week_number: weekNum,
      checklist_state: cl,
      notes: noteText || null,
    });
    setSaving(false);
    setSubmitFlash(weekNum);
    setTimeout(() => setSubmitFlash(null), 3000);
    setNotes((prev) => ({ ...prev, [weekNum]: '' }));
    load();
  };

  const completeWeek = async (weekNum: number) => {
    if (!user || completedSet.has(weekNum)) return;
    setSaving(true);
    await supabase.from('mentorship_progress').upsert({
      user_id: user.id,
      week_number: weekNum,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_number' });
    setSaving(false);
    await load();
    const next = weekNum + 1;
    if (next <= 12) {
      setTimeout(() => setCurrentWeek(next), 400);
    }
  };

  const selectStage = async (s: BusinessStage) => {
    if (!user) return;
    setStageSaving(true);
    await supabase.from('mentorship_intake').upsert({
      user_id: user.id,
      business_stage: s,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setStageSaving(false);
    load();
  };

  const nextSessionNum = Math.min(currentWeek + 1, 12);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-luxbg text-cream-dim">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!isAdmin && !intake) {
    return <IntakeForm onComplete={load} />;
  }

  const subNavTabs: { id: SubNav; label: string; icon: typeof Sparkles }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'classroom', label: 'Classroom', icon: BookOpen },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-luxbg text-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nested sub-navigation bar */}
      <div className="flex gap-1 border-b border-gold/10 bg-luxmid px-4 sm:px-8">
        {subNavTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubNav(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                subNav === t.id
                  ? 'border-b-2 border-gold text-gold'
                  : 'border-b-2 border-transparent text-cream-dim hover:text-cream'
              }`}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {subNav === 'classroom' ? (
        <MentorshipClassroom
          weekContent={weekContent}
          progress={progress}
          deliverables={deliverables}
          intake={intake}
          isAdmin={isAdmin}
          saving={saving}
          submitFlash={submitFlash}
          checklists={checklists}
          notes={notes}
          onToggleCheck={toggleCheck}
          onSetNotes={(num, text) => setNotes((prev) => ({ ...prev, [num]: text }))}
          onSubmitDeliverable={submitDeliverable}
          onCompleteWeek={completeWeek}
          onSelectStage={selectStage}
          stageSaving={stageSaving}
          onContentUpdated={load}
        />
      ) : subNav === 'community' ? (
        <div className="p-6 sm:p-10" style={{ background: '#18080E' }}>
          <Community scope="mentorship" />
        </div>
      ) : subNav === 'members' ? (
        <div className="p-6 sm:p-10" style={{ background: '#18080E' }}>
          <Members mentorshipOnly />
        </div>
      ) : subNav === 'calendar' ? (
        <div className="p-6 sm:p-10" style={{ background: '#18080E' }}>
          <Calendar category="mentorship" />
        </div>
      ) : (
        <>
          {/* Welcome Hero */}
          <div className="border-b border-gold/10 px-6 py-10 sm:px-10 sm:py-12" style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(123,29,48,0.2) 0%, transparent 55%), #18080E' }}>
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="font-lux text-4xl font-bold leading-none sm:text-5xl" style={{ color: '#FBF4EC' }}>
                  Welcome,<br /><em className="italic text-gold">Maker.</em>
                </h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-dim">
                  This is your private student dashboard. Your curriculum unlocks week by week as we move through the program together. Stay focused, do the work, submit your deliverables — and watch your business change.
                </p>
              </div>
              <div className="min-w-[240px] border border-gold/20 bg-luxcard p-5 sm:p-6">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Next Live Session</div>
                <div className="mb-3 text-[13px] font-semibold text-ivory">Week {nextSessionNum} · {SESSION_NAMES[nextSessionNum]}</div>
                <div className="flex gap-2">
                  {(['d','h','m','s'] as const).map((u) => (
                    <div key={u} className="min-w-[52px] border border-gold/12 bg-luxbg px-3 py-2 text-center">
                      <span className="font-lux block text-2xl font-bold leading-none text-gold">
                        {String(countdown[u]).padStart(2, '0')}
                      </span>
                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
                        {u === 'd' ? 'Days' : u === 'h' ? 'Hrs' : u === 'm' ? 'Min' : 'Sec'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cream-dim whitespace-nowrap">Your Progress</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(8, pct)}%`, background: 'linear-gradient(90deg, #7B1D30, #C9953A)' }} />
              </div>
              <span className="text-xs font-bold text-gold whitespace-nowrap">Week {weeksCompleted + 1} of 12</span>
            </div>

            <div className="mt-6 flex gap-px">
              {[
                { num: weeksCompleted, label: 'Weeks Complete' },
                { num: deliverablesSubmitted, label: 'Deliverables Submitted' },
                { num: 3, label: 'Private 1:1s Total' },
                { num: 12, label: 'Weeks in Program' },
              ].map((s) => (
                <div key={s.label} className="flex-1 border border-gold/8 bg-luxcard p-4 text-center sm:p-5">
                  <div className="font-lux text-3xl font-bold leading-none text-gold">{s.num}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
