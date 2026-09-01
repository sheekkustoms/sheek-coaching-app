import { useRef, useState, type ChangeEvent } from 'react';
import { Lock, Check, PlayCircle, ImagePlus, X, Loader2, ArrowLeft, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  MentorshipWeekContent,
  MentorshipProgress,
  MentorshipDeliverable,
  MentorshipIntake,
  BusinessStage,
} from '@/lib/types';
import { WEEKS } from '@/components/mentorship/WeekDetailLegacy';
import { MentorshipCourseDetail } from '@/components/mentorship/MentorshipCourseDetail';

const PHASES = [
  { num: 1, label: 'Phase 1', name: 'Foundations, Pricing & Buyer Psychology', weeks: [1, 2, 3] },
  { num: 2, label: 'Phase 2', name: 'Store Setup, Content Engines & Platforms', weeks: [4, 5, 6] },
  { num: 3, label: 'Phase 3', name: 'DM Sales, Brand Voice & Authority', weeks: [7, 8, 9] },
  { num: 4, label: 'Phase 4', name: 'Launch Execution, Holiday Drops & Scale', weeks: [10, 11, 12] },
];

interface MentorshipClassroomProps {
  weekContent: MentorshipWeekContent[];
  progress: MentorshipProgress[];
  deliverables: MentorshipDeliverable[];
  intake: MentorshipIntake | null;
  isAdmin: boolean;
  saving: boolean;
  submitFlash: number | null;
  checklists: Record<number, Record<string, boolean>>;
  notes: Record<number, string>;
  onToggleCheck: (weekNum: number, idx: number) => void;
  onSetNotes: (weekNum: number, text: string) => void;
  onSubmitDeliverable: (weekNum: number) => void;
  onCompleteWeek: (weekNum: number) => void;
  onSelectStage: (stage: BusinessStage) => void;
  stageSaving: boolean;
  onContentUpdated: () => void;
}

