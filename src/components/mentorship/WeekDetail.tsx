import { useRef, useState, type ChangeEvent } from 'react';
import {
  Check,
  Loader2,
  Sparkles,
  Store,
  Rocket,
  PlayCircle,
  Paperclip,
  X,
  Download,
  Pencil,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MentorshipWeekContent, MentorshipIntake, BusinessStage } from '@/lib/types';
import { LessonEditor } from '@/components/classroom/LessonEditor';
import { fetchVimeoThumbnail } from '@/lib/vimeo';

function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const idMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/) || trimmed.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (idMatch) return `https://player.vimeo.com/video/${idMatch[1]}`;
  const srcMatch = trimmed.match(/src="https?:\/\/player\.vimeo\.com\/video\/(\d+)"/);
  if (srcMatch) return `https://player.vimeo.com/video/${srcMatch[1]}`;
  if (/^https?:\/\/player\.vimeo\.com\/video\/\d+/.test(trimmed)) return trimmed.split('?')[0];
  return null;
}

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1 · Foundations, Pricing & Buyer Psychology · Wks 1–3',
  2: 'Phase 2 · Store Setup, Content Engines & Platforms · Wks 4–6',
  3: 'Phase 3 · DM Sales, Brand Voice & Authority · Wks 7–9',
  4: 'Phase 4 · Launch Execution, Holiday Drops & Scale · Wks 10–12',
};

const SESSION_TYPES: Record<number, string> = {
  1: 'Private 1:1 Call',
  2: 'Group Session',
  3: 'Group Session',
  4: 'Group Session',
  5: 'Group + 1:1',
  6: 'Group Session',
  7: 'Group Session',
  8: 'Group Session',
  9: 'Group + 1:1',
  10: 'Group Session',
  11: 'Launch Week',
  12: 'Group + 1:1',
};

interface WeekDetailProps {
  content: MentorshipWeekContent;
  isAdmin: boolean;
  intake: MentorshipIntake | null;
  checklists: Record<number, Record<string, boolean>>;
  notes: Record<number, string>;
  saving: boolean;
  submitFlash: number | null;
  completedSet: Set<number>;
  onToggleCheck: (weekNum: number, idx: number) => void;
  onSetNotes: (weekNum: number, text: string) => void;
  onSubmitDeliverable: (weekNum: number) => void;
  onCompleteWeek: (weekNum: number) => void;
  onSelectStage: (stage: BusinessStage) => void;
  stageSaving: boolean;
  onContentUpdated: () => void;
}

