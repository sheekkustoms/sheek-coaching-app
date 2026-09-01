import { useState, useRef, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  Check,
  PlayCircle,
  FileText,
  Download,
  X,
  Pencil,
  Loader2,
  Zap,
  Upload,
  Film,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadWithTus } from '@/lib/tusUpload';
import type { MentorshipLesson } from '@/lib/types';
import { LessonEditor } from '@/components/classroom/LessonEditor';
import { getToolComponent } from '@/components/mentorship/InteractiveTools';

function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const idMatch =
    trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/) ||
    trimmed.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (idMatch) return `https://player.vimeo.com/video/${idMatch[1]}`;
  const srcMatch = trimmed.match(/src="https?:\/\/player\.vimeo\.com\/video\/(\d+)"/);
  if (srcMatch) return `https://player.vimeo.com/video/${srcMatch[1]}`;
  if (/^https?:\/\/player\.vimeo\.com\/video\/\d+/.test(trimmed)) return trimmed.split('?')[0];
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

interface LessonViewProps {
  lesson: MentorshipLesson;
  weekNum: number;
  weekTitle: string;
  isAdmin?: boolean;
  onBack: () => void;
  onLessonUpdated?: (lesson: MentorshipLesson) => void;
}

export function LessonView({
  lesson,
  weekNum,
  weekTitle,
  isAdmin = false,
  onBack,
  onLessonUpdated,
}: LessonViewProps) {
  const [current, setCurrent] = useState<MentorshipLesson>(lesson);
  const [editingBody, setEditingBody] = useState(false);
  const [bodyDraft, setBodyDraft] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const embedUrl = current.video_url ? toEmbedUrl(current.video_url) : null;
  const isDirectVideo = current.video_url && !embedUrl;
  const figureOut = current.figure_out ?? [];
  const leaveWith = current.leave_with ?? [];
  const comeReady = current.come_ready ?? [];

  const refresh = (updated: MentorshipLesson) => {
    setCurrent(updated);
    onLessonUpdated?.(updated);
  };

  const saveBody = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('mentorship_lessons')
      .update({ body_html: bodyDraft || null, updated_at: new Date().toISOString() })
      .eq('id', current.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingBody(false);
    refresh({ ...current, body_html: bodyDraft || null });
  };

  const onVideoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setVideoProgress(0);
    setVideoStatus(null);
    const safeName = file.name.replace(/\s+/g, '_');
    const path = `lessons/${weekNum}/${Date.now()}-${safeName}`;
    try {
      const { publicUrl } = await uploadWithTus({
        bucketId: 'mentorship-files',
        path,
        file,
        contentType: file.type || 'video/mp4',
        compress: false,
        onProgress: (pct) => setVideoProgress(pct),
        onStatus: (msg) => setVideoStatus(msg),
      });
      const { error: updErr } = await supabase
        .from('mentorship_lessons')
        .update({ video_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', current.id);
      if (updErr) {
        setError(updErr.message);
      } else {
        refresh({ ...current, video_url: publicUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setUploading(false);
      setVideoProgress(null);
      setVideoStatus(null);
      e.target.value = '';
    }
  };

  const addVideo = async () => {
    if (!videoUrl.trim()) return;
    const embed = toEmbedUrl(videoUrl.trim());
    if (!embed) {
      setError('Please paste a valid Vimeo or YouTube link.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('mentorship_lessons')
      .update({ video_url: embed, updated_at: new Date().toISOString() })
      .eq('id', current.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setVideoUrl('');
    setShowVideoInput(false);
    refresh({ ...current, video_url: embed });
  };

  const removeVideo = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('mentorship_lessons')
      .update({ video_url: null, updated_at: new Date().toISOString() })
      .eq('id', current.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    refresh({ ...current, video_url: null });
  };

  const onPdfChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `lessons/${weekNum}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('mentorship-files')
      .upload(path, file, { contentType: file.type || 'application/pdf', upsert: false });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('mentorship-files').getPublicUrl(path);
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ pdf_url: pub.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', current.id);
    setUploading(false);
    e.target.value = '';
    if (updErr) {
      setError(updErr.message);
      return;
    }
    refresh({ ...current, pdf_url: pub.publicUrl });
  };

  const removePdf = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('mentorship_lessons')
      .update({ pdf_url: null, updated_at: new Date().toISOString() })
      .eq('id', current.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    refresh({ ...current, pdf_url: null });
  };

  return (
    <div className="animate-fade-in" style={{ background: '#18080E' }}>
      <div className="mx-auto max-w-3xl p-6 sm:p-10">
        <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfChange} />
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={onVideoUpload} />

        {error && (
          <div className="mb-5 flex items-center justify-between border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
              <X size={15} />
            </button>
          </div>
        )}

        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cream-dim transition-colors hover:text-gold"
        >
          <ArrowLeft size={14} /> Back to Week {weekNum} Lessons
        </button>

        {/* Lesson header */}
        <div className="mb-8 border-b border-gold/10 pb-6">
          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
            Week {weekNum} · {weekTitle}
          </div>
          <h2 className="font-lux text-3xl font-bold leading-[1.05] sm:text-4xl" style={{ color: '#FBF4EC' }}>
            {current.title}
          </h2>
          {current.subtitle && (
            <p className="mt-3 text-[14px] leading-[1.75] text-cream-dim">{current.subtitle}</p>
          )}
        </div>

        {/* Video */}
        {embedUrl && (
          <div className="mb-8 overflow-hidden rounded-xl border border-gold/15 bg-black">
            <div className="relative aspect-video w-full">
              <iframe
                src={embedUrl}
                title={current.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        )}
        {isDirectVideo && (
          <div className="mb-8 overflow-hidden rounded-xl border border-gold/15 bg-black">
            <div className="relative aspect-video w-full">
              <video
                src={current.video_url!}
                title={current.title}
                controls
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        )}
        {videoProgress !== null && (
          <div className="mb-6">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${videoProgress}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-gold/60">{videoStatus ?? 'Uploading...'} {videoProgress}%</p>
          </div>
        )}

        {/* Admin video controls */}
        {isAdmin && (
          <div className="mb-6">
            {showVideoInput ? (
              <div className="flex flex-col gap-2 border border-gold/15 bg-luxcard p-4 sm:flex-row sm:items-center">
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste Vimeo or YouTube URL"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addVideo();
                    if (e.key === 'Escape') setShowVideoInput(false);
                  }}
                  className="flex-1 border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addVideo}
                    disabled={saving}
                    className="bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-luxbg hover:bg-gold-lt disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />} Save
                  </button>
                  <button
                    onClick={() => setShowVideoInput(false)}
                    className="border border-gold/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-dim hover:text-cream"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {!current.video_url && (
                  <button
                    onClick={() => {
                      setShowVideoInput(true);
                      setVideoUrl('');
                    }}
                    className="flex items-center gap-1.5 border border-gold/20 bg-white/3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/10"
                  >
                    <PlayCircle size={13} /> Add Video Link
                  </button>
                )}
                {!current.video_url && (
                  <button
                    onClick={() => videoRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 border border-gold/20 bg-white/3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/10 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={13} /> : <Upload size={13} />} Upload Video
                  </button>
                )}
                {current.video_url && (
                  <button
                    onClick={removeVideo}
                    disabled={saving}
                    className="flex items-center gap-1.5 border border-error/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-error-soft/70 hover:text-error-soft hover:bg-error/10 disabled:opacity-50"
                  >
                    <X size={13} /> Remove Video
                  </button>
                )}
                <button
                  onClick={() => pdfRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 border border-gold/20 bg-white/3 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin" size={13} /> : <FileText size={13} />}
                  {current.pdf_url ? 'Replace PDF' : 'Add PDF'}
                </button>
                {current.pdf_url && (
                  <button
                    onClick={removePdf}
                    disabled={saving}
                    className="flex items-center gap-1.5 border border-error/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-error-soft/70 hover:text-error-soft hover:bg-error/10 disabled:opacity-50"
                  >
                    <X size={13} /> Remove PDF
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* What We'll Figure Out */}
        {figureOut.length > 0 && (
          <div className="mb-6 border border-gold/9 bg-luxcard p-6 sm:p-7">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              What We'll Figure Out
            </div>
            <ul className="flex flex-col gap-3">
              {figureOut.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.6] text-cream">
                  <span className="mt-0.5 font-bold text-gold">&rarr;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* You Will Leave With */}
        {leaveWith.length > 0 && (
          <div className="mb-6 border border-gold/9 bg-luxcard p-6 sm:p-7">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              You Will Leave With
            </div>
            <ul className="flex flex-col gap-3">
              {leaveWith.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.6] text-cream">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green/20 text-green">
                    <Check size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Come Ready to Share */}
        {comeReady.length > 0 && (
          <div className="mb-6 border border-gold/9 bg-luxcard p-6 sm:p-7">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              Come Ready to Share
            </div>
            <ul className="flex flex-col gap-3">
              {comeReady.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.6] text-cream-dim">
                  <span className="mt-0.5 font-bold text-gold">&#8599;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rich body content */}
        <div className="mb-6">
          {editingBody ? (
            <div className="flex flex-col gap-3">
              <LessonEditor value={bodyDraft} onChange={setBodyDraft} onSave={saveBody} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-cream-dim">Ctrl+Enter to save</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingBody(false)}
                    className="border border-gold/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-cream-dim hover:text-cream"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveBody}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-wider text-luxbg hover:bg-gold-lt disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />} Save content
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="group">
              {current.body_html ? (
                <div
                  className="mentorship-content-body border border-gold/9 bg-luxcard p-6 sm:p-7"
                  dangerouslySetInnerHTML={{ __html: current.body_html }}
                />
              ) : (
                <div className="border border-gold/9 bg-luxcard p-7 sm:p-8">
                  <p className="text-[14px] leading-[1.85] text-cream-dim italic">
                    {isAdmin
                      ? 'Click "Edit Content" below to add teaching content for this lesson.'
                      : 'Content for this lesson will be added soon.'}
                  </p>
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setBodyDraft(current.body_html ?? '');
                    setEditingBody(true);
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs text-cream-dim opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Pencil size={12} /> {current.body_html ? 'Edit content' : 'Add content'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Interactive tool */}
        {current.lesson_type === 'tool' && (() => {
          const ToolComponent = getToolComponent(current.tool_id);
          return ToolComponent ? (
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Zap size={14} className="text-gold" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Interactive Tool</span>
              </div>
              <ToolComponent />
            </div>
          ) : (
            <div className="mb-8 border border-gold/15 bg-luxcard p-6 text-sm text-cream-dim italic">
              {isAdmin ? 'Select an interactive tool in the lesson editor to display it here.' : 'Interactive tool coming soon.'}
            </div>
          );
        })()}

        {/* PDF attachment */}
        {current.pdf_url && (
          <div className="mb-8 inline-flex items-center gap-3 rounded-xl border border-gold/15 bg-luxcard px-4 py-3">
            <FileText size={16} className="text-gold" />
            <a
              href={current.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-cream hover:text-gold"
            >
              <Download size={14} /> Download PDF Guide
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
