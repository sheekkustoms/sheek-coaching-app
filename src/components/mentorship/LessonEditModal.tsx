import { useState, useRef, type ChangeEvent } from 'react';
import { X, Check, Loader2, PlayCircle, FileText, Trash2, Plus, Upload, Film } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadWithTus } from '@/lib/tusUpload';
import type { MentorshipLesson } from '@/lib/types';
import { LessonEditor } from '@/components/classroom/LessonEditor';
import { fetchVimeoThumbnail } from '@/lib/vimeo';

const LESSON_TYPES = [
  { value: 'strategy', label: 'Strategy' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'video', label: 'Video Lesson' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'tool', label: 'Interactive Tool' },
];

function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const idMatch =
    trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/) || trimmed.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (idMatch) return `https://player.vimeo.com/video/${idMatch[1]}`;
  const srcMatch = trimmed.match(/src="https?:\/\/player\.vimeo\.com\/video\/(\d+)"/);
  if (srcMatch) return `https://player.vimeo.com/video/${srcMatch[1]}`;
  if (/^https?:\/\/player\.vimeo\.com\/video\/\d+/.test(trimmed)) return trimmed.split('?')[0];
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

interface LessonEditModalProps {
  weekNum: number;
  lesson: MentorshipLesson | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LessonEditModal({ weekNum, lesson, onClose, onSaved }: LessonEditModalProps) {
  const isEditing = !!lesson;
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [subtitle, setSubtitle] = useState(lesson?.subtitle ?? '');
  const [lessonType, setLessonType] = useState(lesson?.lesson_type ?? 'strategy');
  const [toolId, setToolId] = useState(lesson?.tool_id ?? '');
  const [figureOut, setFigureOut] = useState<string[]>(lesson?.figure_out ?? []);
  const [leaveWith, setLeaveWith] = useState<string[]>(lesson?.leave_with ?? []);
  const [comeReady, setComeReady] = useState<string[]>(lesson?.come_ready ?? []);
  const [bodyHtml, setBodyHtml] = useState(lesson?.body_html ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? '');
  const [pdfUrl, setPdfUrl] = useState(lesson?.pdf_url ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const updateArrayItem = (
    arr: string[],
    idx: number,
    val: string,
    setter: (v: string[]) => void,
  ) => {
    const next = [...arr];
    next[idx] = val;
    setter(next);
  };

  const addArrayItem = (arr: string[], setter: (v: string[]) => void) => {
    setter([...arr, '']);
  };

  const removeArrayItem = (
    arr: string[],
    idx: number,
    setter: (v: string[]) => void,
  ) => {
    setter(arr.filter((_, i) => i !== idx));
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
    setPdfUrl(pub.publicUrl);
    setUploading(false);
    e.target.value = '';
  };

  const onVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
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
      setVideoUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setUploading(false);
      setVideoProgress(null);
      setVideoStatus(null);
      e.target.value = '';
    }
  };

