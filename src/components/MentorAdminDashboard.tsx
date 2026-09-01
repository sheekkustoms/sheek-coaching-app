import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Save, Upload, FileText, Download, Trash2, MessageSquare,
  CheckCircle2, AlertCircle, Clock, ChevronRight, GraduationCap,
  Rocket, Store, Users, Mail, Send, Search, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type {
  MentorWeekPlan, MentorWeekFile, StudentDeliverableWithProfile,
  FeedbackStatus, MentorshipIntakeWithProfile, BusinessStage, EmailLogEntry,
} from '@/lib/types';

const WEEK_NAMES = [
  '', 'The Full Business Autopsy', 'The Pricing Truth Session', 'Know Your Buyer Cold',
  'Build the Offer Suite', 'Content That Sells', 'Platform Mastery',
  'The Repeat Customer Machine', 'Sound Like Nobody Else', 'Become the Name They Know',
  'Build the Launch Machine', 'Launch Week — For Real', 'The Debrief',
];

const PHASES = [
  { label: 'Phase 1 · Diagnose', weeks: [1, 2, 3] },
  { label: 'Phase 2 · Rebuild', weeks: [4, 5, 6] },
  { label: 'Phase 3 · Position', weeks: [7, 8, 9] },
  { label: 'Phase 4 · Launch', weeks: [10, 11, 12] },
];

interface PlanDraft {
  session_script: string;
  teaching_objective: string;
  talking_points: string;
  prep_checklist: string;
  common_struggles: string;
  mentor_notes: string;
}

const EMPTY_PLAN: PlanDraft = {
  session_script: '', teaching_objective: '', talking_points: '', prep_checklist: '',
  common_struggles: '', mentor_notes: '',
};