export function WeekDetail({
  content, isAdmin, intake, checklists, notes, saving, submitFlash, completedSet,
  onToggleCheck, onSetNotes, onSubmitDeliverable, onCompleteWeek, onSelectStage, stageSaving,
  onContentUpdated,
}: WeekDetailProps) {
  const weekNum = content.week_number;
  const phase = weekNum <= 3 ? 1 : weekNum <= 6 ? 2 : weekNum <= 9 ? 3 : 4;
  const sessionType = SESSION_TYPES[weekNum] ?? 'Group Session';
  const eyebrow = `Week ${weekNum} · ${sessionType} · Phase ${phase}: ${phase === 1 ? 'Diagnose' : phase === 2 ? 'Rebuild' : phase === 3 ? 'Position' : 'Launch'}`;

  const stage: BusinessStage = intake?.business_stage ?? 'established';
  const isJustStarting = stage === 'just_starting';

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [titleEmDraft, setTitleEmDraft] = useState('');
  const [introDraft, setIntroDraft] = useState('');
  const [editingIntro, setEditingIntro] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [bodyDraft, setBodyDraft] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const embedUrl = content.video_url ? toEmbedUrl(content.video_url) : null;

  const saveTitle = async () => {
    if (!titleDraft.trim() && !titleEmDraft.trim()) {
      setEditingTitle(false);
      return;
    }
    const { error } = await supabase
      .from('mentorship_week_content')
      .update({ title: titleDraft.trim(), title_em: titleEmDraft.trim(), updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    setEditingTitle(false);
    if (error) { setError(error.message); return; }
    onContentUpdated();
  };

  const saveIntro = async () => {
    if (introDraft === content.intro) {
      setEditingIntro(false);
      return;
    }
    const { error } = await supabase
      .from('mentorship_week_content')
      .update({ intro: introDraft, updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    setEditingIntro(false);
    if (error) { setError(error.message); return; }
    onContentUpdated();
  };

  const saveBody = async () => {
    const { error } = await supabase
      .from('mentorship_week_content')
      .update({ body_html: bodyDraft, updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    setEditingBody(false);
    if (error) { setError(error.message); return; }
    onContentUpdated();
  };

  const addVideo = async () => {
    if (!videoUrl.trim()) return;
    const embed = toEmbedUrl(videoUrl.trim());
    if (!embed) {
      setError('Please paste a valid Vimeo link or embed code.');
      return;
    }
    const { error } = await supabase
      .from('mentorship_week_content')
      .update({ video_url: embed, updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    if (error) { setError(error.message); return; }
    setVideoUrl('');
    setShowVideoInput(false);
    onContentUpdated();
    fetchVimeoThumbnail(embed).then((o) => {
      if (o?.thumbnail_url) {
        supabase.from('mentorship_week_content').update({ image_url: o.thumbnail_url, updated_at: new Date().toISOString() }).eq('week_number', weekNum).then(() => onContentUpdated());
      }
    });
  };

  const removeVideo = async () => {
    const { error } = await supabase
      .from('mentorship_week_content')
      .update({ video_url: null, updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    if (error) { setError(error.message); return; }
    onContentUpdated();
  };

  const onPdfChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `week-${weekNum}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('mentorship-files').upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: false,
    });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('mentorship-files').getPublicUrl(path);
    const { error: updErr } = await supabase
      .from('mentorship_week_content')
      .update({ pdf_url: pub.publicUrl, updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    setUploading(false);
    e.target.value = '';
    if (updErr) { setError(updErr.message); return; }
    onContentUpdated();
  };

  const removePdf = async () => {
    const { error } = await supabase
      .from('mentorship_week_content')
      .update({ pdf_url: null, updated_at: new Date().toISOString() })
      .eq('week_number', weekNum);
    if (error) { setError(error.message); return; }
    onContentUpdated();
  };

  return (
    <div className="animate-fade-in">
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfChange} />

      {error && (
        <div className="mb-5 flex items-center justify-between border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Week header */}
      <div className="mb-8 border-b border-gold/10 pb-6">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">{eyebrow}</div>
        {editingTitle ? (
          <div className="flex flex-col gap-2">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Title"
              autoFocus
              className="border border-gold/30 bg-white/3 px-4 py-2.5 font-lux text-4xl font-bold text-cream outline-none focus:border-gold"
              style={{ color: '#FBF4EC' }}
            />
            <input
              value={titleEmDraft}
              onChange={(e) => setTitleEmDraft(e.target.value)}
              placeholder="Emphasized title"
              className="border border-gold/30 bg-white/3 px-4 py-2.5 font-lux text-4xl font-bold italic text-gold outline-none focus:border-gold"
            />
            <div className="flex gap-2">
              <button onClick={saveTitle} className="bg-gold px-5 py-2 text-xs font-bold uppercase tracking-wider text-luxbg hover:bg-gold-lt">
                <Check size={13} /> Save Title
              </button>
              <button onClick={() => setEditingTitle(false)} className="border border-gold/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-cream-dim hover:text-cream">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="font-lux text-4xl font-bold leading-[0.95] sm:text-5xl" style={{ color: '#FBF4EC' }}>
              {content.title}<br /><em className="italic text-gold">{content.title_em}</em>
            </h2>
            {isAdmin && (
              <button
                onClick={() => { setTitleDraft(content.title); setTitleEmDraft(content.title_em); setEditingTitle(true); }}
                className="group flex items-center gap-1 text-left"
              >
                <Pencil size={15} className="text-cream-dim opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
        )}

        {editingIntro ? (
          <div className="mt-3.5 flex flex-col gap-2">
            <textarea
              value={introDraft}
              onChange={(e) => setIntroDraft(e.target.value)}
              className="w-full resize-vertical border border-gold/30 bg-white/3 p-3 text-[15px] leading-[1.85] text-cream-dim outline-none focus:border-gold"
              style={{ minHeight: '80px' }}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={saveIntro} className="bg-gold px-5 py-2 text-xs font-bold uppercase tracking-wider text-luxbg hover:bg-gold-lt">
                <Check size={13} /> Save
              </button>
              <button onClick={() => setEditingIntro(false)} className="border border-gold/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-cream-dim hover:text-cream">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group mt-3.5">
            <p className="max-w-2xl text-[15px] leading-[1.85] text-cream-dim">{content.intro}</p>
            {isAdmin && (
              <button
                onClick={() => { setIntroDraft(content.intro); setEditingIntro(true); }}
                className="mt-1 flex items-center gap-1.5 text-xs text-cream-dim opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Pencil size={12} /> Edit intro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stage badge */}
      {weekNum !== 1 && (
        <div className="mb-6 flex items-center gap-3 border border-gold/15 bg-gold/6 px-4 py-3">
          {isJustStarting ? <Rocket size={16} className="text-gold" /> : <Store size={16} className="text-gold" />}
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
            Your Path: {isJustStarting ? 'Just Starting Out' : 'Established Business'}
          </div>
        </div>
      )}

      {/* Game plan */}
      {intake?.game_plan && weekNum === 1 && !isJustStarting && (
        <div className="mb-7 border border-gold/15 bg-luxcard p-6">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Your Personalized Game Plan from Sheek</div>
          <div className="whitespace-pre-line border-l-2 border-gold bg-gold/6 p-4 text-[13px] leading-[1.85] text-cream">
            {intake.game_plan}
          </div>
        </div>
      )}

      {/* Stage selector — Week 1 only */}
      {weekNum === 1 && (
        <div className="mb-7 border border-gold/20 bg-luxcard p-7 sm:p-8" style={{ boxShadow: '0 0 30px rgba(201,149,58,0.08)' }}>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
            <Sparkles size={14} /> Before We Begin — Where Are You Right Now?
          </div>
          <p className="mb-5 max-w-2xl text-[13px] leading-[1.7] text-cream-dim">
            This first session is different depending on where you are in your journey. Pick the option that fits you — your mentor will tailor everything to your situation.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => onSelectStage('just_starting')}
              disabled={stageSaving}
              className={`flex flex-col items-start gap-2 border-2 p-5 text-left transition-all disabled:opacity-50 ${
                isJustStarting ? 'border-gold bg-gold/10' : 'border-gold/15 bg-white/3 hover:border-gold/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Rocket size={18} className={isJustStarting ? 'text-gold' : 'text-muted'} />
                <span className={`text-sm font-bold ${isJustStarting ? 'text-gold' : 'text-cream'}`}>Just Starting Out</span>
              </div>
              <p className="text-[12px] leading-[1.6] text-cream-dim">
                I don't have a store yet. I'm brand new to this. I don't have sales numbers or an Etsy shop — I'm building from scratch.
              </p>
            </button>
            <button
              onClick={() => onSelectStage('established')}
              disabled={stageSaving}
              className={`flex flex-col items-start gap-2 border-2 p-5 text-left transition-all disabled:opacity-50 ${
                !isJustStarting ? 'border-gold bg-gold/10' : 'border-gold/15 bg-white/3 hover:border-gold/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store size={18} className={!isJustStarting ? 'text-gold' : 'text-muted'} />
                <span className={`text-sm font-bold ${!isJustStarting ? 'text-gold' : 'text-cream'}`}>Established Business</span>
              </div>
              <p className="text-[12px] leading-[1.6] text-cream-dim">
                I already have a store (Etsy, TikTok Shop, website). I have sales data, products, and pricing — I'm here to optimize and grow.
              </p>
            </button>
          </div>
          {stageSaving && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
              <Loader2 size={12} className="animate-spin" /> Saving your selection...
            </div>
          )}
          {intake?.game_plan && (
            <div className="mt-5 border-t border-gold/12 pt-5">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Your Personalized Game Plan from Sheek</div>
              <div className="whitespace-pre-line border-l-2 border-gold bg-gold/6 p-4 text-[13px] leading-[1.85] text-cream">
                {intake.game_plan}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rich body content */}
      <div className="mb-7">
        {editingBody ? (
          <div className="flex flex-col gap-2">
            <LessonEditor
              value={bodyDraft}
              onChange={setBodyDraft}
              onSave={saveBody}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-cream-dim">Ctrl+Enter to save · Esc to cancel</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingBody(false)} className="border border-gold/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-cream-dim hover:text-cream">
                  Cancel
                </button>
                <button onClick={saveBody} className="bg-gold px-5 py-2 text-xs font-bold uppercase tracking-wider text-luxbg hover:bg-gold-lt">
                  <Check size={13} /> Save content
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="group">
            {content.body_html ? (
              <div
                className="mentorship-content-body"
                dangerouslySetInnerHTML={{ __html: content.body_html }}
              />
            ) : (
              <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
                <p className="text-[14px] leading-[1.85] text-cream-dim italic">
                  {isAdmin ? 'Click "Edit Content" below to add written content for this week.' : 'Content for this week will be added soon.'}
                </p>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => { setBodyDraft(content.body_html ?? ''); setEditingBody(true); }}
                className="mt-3 flex items-center gap-1.5 text-xs text-cream-dim opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Pencil size={12} /> {content.body_html ? 'Edit content' : 'Add content'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Admin toolbar */}
      {isAdmin && !editingBody && (
        <div className="mb-7 flex flex-wrap items-center gap-2 border border-gold/15 bg-luxcard px-4 py-3">
          <span className="mr-auto text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Week Tools</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 border border-gold/20 bg-white/3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="animate-spin" size={13} /> : <Paperclip size={13} />} PDF
          </button>
          <button
            onClick={() => { setShowVideoInput(!showVideoInput); setVideoUrl(content.video_url ?? ''); }}
            className="flex items-center gap-1.5 border border-gold/20 bg-white/3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold/10"
          >
            <PlayCircle size={13} /> Vimeo
          </button>
        </div>
      )}

      {/* Video URL input */}
      {isAdmin && showVideoInput && (
        <div className="mb-5 flex flex-col gap-2 border border-gold/15 bg-luxcard p-4 sm:flex-row sm:items-center">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste Vimeo URL (e.g. https://vimeo.com/123456789)"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') addVideo();
              if (e.key === 'Escape') setShowVideoInput(false);
            }}
            className="flex-1 border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
          />
          <div className="flex gap-2">
            <button onClick={addVideo} className="bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-luxbg hover:bg-gold-lt">
              <Check size={13} /> Save
            </button>
            <button onClick={() => setShowVideoInput(false)} className="border border-gold/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-dim hover:text-cream">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Attached media: video + PDF */}
      {(content.video_url || content.pdf_url) && (
        <div className="mb-7 flex flex-col gap-5 border-t border-gold/10 pt-6">
          {content.video_url && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Video</p>
                {isAdmin && (
                  <button onClick={removeVideo} className="text-cream-dim hover:text-error-soft" title="Remove video">
                    <X size={15} />
                  </button>
                )}
              </div>
              {embedUrl ? (
                <div className="overflow-hidden rounded-xl border border-gold/15 bg-black">
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={embedUrl}
                      title={`Week ${weekNum} video`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-gold/15 bg-luxcard px-5 py-4 text-sm text-cream-dim">
                  <PlayCircle size={18} className="text-gold/50" />
                  Video link not available yet. Check back soon.
                </div>
              )}
            </div>
          )}

          {content.pdf_url && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Attached PDF</p>
                {isAdmin && (
                  <button onClick={removePdf} className="text-cream-dim hover:text-error-soft" title="Remove PDF">
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="inline-flex items-center gap-3 rounded-xl border border-gold/15 bg-luxcard px-4 py-3">
                <FileText size={16} className="text-gold" />
                <a
                  href={content.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-cream hover:text-gold"
                >
                  <Download size={14} /> Download PDF Guide
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deliverable box */}
      <div className="border border-burg/40 bg-burg/12 p-6 sm:p-7">
        <div className="mb-3.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: '#C97A8A' }}>
          {content.deliverable_label}
        </div>
        <ul className="mb-5 flex flex-col gap-2.5">
          {content.deliverable_items.map((item, i) => {
            const checked = checklists[weekNum]?.[`item_${i}`] ?? false;
            return (
              <li key={i} className="flex items-start gap-3 text-[13px] leading-[1.5] text-cream">
                <button
                  onClick={() => onToggleCheck(weekNum, i)}
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border text-[11px] transition-all ${
                    checked ? 'border-green bg-green text-ivory' : 'border-gold/30 bg-transparent'
                  }`}
                >
                  {checked && <Check size={11} />}
                </button>
                {item}
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-cream-dim">{content.deliverable_submit_label}</span>
          <textarea
            value={notes[weekNum] ?? ''}
            onChange={(e) => onSetNotes(weekNum, e.target.value)}
            placeholder={submitFlash === weekNum ? '✓ Submitted! Sheek will review before your next session.' : content.deliverable_placeholder}
            className="w-full resize-vertical border border-gold/20 bg-white/3 p-3 text-[13px] text-cream outline-none transition-colors placeholder:text-muted focus:border-gold"
            style={{ minHeight: '80px', fontFamily: "'DM Sans', sans-serif" }}
          />
          <button
            onClick={() => onSubmitDeliverable(weekNum)}
            disabled={saving}
            className="mt-2.5 bg-gold px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-luxbg transition-colors hover:bg-gold-lt disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : content.deliverable_btn_text}
          </button>
        </div>
      </div>

      {/* Complete week button */}
      <button
        onClick={() => onCompleteWeek(weekNum)}
        disabled={saving || completedSet.has(weekNum)}
        className={`mt-6 flex w-full items-center justify-center gap-2.5 py-3.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
          completedSet.has(weekNum)
            ? 'border border-green bg-green/20 text-green'
            : 'bg-green text-ivory hover:bg-green-lt'
        }`}
      >
        {completedSet.has(weekNum) ? (
          <>✓ Week {weekNum} Complete</>
        ) : (
          <>✓ Mark Week {weekNum} Complete — Unlock Week {weekNum + 1}</>
        )}
      </button>
    </div>
  );
}