  const save = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);

    const trimmed = videoUrl.trim();
    const embed = trimmed ? toEmbedUrl(trimmed) : trimmed || null;
    if (trimmed && !embed && !trimmed.startsWith('https://')) {
      setError('Invalid video URL. Paste a Vimeo or YouTube link, or upload a video file.');
      setSaving(false);
      return;
    }

    const payload = {
      week_number: weekNum,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      lesson_type: lessonType,
      tool_id: lessonType === 'tool' ? toolId : null,
      figure_out: figureOut.filter((s) => s.trim()),
      leave_with: leaveWith.filter((s) => s.trim()),
      come_ready: comeReady.filter((s) => s.trim()),
      body_html: bodyHtml || null,
      video_url: embed,
      pdf_url: pdfUrl || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (isEditing && lesson) {
      result = await supabase
        .from('mentorship_lessons')
        .update(payload)
        .eq('id', lesson.id);
    } else {
      const maxPos = await supabase
        .from('mentorship_lessons')
        .select('position')
        .eq('week_number', weekNum)
        .order('position', { ascending: false })
        .limit(1);
      const nextPos = (maxPos.data?.[0]?.position ?? 0) + 1;
      result = await supabase
        .from('mentorship_lessons')
        .insert({ ...payload, position: nextPos });
    }

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (embed && embed.includes('vimeo.com')) {
      let lessonId = lesson?.id;
      if (!isEditing && result.data) {
        const rows = Array.isArray(result.data) ? result.data[0] : result.data;
        lessonId = (rows as { id: string })?.id ?? null;
      }
      if (lessonId) {
        fetchVimeoThumbnail(embed).then((o) => {
          if (o?.thumbnail_url) {
            supabase.from('mentorship_lessons').update({ image_url: o.thumbnail_url }).eq('id', lessonId!).then(() => onSaved());
          } else {
            onSaved();
          }
        });
      } else {
        onSaved();
      }
    } else {
      onSaved();
    }
  };

  const deleteLesson = async () => {
    if (!lesson) return;
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    setSaving(true);
    const { error: delErr } = await supabase
      .from('mentorship_lessons')
      .delete()
      .eq('id', lesson.id);
    setSaving(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    onSaved();
  };

  const inputClass =
    'w-full border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold';
  const labelClass =
    'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gold';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-8 w-full max-w-3xl border border-gold/20 bg-[#18080E] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfChange} />
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={onVideoChange} />

        <div className="mb-6 flex items-center justify-between border-b border-gold/10 pb-4">
          <h2 className="font-lux text-2xl font-bold text-cream">
            {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
          </h2>
          <button onClick={onClose} className="text-cream-dim hover:text-cream">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
              autoFocus
              className={inputClass}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className={labelClass}>Subtitle (optional)</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Short description"
              className={inputClass}
            />
          </div>

          {/* Lesson type */}
          <div>
            <label className={labelClass}>Lesson Type</label>
            <div className="flex flex-wrap gap-2">
              {LESSON_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setLessonType(t.value)}
                  className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    lessonType === t.value
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-gold/15 text-cream-dim hover:border-gold/30 hover:text-cream'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tool selector */}
          {lessonType === 'tool' && (
            <div>
              <label className={labelClass}>Interactive Tool</label>
              <select
                value={toolId}
                onChange={(e) => setToolId(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Select a tool…</option>
                <option value="goal-calculator">90-Day Goal & Unit Sales Calculator</option>
                <option value="profit-calculator">Sewing Profit Margin Calculator</option>
                <option value="avatar-generator">Customer Avatar Generator</option>
                <option value="description-writer">Product Description Copywriter</option>
                <option value="content-matrix">30-Day Content Matrix</option>
                <option value="bio-optimizer">Social Bio & Link-in-Bio Optimizer</option>
                <option value="dm-scripts">DM Script & Objection Handler</option>
                <option value="brand-voice">Brand Voice & Tone Selector</option>
                <option value="review-generator">Review & Testimonial Request Generator</option>
                <option value="launch-checklist">14-Day Launch Countdown Checklist</option>
                <option value="live-script">TikTok / IG Live Sales Script Generator</option>
                <option value="post-launch">Post-Launch Performance Dashboard</option>
              </select>
            </div>
          )}

          {/* Video URL */}
          <div>
            <label className={labelClass}>Video (Vimeo/YouTube link or upload from device)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <PlayCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/40" />
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://vimeo.com/123456789"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <button
                onClick={() => videoRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 border border-gold/20 bg-white/3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/10 disabled:opacity-50"
                title="Upload video from device"
              >
                {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                Upload
              </button>
              {videoUrl && (
                <button
                  onClick={() => setVideoUrl('')}
                  className="border border-gold/15 px-3 py-2.5 text-xs text-cream-dim hover:text-error-soft"
                  title="Clear video"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {videoProgress !== null && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-gold/60">
                  {videoStatus ?? 'Uploading...'} {videoProgress}%
                </p>
              </div>
            )}
            {videoUrl && videoUrl.startsWith('https://') && !videoUrl.includes('vimeo.com') && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && (
              <p className="mt-1.5 flex items-center gap-1 text-[10px] text-gold/50">
                <Film size={11} /> Direct video file — will play in the built-in player
              </p>
            )}
          </div>

          {/* PDF */}
          <div>
            <label className={labelClass}>PDF Attachment</label>
            <div className="flex items-center gap-2">
              {pdfUrl ? (
                <div className="flex flex-1 items-center justify-between border border-gold/20 bg-white/3 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-cream">
                    <FileText size={15} className="text-gold" /> PDF attached
                  </span>
                  <button
                    onClick={() => setPdfUrl('')}
                    className="text-cream-dim hover:text-error-soft"
                    title="Remove PDF"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => pdfRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-1 items-center justify-center gap-2 border border-gold/20 bg-white/3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
              )}
            </div>
          </div>

          {/* Figure Out */}
          <div>
            <label className={labelClass}>What We'll Figure Out</label>
            <div className="space-y-2">
              {figureOut.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(e) => updateArrayItem(figureOut, i, e.target.value, setFigureOut)}
                    placeholder={`Objective ${i + 1}`}
                    className={inputClass}
                  />
                  <button
                    onClick={() => removeArrayItem(figureOut, i, setFigureOut)}
                    className="shrink-0 text-cream-dim hover:text-error-soft"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addArrayItem(figureOut, setFigureOut)}
                className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-lt"
              >
                <Plus size={14} /> Add objective
              </button>
            </div>
          </div>

          {/* Leave With */}
          <div>
            <label className={labelClass}>You Will Leave With</label>
            <div className="space-y-2">
              {leaveWith.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(e) => updateArrayItem(leaveWith, i, e.target.value, setLeaveWith)}
                    placeholder={`Takeaway ${i + 1}`}
                    className={inputClass}
                  />
                  <button
                    onClick={() => removeArrayItem(leaveWith, i, setLeaveWith)}
                    className="shrink-0 text-cream-dim hover:text-error-soft"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addArrayItem(leaveWith, setLeaveWith)}
                className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-lt"
              >
                <Plus size={14} /> Add takeaway
              </button>
            </div>
          </div>

          {/* Come Ready */}
          <div>
            <label className={labelClass}>Come Ready to Share (optional)</label>
            <div className="space-y-2">
              {comeReady.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(e) => updateArrayItem(comeReady, i, e.target.value, setComeReady)}
                    placeholder={`Prep item ${i + 1}`}
                    className={inputClass}
                  />
                  <button
                    onClick={() => removeArrayItem(comeReady, i, setComeReady)}
                    className="shrink-0 text-cream-dim hover:text-error-soft"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addArrayItem(comeReady, setComeReady)}
                className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-lt"
              >
                <Plus size={14} /> Add prep item
              </button>
            </div>
          </div>

          {/* Body content */}
          <div>
            <label className={labelClass}>Teaching Content (rich text)</label>
            <LessonEditor value={bodyHtml} onChange={setBodyHtml} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex items-center justify-between border-t border-gold/10 pt-5">
          {isEditing ? (
            <button
              onClick={deleteLesson}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-error-soft/70 hover:text-error-soft disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete lesson
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="border border-gold/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-dim hover:text-cream"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-luxbg hover:bg-gold-lt disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
              {isEditing ? 'Save changes' : 'Create lesson'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