export function MentorAdminDashboard() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [plans, setPlans] = useState<Record<number, MentorWeekPlan>>({});
  const [files, setFiles] = useState<Record<number, MentorWeekFile[]>>({});
  const [submissions, setSubmissions] = useState<Record<number, StudentDeliverableWithProfile[]>>({});
  const [intakes, setIntakes] = useState<MentorshipIntakeWithProfile[]>([]);
  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([]);
  const [allMembers, setAllMembers] = useState<{ id: string; display_name: string; email: string | null; tier: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_PLAN);
  const [activeTab, setActiveTab] = useState<'plan' | 'files' | 'submissions' | 'intake' | 'email'>('plan');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [planRes, fileRes, subRes, intakeRes, emailRes, memberRes] = await Promise.all([
      supabase.from('mentor_week_plans').select('*'),
      supabase.from('mentor_week_files').select('*').order('created_at', { ascending: false }),
      supabase
        .from('mentorship_deliverables')
        .select('*, profiles!inner(display_name, email), mentor_deliverable_feedback(*)')
        .order('submitted_at', { ascending: false }),
      supabase
        .from('mentorship_intake')
        .select('*, profiles!inner(display_name, email)')
        .order('updated_at', { ascending: false }),
      supabase
        .from('email_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100),
      supabase
        .from('profiles')
        .select('id, display_name, email, tier')
        .eq('status', 'approved')
        .order('display_name', { ascending: true }),
    ]);

    if (planRes.data) {
      const m: Record<number, MentorWeekPlan> = {};
      (planRes.data as MentorWeekPlan[]).forEach((p) => { m[p.week_number] = p; });
      setPlans(m);
    }
    if (fileRes.data) {
      const m: Record<number, MentorWeekFile[]> = {};
      (fileRes.data as MentorWeekFile[]).forEach((f) => {
        if (!m[f.week_number]) m[f.week_number] = [];
        m[f.week_number].push(f);
      });
      setFiles(m);
    }
    if (subRes.data) {
      const m: Record<number, StudentDeliverableWithProfile[]> = {};
      (subRes.data as StudentDeliverableWithProfile[]).forEach((s) => {
        if (!m[s.week_number]) m[s.week_number] = [];
        m[s.week_number].push(s);
      });
      setSubmissions(m);
    }
    if (intakeRes.data) {
      setIntakes(intakeRes.data as MentorshipIntakeWithProfile[]);
    }
    if (emailRes.data) {
      setEmailLog(emailRes.data as EmailLogEntry[]);
    }
    if (memberRes.data) {
      setAllMembers(memberRes.data as { id: string; display_name: string; email: string | null; tier: string }[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Load draft when week changes
  useEffect(() => {
    const p = plans[currentWeek];
    if (p) {
      setDraft({
        session_script: p.session_script ?? '',
        teaching_objective: p.teaching_objective ?? '',
        talking_points: p.talking_points ?? '',
        prep_checklist: p.prep_checklist ?? '',
        common_struggles: p.common_struggles ?? '',
        mentor_notes: p.mentor_notes ?? '',
      });
    } else {
      setDraft(EMPTY_PLAN);
    }
  }, [currentWeek, plans]);

  const savePlan = async () => {
    setSaving(true);
    await supabase.from('mentor_week_plans').upsert({
      week_number: currentWeek,
      ...draft,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'week_number' });
    setSaving(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2500);
    load();
  };

  const uploadFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `week-${currentWeek}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${ext ?? ''}`;
    const { error: upErr } = await supabase.storage
      .from('mentor-files')
      .upload(filePath, file);
    if (upErr) {
      setUploading(false);
      return;
    }
    await supabase.from('mentor_week_files').insert({
      week_number: currentWeek,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
    });
    setUploading(false);
    load();
  };

  const deleteFile = async (file: MentorWeekFile) => {
    await supabase.storage.from('mentor-files').remove([file.file_path]);
    await supabase.from('mentor_week_files').delete().eq('id', file.id);
    load();
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from('mentor-files').getPublicUrl(path);
    return data.publicUrl;
  };

  const saveFeedback = async (deliverableId: string, studentId: string, text: string, status: FeedbackStatus) => {
    await supabase.from('mentor_deliverable_feedback').upsert({
      deliverable_id: deliverableId,
      student_id: studentId,
      feedback_text: text,
      status,
      created_at: new Date().toISOString(),
    }, { onConflict: 'deliverable_id' });
    load();
  };

  const weekSubmissions = submissions[currentWeek] ?? [];
  const weekFiles = files[currentWeek] ?? [];
  const justStartingCount = intakes.filter((i) => i.business_stage === 'just_starting').length;
  const establishedCount = intakes.filter((i) => i.business_stage === 'established').length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-luxbg text-cream-dim">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxbg text-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-gold/10 px-6 py-10 sm:px-10" style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(123,29,48,0.2) 0%, transparent 55%), #18080E' }}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-luxcard">
            <GraduationCap className="text-gold" size={24} />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold">Mentor Control Room</div>
            <h1 className="font-display text-4xl font-bold leading-none text-ivory sm:text-5xl">
              Your Teaching <em className="italic text-gold">System.</em>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream-dim">
              Your private command center for the 12-week program. Build your teaching plan for each week, attach homework and worksheets, and review student submissions — all in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-b border-gold/10 bg-luxmid lg:border-b-0 lg:border-r lg:sticky lg:top-0 lg:h-[calc(100vh-0px)] lg:overflow-y-auto">
          {PHASES.map((phase) => (
            <div key={phase.label}>
              <div className="px-5 pb-2 pt-5 text-[9px] font-bold uppercase tracking-[0.28em] text-muted">{phase.label}</div>
              {phase.weeks.map((w) => {
                const isCurrent = currentWeek === w;
                const hasPlan = !!plans[w];
                const subCount = (submissions[w] ?? []).length;
                return (
                  <button
                    key={w}
                    onClick={() => setCurrentWeek(w)}
                    className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-all ${
                      isCurrent ? 'border-l-2 border-gold bg-gold/8' : 'border-l-2 border-transparent hover:bg-gold/5 hover:border-gold/30'
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isCurrent ? 'bg-gold text-luxbg' : 'border border-white/8 bg-white/5 text-muted'
                    }`}>{w}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-xs font-semibold text-cream">{WEEK_NAMES[w]}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                        {hasPlan ? <><CheckCircle2 size={9} className="text-success" /> Plan set</> : <><Clock size={9} /> No plan yet</>}
                        {subCount > 0 && <span className="text-gold">{subCount} submission{subCount > 1 ? 's' : ''}</span>}
                      </span>
                    </span>
                    {isCurrent && <ChevronRight size={14} className="shrink-0 text-gold" />}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="overflow-y-auto p-6 sm:p-10">
          {/* Week header */}
          <div className="mb-6 border-b border-gold/10 pb-5">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">Week {currentWeek}</div>
            <h2 className="font-display text-3xl font-bold leading-none text-ivory sm:text-4xl">{WEEK_NAMES[currentWeek]}</h2>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 border-b border-gold/10">
            {([
              { id: 'plan', label: 'Teaching Plan', icon: FileText },
              { id: 'files', label: `Homework & Files (${weekFiles.length})`, icon: Upload },
              { id: 'submissions', label: `Student Submissions (${weekSubmissions.length})`, icon: MessageSquare },
              { id: 'intake', label: `Student Intake (${intakes.length})`, icon: Users },
              { id: 'email', label: 'Email System', icon: Mail },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-gold text-gold'
                    : 'border-b-2 border-transparent text-muted hover:text-cream'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Teaching Plan Tab */}
          {activeTab === 'plan' && (
            <div className="animate-fade-in flex flex-col gap-5">
              <PlanField
                label="Session Script & Key Answers"
                hint="Your full read-aloud script for this session. Every key answer, teaching point, and thing you need to say is right here. Read from this during your session."
                value={draft.session_script}
                onChange={(v) => setDraft({ ...draft, session_script: v })}
                placeholder="Your full session script will appear here..."
                multiline
                large
              />
              <PlanField
                label="Your Teaching Objective"
                hint="What you want students to walk away knowing by the end of this session."
                value={draft.teaching_objective}
                onChange={(v) => setDraft({ ...draft, teaching_objective: v })}
                placeholder="e.g. Students will understand the True Cost Formula and be able to recalculate their pricing with confidence."
              />
              <PlanField
                label="Talking Points & Curriculum"
                hint="The key points you'll cover during the session. One per line."
                value={draft.talking_points}
                onChange={(v) => setDraft({ ...draft, talking_points: v })}
                placeholder={"Why makers undercharge\nThe 5-part True Cost Formula\nHow to handle 'that's too expensive'\nValue-based vs. cost-based pricing"}
                multiline
              />
              <PlanField
                label="Your Prep Checklist"
                hint="What you need to prepare before this session. One per line."
                value={draft.prep_checklist}
                onChange={(v) => setDraft({ ...draft, prep_checklist: v })}
                placeholder={"Review each student's current pricing\nPrepare the pricing worksheet template\nPull examples of good vs. bad listings"}
                multiline
              />
              <PlanField
                label="Common Student Struggles"
                hint="Where students typically get stuck on this topic, and how you'll coach them through it."
                value={draft.common_struggles}
                onChange={(v) => setDraft({ ...draft, common_struggles: v })}
                placeholder={"Fear of raising prices and losing customers\nNot knowing their real costs\nImposter syndrome around 'premium' pricing"}
                multiline
              />
              <PlanField
                label="Your Private Mentor Notes"
                hint="Your own reference notes. Students cannot see this field."
                value={draft.mentor_notes}
                onChange={(v) => setDraft({ ...draft, mentor_notes: v })}
                placeholder="Personal reminders, coaching cues, things to watch for..."
                multiline
              />

              <button
                onClick={savePlan}
                disabled={saving}
                className="flex items-center gap-2 self-start bg-gold px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-luxbg transition-colors hover:bg-gold-soft disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                {saveFlash ? 'Saved!' : 'Save Teaching Plan'}
              </button>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="animate-fade-in flex flex-col gap-5">
              <div className="border border-gold/12 bg-luxcard p-6">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Upload Homework or Worksheet</div>
                <p className="mb-4 text-[13px] leading-relaxed text-cream-dim">
                  Upload worksheets, templates, homework assignments, or any file students need for this week. They'll be able to download these from their student dashboard.
                </p>
                <label className="flex cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-gold/20 bg-gold/4 px-6 py-8 text-center transition-colors hover:border-gold/40 hover:bg-gold/8">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
                  />
                  {uploading ? (
                    <><Loader2 className="animate-spin text-gold" size={18} /><span className="text-sm text-cream-dim">Uploading...</span></>
                  ) : (
                    <><Upload size={18} className="text-gold" /><span className="text-sm text-cream-dim">Click to select a file</span></>
                  )}
                </label>
              </div>

              {weekFiles.length === 0 ? (
                <div className="border border-gold/8 bg-luxcard px-6 py-10 text-center text-sm text-muted">
                  No files uploaded for Week {currentWeek} yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {weekFiles.map((f) => (
                    <div key={f.id} className="flex items-center gap-4 border border-gold/10 bg-luxcard p-4">
                      <FileText size={20} className="shrink-0 text-gold" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-semibold text-cream">{f.file_name}</div>
                        <div className="text-[11px] text-muted">
                          {f.file_type || 'File'} · {f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : ''}
                        </div>
                      </div>
                      <a
                        href={getFileUrl(f.file_path)}
                        download={f.file_name}
                        className="flex items-center gap-1.5 border border-gold/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/10"
                      >
                        <Download size={13} /> Download
                      </a>
                      <button
                        onClick={() => deleteFile(f)}
                        className="flex items-center justify-center p-2 text-error-soft transition-colors hover:bg-error/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="animate-fade-in flex flex-col gap-4">
              {weekSubmissions.length === 0 ? (
                <div className="border border-gold/8 bg-luxcard px-6 py-10 text-center text-sm text-muted">
                  No student submissions for Week {currentWeek} yet.
                </div>
              ) : (
                weekSubmissions.map((sub) => (
                  <SubmissionCard key={sub.id} submission={sub} onSaveFeedback={saveFeedback} />
                ))
              )}
            </div>
          )}

          {/* Intake Tab */}
          {activeTab === 'intake' && (
            <IntakeManager intakes={intakes} justStartingCount={justStartingCount} establishedCount={establishedCount} onRefresh={load} />
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <EmailManager emailLog={emailLog} members={allMembers} onRefresh={load} />
          )}
        </main>
      </div>
    </div>
  );
}

function IntakeManager({
  intakes, justStartingCount, establishedCount, onRefresh,
}: {
  intakes: MentorshipIntakeWithProfile[];
  justStartingCount: number;
  establishedCount: number;
  onRefresh: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gamePlans, setGamePlans] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  useEffect(() => {
    const gp: Record<string, string> = {};
    intakes.forEach((i) => {
      gp[i.user_id] = i.game_plan ?? '';
    });
    setGamePlans(gp);
  }, [intakes]);

  const saveIntake = async (userId: string) => {
    setSaving(userId);
    await supabase.from('mentorship_intake').update({
      game_plan: gamePlans[userId] ?? '',
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    setSaving(null);
    setSavedFlash(userId);
    setTimeout(() => setSavedFlash(null), 2500);
    onRefresh();
  };

  const STUDENT_RESPONSE_LABELS: { key: string; label: string }[] = [
    { key: 'has_store', label: 'Has a Store / Website' },
    { key: 'store_url', label: 'Store URL' },
    { key: 'has_sales', label: 'Has Sales' },
    { key: 'selling_duration', label: 'How Long They\'ve Been Selling' },
    { key: 'business_idea', label: 'What They Want to Do for a Business' },
    { key: 'products', label: 'Products They Make / Want to Make' },
    { key: 'target_customer', label: 'Who They Want to Sell To' },
    { key: 'why_sheek', label: 'Why They Chose Me' },
    { key: 'want_from_program', label: 'What They Want From This Program' },
    { key: 'need_most_help', label: 'What They Need Most Help With' },
    { key: 'will_follow_through', label: 'Will Follow Through' },
    { key: 'will_do_homework', label: 'Will Do Homework On Time' },
    { key: 'will_participate', label: 'Will Fully Participate' },
    { key: 'expectations', label: 'Their Expectations (In Their Own Words)' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-gold/12 bg-luxcard p-5">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
            <Users size={14} /> Total Students
          </div>
          <div className="font-lux text-3xl font-bold text-ivory">{intakes.length}</div>
          <div className="mt-1 text-[11px] text-muted">who have selected a stage</div>
        </div>
        <div className="border border-gold/12 bg-luxcard p-5">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
            <Rocket size={14} /> Just Starting Out
          </div>
          <div className="font-lux text-3xl font-bold text-ivory">{justStartingCount}</div>
          <div className="mt-1 text-[11px] text-muted">brand new, no store yet</div>
        </div>
        <div className="border border-gold/12 bg-luxcard p-5">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
            <Store size={14} /> Established Business
          </div>
          <div className="font-lux text-3xl font-bold text-ivory">{establishedCount}</div>
          <div className="mt-1 text-[11px] text-muted">has sales data to audit</div>
        </div>
      </div>

      {intakes.length === 0 ? (
        <div className="border border-gold/8 bg-luxcard px-6 py-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-muted" />
          <div className="text-sm text-muted">
            No students have selected their stage yet. Once they pick "Just Starting Out" or "Established Business" in Week 1, they'll appear here.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {intakes.map((intake) => {
            const isExpanded = expandedId === intake.user_id;
            const isJustStarting = intake.business_stage === 'just_starting';
            return (
              <div key={intake.user_id} className="border border-gold/12 bg-luxcard">
                {/* Student header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : intake.user_id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-gold/4"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isJustStarting ? 'bg-gold/12' : 'bg-burg/15'}`}>
                    {isJustStarting ? <Rocket size={18} className="text-gold" /> : <Store size={18} className="text-burg-soft" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-cream">{intake.profiles?.display_name ?? 'Unknown'}</div>
                    <div className="text-[11px] text-muted">{intake.profiles?.email ?? ''}</div>
                  </div>
                  <div className={`shrink-0 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${isJustStarting ? 'border-gold/25 text-gold' : 'border-burg/30 text-burg-soft'}`}>
                    {isJustStarting ? 'Just Starting' : 'Established'}
                  </div>
                  {intake.game_plan && (
                    <div className="hidden shrink-0 items-center gap-1.5 text-[10px] text-success-soft sm:flex">
                      <CheckCircle2 size={11} /> Plan written
                    </div>
                  )}
                  <ChevronRight size={16} className={`shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded intake form */}
                {isExpanded && (
                  <div className="border-t border-gold/10 p-6">
                    {/* Student's intake responses (read-only) */}
                    <div className="mb-6">
                      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Student Intake Responses</div>
                      <p className="mb-4 text-[12px] leading-relaxed text-muted">
                        What {intake.profiles?.display_name ?? 'this student'} submitted when they joined.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {STUDENT_RESPONSE_LABELS.map((q) => {
                          const raw = intake.intake_responses?.[q.key];
                          if (!raw) return null;
                          const display = raw === 'yes' ? 'Yes' : raw === 'no' ? 'No' : raw;
                          return (
                            <div key={q.key} className="border border-gold/10 bg-white/3 p-3.5">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">{q.label}</div>
                              <div className="whitespace-pre-line text-[13px] leading-[1.6] text-cream">{display}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Game plan */}
                    <div className="mb-4 border-t border-gold/10 pt-5">
                      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                        <FileText size={13} /> Personalized Game Plan
                      </div>
                      <p className="mb-3 text-[12px] leading-relaxed text-muted">
                        Write a tailored game plan for {intake.profiles?.display_name ?? 'this student'} based on their responses. This will appear on their Week 1 dashboard so they can see your plan for them.
                      </p>
                      <textarea
                        value={gamePlans[intake.user_id] ?? ''}
                        onChange={(e) => setGamePlans({ ...gamePlans, [intake.user_id]: e.target.value })}
                        placeholder={`Based on what you shared, here's your personalized plan:\n\nWeeks 1-3: We're going to focus on...\nWeeks 4-6: Once your products are ready, we'll...\nWeeks 7-9: ...\nWeeks 10-12: ...`}
                        className="w-full resize-vertical border border-gold/20 bg-gold/4 p-4 text-[13px] leading-[1.8] text-cream outline-none transition-colors placeholder:text-muted/60 focus:border-gold"
                        style={{ minHeight: '180px', fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>

                    <button
                      onClick={() => saveIntake(intake.user_id)}
                      disabled={saving === intake.user_id}
                      className="flex items-center gap-2 bg-gold px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-luxbg transition-colors hover:bg-gold-soft disabled:opacity-50"
                    >
                      {saving === intake.user_id ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
                      {savedFlash === intake.user_id ? 'Saved!' : 'Save Game Plan'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmailManager({
  emailLog, members, onRefresh,
}: {
  emailLog: EmailLogEntry[];
  members: { id: string; display_name: string; email: string | null; tier: string }[];
  onRefresh: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.display_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
  });

  const toggleMember = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const selectMentorship = () => {
    setSelectedIds(new Set(members.filter((m) => m.tier === 'mentorship').map((m) => m.id)));
  };

  const selectedMembers = members.filter((m) => selectedIds.has(m.id));
  const validEmails = selectedMembers.filter((m) => m.email).map((m) => m.email!);

  const sendEmail = async () => {
    if (validEmails.length === 0) {
      setSendResult({ type: 'error', msg: 'Please select at least one member with an email address.' });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setSendResult({ type: 'error', msg: 'Please enter a subject and message.' });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipients: validEmails,
          recipient_user_ids: Array.from(selectedIds),
          subject: subject,
          body: body,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSendResult({ type: 'error', msg: result.error ?? 'Failed to send email.' });
      } else {
        setSendResult({ type: 'success', msg: `Email sent to ${validEmails.length} recipient${validEmails.length > 1 ? 's' : ''}.` });
        setSubject('');
        setBody('');
        setSelectedIds(new Set());
        onRefresh();
      }
    } catch {
      setSendResult({ type: 'error', msg: 'Network error — could not reach the email service.' });
    }

    setSending(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      {/* Composer */}
      <div className="border border-gold/12 bg-luxcard p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
          <Mail size={14} /> Compose Branded Email
        </div>

        {/* Recipient selector */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-[12px] font-bold uppercase tracking-[0.14em] text-gold">Recipients ({selectedIds.size} selected)</label>
            <div className="flex gap-2">
              <button onClick={selectAll} className="border border-gold/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-cream-dim transition-colors hover:border-gold/30 hover:text-cream">
                {selectedIds.size === filteredMembers.length ? 'Clear All' : 'Select All'}
              </button>
              <button onClick={selectMentorship} className="border border-gold/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-cream-dim transition-colors hover:border-gold/30 hover:text-cream">
                Mentorship Only
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members by name or email..."
              className="w-full border border-gold/15 bg-white/3 py-2.5 pl-9 pr-3 text-[13px] text-cream outline-none transition-colors placeholder:text-muted/50 focus:border-gold"
            />
          </div>

          {/* Member list */}
          <div className="max-h-48 overflow-y-auto border border-gold/10 bg-white/3">
            {filteredMembers.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-muted">No members found.</div>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={`flex w-full items-center gap-3 border-b border-gold/6 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-gold/4 ${
                    selectedIds.has(m.id) ? 'bg-gold/8' : ''
                  }`}
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 ${selectedIds.has(m.id) ? 'border-gold bg-gold' : 'border-gold/25'}`}>
                    {selectedIds.has(m.id) && <Check size={10} className="text-luxbg" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-cream">{m.display_name}</div>
                    <div className="text-[11px] text-muted">{m.email ?? 'No email on file'}</div>
                  </div>
                  {m.tier === 'mentorship' && (
                    <span className="shrink-0 border border-gold/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-gold">Mentorship</span>
                  )}
                </button>
              ))
            )}
          </div>

          {validEmails.length > 0 && (
            <div className="mt-2 text-[11px] text-success-soft">
              {validEmails.length} email{validEmails.length > 1 ? 's' : ''} will receive this message
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.14em] text-gold">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Your Week 1 Assignment, Important Update, Welcome to Mentorship..."
            className="w-full border border-gold/15 bg-white/3 p-3.5 text-[14px] text-cream outline-none transition-colors placeholder:text-muted/50 focus:border-gold"
          />
        </div>

        {/* Body */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.14em] text-gold">Message</label>
          <p className="mb-2 text-[11px] leading-relaxed text-muted">The email will automatically include your Sheek Academy branded header, gold accents, and footer. Just write your message here.</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here...

Each line break becomes a paragraph in the branded email.
Keep it conversational and clear."
            className="w-full resize-vertical border border-gold/15 bg-white/3 p-4 text-[14px] leading-[1.7] text-cream outline-none transition-colors placeholder:text-muted/50 focus:border-gold"
            style={{ minHeight: '200px', fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>

        {/* Send button */}
        <div className="flex items-center gap-4">
          <button
            onClick={sendEmail}
            disabled={sending}
            className="flex items-center gap-2 bg-gold px-7 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-luxbg transition-colors hover:bg-gold-soft disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Sending...' : 'Send Email'}
          </button>

          {sendResult && (
            <div className={`flex items-center gap-2 text-[12px] ${sendResult.type === 'success' ? 'text-success-soft' : 'text-burg-soft'}`}>
              {sendResult.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {sendResult.msg}
            </div>
          )}
        </div>
      </div>

      {/* Email history */}
      <div className="border border-gold/12 bg-luxcard">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-gold/4"
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
            <Mail size={14} /> Sent Email History ({emailLog.length})
          </div>
          <ChevronRight size={16} className={`text-muted transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>

        {showHistory && (
          <div className="border-t border-gold/10">
            {emailLog.length === 0 ? (
              <div className="px-6 py-8 text-center text-[12px] text-muted">No emails sent yet.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {emailLog.map((entry) => (
                  <div key={entry.id} className="border-b border-gold/6 p-4 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-cream">{entry.subject}</span>
                          {entry.status === 'failed' ? (
                            <span className="border border-burg/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-burg-soft">Failed</span>
                          ) : (
                            <span className="border border-green/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-success-soft">Sent</span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-muted">
                          To: {entry.recipients.join(', ')}
                        </div>
                        <div className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-cream-dim">
                          {entry.body.substring(0, 150)}{entry.body.length > 150 ? '...' : ''}
                        </div>
                        {entry.status === 'failed' && entry.error_message && (
                          <div className="mt-1.5 text-[11px] text-burg-soft">Error: {entry.error_message.substring(0, 100)}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-[10px] text-muted">
                        {formatDate(entry.sent_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanField({
  label, hint, value, onChange, placeholder, multiline, large,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`border border-gold/10 bg-luxcard p-6 ${large ? 'border-gold/25 shadow-gold-glow' : ''}`}>
      <div className="mb-1.5 flex items-center gap-2">
        {large && <FileText size={14} className="text-gold" />}
        <div className={`text-[10px] font-bold uppercase tracking-[0.24em] text-gold ${large ? 'text-[11px]' : ''}`}>{label}</div>
      </div>
      <p className="mb-3.5 text-[12px] leading-relaxed text-muted">{hint}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-vertical border border-gold/15 bg-white/3 p-3.5 text-[13px] leading-[1.7] text-cream outline-none transition-colors placeholder:text-muted/60 focus:border-gold"
          style={{ minHeight: large ? '320px' : '100px', fontFamily: "'DM Sans', sans-serif" }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gold/15 bg-white/3 p-3.5 text-[13px] text-cream outline-none transition-colors placeholder:text-muted/60 focus:border-gold"
        />
      )}
    </div>
  );
}

function SubmissionCard({
  submission, onSaveFeedback,
}: {
  submission: StudentDeliverableWithProfile;
  onSaveFeedback: (deliverableId: string, studentId: string, text: string, status: FeedbackStatus) => void;
}) {
  const existing = submission.mentor_deliverable_feedback;
  const [feedback, setFeedback] = useState(existing?.feedback_text ?? '');
  const [status, setStatus] = useState<FeedbackStatus>(existing?.status ?? 'reviewed');
  const [saved, setSaved] = useState(false);

  const checklistItems = Object.entries(submission.checklist_state || {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  return (
    <div className="border border-gold/12 bg-luxcard p-6">
      {/* Student info */}
      <div className="mb-4 flex items-center justify-between border-b border-gold/10 pb-3">
        <div>
          <div className="text-sm font-bold text-cream">{submission.profiles?.display_name ?? 'Unknown Student'}</div>
          <div className="text-[11px] text-muted">{submission.profiles?.email ?? ''}</div>
        </div>
        <div className="text-[11px] text-muted">
          {new Date(submission.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Checklist */}
      {checklistItems.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Completed Checklist Items</div>
          <div className="flex flex-wrap gap-2">
            {checklistItems.map((k) => (
              <span key={k} className="flex items-center gap-1.5 border border-success/20 bg-success/8 px-3 py-1.5 text-[11px] text-success-soft">
                <CheckCircle2 size={11} /> Item {k.replace('item_', '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {submission.notes && (
        <div className="mb-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Student's Notes</div>
          <div className="whitespace-pre-line border-l-2 border-gold/30 bg-white/3 p-4 text-[13px] leading-[1.7] text-cream-dim">
            {submission.notes}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="border-t border-gold/10 pt-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Your Feedback</div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Leave feedback for this student..."
          className="mb-3 w-full resize-vertical border border-gold/15 bg-white/3 p-3 text-[13px] leading-[1.6] text-cream outline-none transition-colors placeholder:text-muted/60 focus:border-gold"
          style={{ minHeight: '80px', fontFamily: "'DM Sans', sans-serif" }}
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {([
              { val: 'reviewed' as const, label: 'Reviewed', icon: Clock, color: 'text-gold' },
              { val: 'needs_revision' as const, label: 'Needs Revision', icon: AlertCircle, color: 'text-warning' },
              { val: 'approved' as const, label: 'Approved', icon: CheckCircle2, color: 'text-success' },
            ]).map((s) => (
              <button
                key={s.val}
                onClick={() => setStatus(s.val)}
                className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  status === s.val
                    ? `border-current ${s.color} bg-white/5`
                    : 'border-gold/12 text-muted hover:text-cream'
                }`}
              >
                <s.icon size={12} />
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onSaveFeedback(submission.id, submission.user_id, feedback, status);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className="ml-auto flex items-center gap-2 bg-gold px-5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-luxbg transition-colors hover:bg-gold-soft"
          >
            <Save size={13} />
            {saved ? 'Saved!' : 'Save Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