export function MentorshipClassroom({
  weekContent,
  progress,
  deliverables,
  intake,
  isAdmin,
  saving,
  submitFlash,
  checklists,
  notes,
  onToggleCheck,
  onSetNotes,
  onSubmitDeliverable,
  onCompleteWeek,
  onSelectStage,
  stageSaving,
  onContentUpdated,
}: MentorshipClassroomProps) {
  const [openPhase, setOpenPhase] = useState<number | null>(null);
  const [editingThumb, setEditingThumb] = useState<number | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const completedSet = new Set(progress.filter((p) => p.completed).map((p) => p.week_number));
  const unlockedThrough = isAdmin ? 12 : completedSet.size > 0 ? Math.max(...[...completedSet, 1]) + 1 : 1;

  const getWeekTitle = (num: number) => {
    const wc = weekContent.find((w) => w.week_number === num);
    if (wc && wc.title) return wc.title;
    const legacy = WEEKS.find((w) => w.num === num);
    return legacy?.name ?? `Week ${num}`;
  };

  const getWeekImage = (num: number): string | null => {
    const wc = weekContent.find((w) => w.week_number === num);
    return wc?.image_url ?? null;
  };

  const weekHasMedia = (num: number) => {
    const wc = weekContent.find((w) => w.week_number === num);
    return Boolean(wc && (wc.video_url || wc.pdf_url));
  };

  const onPickThumb = (weekNum: number) => {
    setEditingThumb(weekNum);
    fileRef.current?.click();
  };

  const onThumbChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingThumb === null) return;
    setUploadingThumb(true);
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `week-${editingThumb}/thumb.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('mentorship-files')
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingThumb(false);
      setError(upErr.message);
      setEditingThumb(null);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('mentorship-files').getPublicUrl(path);
    const url = pub.publicUrl + `?t=${Date.now()}`;
    const { error: updErr } = await supabase
      .from('mentorship_week_content')
      .update({ image_url: url, updated_at: new Date().toISOString() })
      .eq('week_number', editingThumb);
    setUploadingThumb(false);
    const weekNum = editingThumb;
    setEditingThumb(null);
    e.target.value = '';
    if (updErr) {
      setError(updErr.message);
      return;
    }
    onContentUpdated();
    void weekNum;
  };

  const removeThumb = async (weekNum: number) => {
    const wc = weekContent.find((w) => w.week_number === weekNum);
    if (wc?.image_url) {
      const ext = wc.image_url.split('/').pop()?.split('?')[0]?.split('.').pop() || 'jpg';
      const path = `week-${weekNum}/thumb.${ext}`;
      await supabase.storage.from('mentorship-files').remove([path]);
    }
    const { error } = await supabase
      .from('mentorship_week_content')
      .update({ image_url: null, updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    if (error) {
      setError(error.message);
      return;
    }
    onContentUpdated();
  };

  // --- Phase detail view ---
  if (openPhase !== null) {
    const phase = PHASES.find((p) => p.num === openPhase)!;
    return (
      <div style={{ background: '#18080E' }}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onThumbChange} />

        {error && (
          <div className="mx-6 mt-5 flex items-center justify-between border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft sm:mx-10">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
              <X size={15} />
            </button>
          </div>
        )}

        <MentorshipCourseDetail
          weekContent={weekContent}
          phase={phase}
          isAdmin={isAdmin}
          unlockedThrough={unlockedThrough}
          onBack={() => setOpenPhase(null)}
          onPickThumb={onPickThumb}
          removeThumb={removeThumb}
          uploadingThumb={uploadingThumb}
          editingThumb={editingThumb}
        />
      </div>
    );
  }

  // --- Phase card grid view ---
  return (
    <div className="p-6 sm:p-10" style={{ background: '#18080E' }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onThumbChange} />

      {error && (
        <div className="mb-5 flex items-center justify-between border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-lux text-3xl font-bold sm:text-4xl" style={{ color: '#FBF4EC' }}>
          Mentorship Classroom
        </h1>
        <p className="mt-1.5 text-sm text-cream-dim">
          Your 12-week curriculum, organized by phase. Click a phase to open its weeks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PHASES.map((phase) => {
          const phaseWeeks = phase.weeks.map((n) => WEEKS.find((w) => w.num === n)!);
          const allDone = phase.weeks.every((n) => completedSet.has(n));
          const doneCount = phase.weeks.filter((n) => completedSet.has(n)).length;
          const pct = Math.round((doneCount / phase.weeks.length) * 100);
          const firstImage = getWeekImage(phase.weeks[0]);

          return (
            <div
              key={phase.num}
              className="group relative flex flex-col overflow-hidden border border-gold/15 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(201,149,58,0.12)]"
              style={{ background: '#0F0509' }}
            >
              {/* Banner */}
              <button
                onClick={() => setOpenPhase(phase.num)}
                className="relative block h-36 cursor-pointer overflow-hidden"
              >
                {firstImage ? (
                  <img
                    src={firstImage}
                    alt={phase.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(123,29,48,0.5) 0%, rgba(15,5,9,0.9) 60%, rgba(201,149,58,0.15) 100%)',
                    }}
                  >
                    <span className="relative px-4 text-center font-lux text-lg font-semibold leading-snug text-cream/90 drop-shadow-md">
                      {phase.label} · {phase.name}
                    </span>
                  </div>
                )}

                {/* Phase label */}
                <div className="absolute left-3 top-3">
                  <span className="border border-gold/20 bg-luxbg/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold backdrop-blur-sm">
                    {phase.label} · {phase.name}
                  </span>
                </div>

                {/* Completed badge */}
                {allDone && (
                  <div className="absolute right-3 top-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green text-ivory shadow-md">
                      <Check size={14} />
                    </span>
                  </div>
                )}

                {/* Media indicator */}
                {phase.weeks.some(weekHasMedia) && (
                  <div className="absolute bottom-3 right-3">
                    <span className="flex items-center gap-1 border border-gold/20 bg-luxbg/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-gold backdrop-blur-sm">
                      <PlayCircle size={11} /> Content
                    </span>
                  </div>
                )}
              </button>

              {/* Card body */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="font-lux text-lg font-semibold leading-snug text-cream transition-colors group-hover:text-gold">
                  {phase.label} · {phase.name}
                </h3>
                <p className="text-xs text-cream-dim">
                  Weeks {phase.weeks[0]}–{phase.weeks[phase.weeks.length - 1]}
                </p>
                <div className="mt-auto">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    <span>{allDone ? 'Completed' : doneCount > 0 ? 'In Progress' : 'Not Started'}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #7B1D30, #C9953A)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
