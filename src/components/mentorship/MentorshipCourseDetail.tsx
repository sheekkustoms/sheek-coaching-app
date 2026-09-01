import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  FileText,
  Plus,
  Paperclip,
  PlayCircle,
  X,
  Check,
  Download,
  Pencil,
  Lock,
  Image as ImageIcon,
  ChevronDown,
  PanelLeft,
  Trash2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MentorshipLesson, MentorshipWeekContent } from '@/lib/types';
import { WEEKS } from '@/components/mentorship/WeekDetailLegacy';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LessonEditor } from '@/components/classroom/LessonEditor';
import { getToolComponent } from '@/components/mentorship/InteractiveTools';
import { fetchVimeoThumbnail } from '@/lib/vimeo';

interface Phase {
  num: number;
  label: string;
  name: string;
  weeks: number[];
}

interface MentorshipCourseDetailProps {
  weekContent: MentorshipWeekContent[];
  phase: Phase;
  isAdmin: boolean;
  unlockedThrough: number;
  onBack: () => void;
  onPickThumb: (weekNum: number) => void;
  removeThumb: (weekNum: number) => void;
  uploadingThumb: boolean;
  editingThumb: number | null;
}

type InlineAdd = null | 'lesson' | 'video';

function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const decodeEntities = (s: string) =>
    s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  const decoded = decodeEntities(trimmed);

  // iframe embed code: extract full src URL with query params
  const srcMatch = decoded.match(/src="(https?:\/\/player\.vimeo\.com\/video\/\d+[^"]*)"/);
  if (srcMatch) return srcMatch[1];

  // Direct player URL (may include query params)
  const playerUrlMatch = decoded.match(/^(https?:\/\/player\.vimeo\.com\/video\/\d+[^"\s]*)/);
  if (playerUrlMatch) return playerUrlMatch[1];

  // Plain Vimeo link or share URL — extract ID, keep no params
  const idMatch = decoded.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (idMatch) return `https://player.vimeo.com/video/${idMatch[1]}`;

  return null;
}

interface Week {
  num: number;
  title: string;
  lessons: MentorshipLesson[];
}

export function MentorshipCourseDetail({
  weekContent,
  phase,
  isAdmin,
  unlockedThrough,
  onBack,
  onPickThumb,
  removeThumb,
  uploadingThumb,
  editingThumb,
}: MentorshipCourseDetailProps) {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<MentorshipLesson | null>(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [inlineAdd, setInlineAdd] = useState<InlineAdd>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonWeek, setNewLessonWeek] = useState<number>(phase.weeks[0]);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [bodyDraft, setBodyDraft] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const getWeekTitle = (num: number) => {
    const wc = weekContent.find((w) => w.week_number === num);
    if (wc?.title) return wc.title;
    return WEEKS.find((w) => w.num === num)?.name ?? `Week ${num}`;
  };

  const buildWeeks = (lessons: MentorshipLesson[]): Week[] =>
    phase.weeks.map((num) => ({
      num,
      title: getWeekTitle(num),
      lessons: lessons
        .filter((l) => l.week_number === num)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: qErr } = await supabase
        .from('mentorship_lessons')
        .select('*')
        .in('week_number', phase.weeks)
        .order('week_number', { ascending: true })
        .order('position', { ascending: true });
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setLoading(false);
        return;
      }
      const lessons = (data ?? []) as MentorshipLesson[];
      const built = buildWeeks(lessons);
      setWeeks(built);
      // Auto-expand the first week, collapse the rest
      setCollapsedWeeks(new Set(phase.weeks.filter((n) => n !== phase.weeks[0])));
      // Auto-select first lesson in the first expanded week
      const firstLesson = built.find((w) => w.num === phase.weeks[0])?.lessons[0];
      setActiveLesson(firstLesson ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.num]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const refreshLessons = async (keepId?: string) => {
    const { data } = await supabase
      .from('mentorship_lessons')
      .select('*')
      .in('week_number', phase.weeks)
      .order('week_number', { ascending: true })
      .order('position', { ascending: true });
    const lessons = (data ?? []) as MentorshipLesson[];
    setWeeks(buildWeeks(lessons));
    if (keepId) {
      const updated = lessons.find((l) => l.id === keepId);
      if (updated) setActiveLesson(updated);
    }
  };

  const addLesson = async () => {
    if (!newLessonTitle.trim()) return;
    setSaving(true);
    setError(null);
    const maxPos = weeks.find((w) => w.num === newLessonWeek)?.lessons.length ?? 0;
    const { data, error: insErr } = await supabase
      .from('mentorship_lessons')
      .insert({
        week_number: newLessonWeek,
        title: newLessonTitle.trim(),
        position: maxPos + 1,
        lesson_type: 'strategy',
        figure_out: [],
        leave_with: [],
        come_ready: [],
        published: false,
      })
      .select()
      .maybeSingle();
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setNewLessonTitle('');
    setInlineAdd(null);
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      next.delete(newLessonWeek);
      return next;
    });
    await refreshLessons();
    if (data) setActiveLesson(data as MentorshipLesson);
  };

  const deleteLesson = async () => {
    if (!activeLesson) return;
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    setSaving(true);
    const { error: delErr } = await supabase.from('mentorship_lessons').delete().eq('id', activeLesson.id);
    setSaving(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setActiveLesson(null);
    await refreshLessons();
  };

  const saveTitle = async () => {
    if (!activeLesson || !titleDraft.trim()) {
      setEditingTitle(false);
      return;
    }
    if (titleDraft.trim() === activeLesson.title) {
      setEditingTitle(false);
      return;
    }
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ title: titleDraft.trim(), updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    setEditingTitle(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, title: titleDraft.trim() });
    await refreshLessons(activeLesson.id);
  };

  const saveBody = async () => {
    if (!activeLesson) return;
    if (bodyDraft === (activeLesson.body_html ?? '')) {
      setEditingBody(false);
      return;
    }
    setSaving(true);
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ body_html: bodyDraft || null, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    setSaving(false);
    setEditingBody(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, body_html: bodyDraft || null });
    await refreshLessons(activeLesson.id);
  };

  const addVideo = async () => {
    if (!newVideoUrl.trim() || !activeLesson) return;
    const embed = toEmbedUrl(newVideoUrl.trim());
    if (!embed) {
      setError('Please paste a valid Vimeo link or embed code.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ video_url: embed, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    setSaving(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, video_url: embed });
    setNewVideoUrl('');
    setInlineAdd(null);
    await refreshLessons(activeLesson.id);
    fetchVimeoThumbnail(embed).then((o) => {
      if (o?.thumbnail_url) {
        supabase.from('mentorship_lessons').update({ image_url: o.thumbnail_url }).eq('id', activeLesson.id).then(() => refreshLessons(activeLesson.id));
      }
    });
  };

  const removeVideo = async () => {
    if (!activeLesson?.video_url) return;
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ video_url: null, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, video_url: null });
    await refreshLessons(activeLesson.id);
  };

  const onPdfChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `lessons/${activeLesson.week_number}/${activeLesson.id}-${Date.now()}.${ext}`;
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
      .eq('id', activeLesson.id);
    setUploading(false);
    e.target.value = '';
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, pdf_url: pub.publicUrl });
    await refreshLessons(activeLesson.id);
  };

  const removePdf = async () => {
    if (!activeLesson?.pdf_url) return;
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ pdf_url: null, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, pdf_url: null });
    await refreshLessons(activeLesson.id);
  };

  const onImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `lessons/${activeLesson.week_number}/${activeLesson.id}-img-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('mentorship-files')
      .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('mentorship-files').getPublicUrl(path);
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ image_url: pub.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    setUploading(false);
    e.target.value = '';
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, image_url: pub.publicUrl });
    await refreshLessons(activeLesson.id);
  };

  const removeImage = async () => {
    if (!activeLesson?.image_url) return;
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ image_url: null, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, image_url: null });
    await refreshLessons(activeLesson.id);
  };

  const publishLesson = async () => {
    if (!activeLesson) return;
    setSaving(true);
    setError(null);
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ published: true, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    setSaving(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, published: true });
    await refreshLessons(activeLesson.id);
  };

  const unpublishLesson = async () => {
    if (!activeLesson) return;
    setSaving(true);
    setError(null);
    const { error: updErr } = await supabase
      .from('mentorship_lessons')
      .update({ published: false, updated_at: new Date().toISOString() })
      .eq('id', activeLesson.id);
    setSaving(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setActiveLesson({ ...activeLesson, published: false });
    await refreshLessons(activeLesson.id);
  };

  const toggleWeek = (num: number) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-cream-dim">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  const embedUrl = activeLesson?.video_url ? toEmbedUrl(activeLesson.video_url) : null;
  const totalLessons = weeks.reduce((s, w) => s + w.lessons.length, 0);

  return (
    <div
      className="animate-fade-in flex h-[calc(100vh-130px)] flex-col overflow-hidden lg:h-[calc(100vh-100px)]"
      style={{ background: '#18080E' }}
    >
      <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfChange} />
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />

      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-sm lg:px-6"
        style={{ borderColor: 'rgba(201,149,58,0.15)', background: 'rgba(15,5,9,0.9)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center border text-cream-dim transition-colors hover:text-gold"
            style={{ borderColor: 'rgba(201,149,58,0.2)', background: 'rgba(255,255,255,0.03)' }}
            title="Back to Phase Grid"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-lux text-lg font-bold text-cream">
              {phase.label} · {phase.name}
            </h1>
            <p className="text-xs text-cream-dim">
              Weeks {phase.weeks[0]}–{phase.weeks[3]} · {totalLessons} lessons
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              setInlineAdd(inlineAdd === 'lesson' ? null : 'lesson');
              setNewLessonTitle('');
              setNewLessonWeek(activeLesson?.week_number ?? phase.weeks[0]);
            }}
          >
            <Plus size={14} /> Lesson
          </Button>
        )}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center border text-cream-dim transition-colors hover:text-cream lg:hidden"
          style={{ borderColor: 'rgba(201,149,58,0.2)', background: 'rgba(255,255,255,0.03)' }}
          title="Toggle lesson list"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between border-b border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error-soft lg:px-6">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error-soft/70 hover:text-error-soft">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Inline add lesson */}
      {inlineAdd === 'lesson' && (
        <div
          className="flex flex-col gap-2 border-b px-4 py-3 lg:px-6 sm:flex-row sm:items-center"
          style={{ borderColor: 'rgba(201,149,58,0.15)', background: 'rgba(15,5,9,0.8)' }}
        >
          <input
            name="new_lesson"
            placeholder="Lesson title (e.g. The Pricing Formula)"
            autoFocus
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addLesson();
              if (e.key === 'Escape') setInlineAdd(null);
            }}
            className="flex-1 border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold placeholder:text-cream-dim/50"
          />
          <select
            value={newLessonWeek}
            onChange={(e) => setNewLessonWeek(Number(e.target.value))}
            className="border border-gold/20 bg-[#0F0509] px-4 py-3 text-sm text-cream outline-none focus:border-gold"
          >
            {weeks.map((w) => (
              <option key={w.num} value={w.num} className="bg-[#0F0509]">
                Week {w.num}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={() => setInlineAdd(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={addLesson} disabled={saving || !newLessonTitle.trim()}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Add Lesson
          </Button>
        </div>
      )}

      {/* Inline add video */}
      {inlineAdd === 'video' && activeLesson && (
        <div
          className="flex flex-col gap-2 border-b px-4 py-3 lg:px-6 sm:flex-row sm:items-center"
          style={{ borderColor: 'rgba(201,149,58,0.15)', background: 'rgba(15,5,9,0.8)' }}
        >
          <input
            name="new_video"
            placeholder="Paste Vimeo URL (e.g. https://vimeo.com/123456789)"
            autoFocus
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addVideo();
              if (e.key === 'Escape') setInlineAdd(null);
            }}
            className="flex-1 border border-gold/20 bg-white/3 px-4 py-2.5 text-sm text-cream outline-none focus:border-gold placeholder:text-cream-dim/50"
          />
          <Button variant="ghost" size="sm" onClick={() => setInlineAdd(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={addVideo} disabled={saving || !newVideoUrl.trim()}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save Video
          </Button>
        </div>
      )}

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* LEFT SIDEBAR — always visible on desktop */}
        <aside
          className={`absolute inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ borderColor: 'rgba(201,149,58,0.15)', background: '#0F0509' }}
        >
          <div className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex flex-col gap-4">
              {weeks.map((week) => {
                const isCollapsed = collapsedWeeks.has(week.num);
                const isLocked = !isAdmin && week.num > unlockedThrough;
                return (
                  <div key={week.num}>
                    <button
                      onClick={() => !isLocked && toggleWeek(week.num)}
                      disabled={isLocked}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                        isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate font-lux text-xs font-bold uppercase tracking-widest text-gold">
                        Week {week.num} · {week.title}
                      </span>
                      {isLocked ? (
                        <Lock size={13} className="shrink-0 text-cream-dim" />
                      ) : (
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-cream-dim transition-transform duration-200 ${
                            isCollapsed ? '' : 'rotate-180'
                          }`}
                        />
                      )}
                    </button>
                    {!isCollapsed && !isLocked && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        {week.lessons.length === 0 && (
                          <p className="px-3 py-1.5 text-xs text-cream-dim/70">No lessons</p>
                        )}
                        {week.lessons.map((lesson) => {
                          const isActive = activeLesson?.id === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setActiveLesson(lesson);
                                setEditingBody(false);
                                setEditingTitle(false);
                                setInlineAdd(null);
                                setSidebarOpen(false);
                              }}
                              className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
                                isActive
                                  ? 'bg-gold/10 text-cream ring-1 ring-gold/30'
                                  : 'text-cream-dim hover:bg-white/5 hover:text-cream'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <FileText
                                  size={14}
                                  className={
                                    isActive ? 'text-gold' : 'text-cream-dim group-hover:text-cream-dim'
                                  }
                                />
                                <span className="truncate">{lesson.title}</span>
                              </span>
                              {!lesson.published && <Badge tone="draft">Draft</Badge>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL — lesson content */}
        <section
          className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          style={{ background: 'rgba(24,8,14,0.4)', scrollbarWidth: 'thin' }}
        >
          {activeLesson ? (
            <article className="animate-fade-in mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
              {/* Lesson header */}
              <div className="mb-6 flex items-center gap-3">
                {editingTitle ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      ref={titleInputRef}
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle();
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                      className="flex-1 border border-gold/40 bg-white/3 px-4 py-2.5 font-lux text-2xl text-cream outline-none focus:border-gold"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="font-lux text-2xl font-bold text-cream">{activeLesson.title}</h2>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setTitleDraft(activeLesson.title);
                          setEditingTitle(true);
                        }}
                        className="group flex items-center gap-2 text-left"
                      >
                        <Pencil
                          size={15}
                          className="text-cream-dim opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </button>
                    )}
                  </div>
                )}
                {!activeLesson.published && <Badge tone="draft">Draft</Badge>}
              </div>

              {/* Editable body */}
              <div className="mb-6">
                {editingBody ? (
                  <div className="flex flex-col gap-2">
                    <LessonEditor value={bodyDraft} onChange={setBodyDraft} onSave={saveBody} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-cream-dim">Ctrl+Enter to save · Esc to cancel</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingBody(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveBody}>
                          <Check size={14} /> Save content
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : isAdmin ? (
                  <button
                    onClick={() => {
                      setBodyDraft(activeLesson.body_html ?? '');
                      setEditingBody(true);
                    }}
                    className="group w-full rounded-xl border border-transparent px-4 py-3 text-left transition-colors hover:border-gold/20 hover:bg-white/3"
                  >
                    {activeLesson.body_html ? (
                      <div
                        className="mentorship-content-body leading-relaxed text-cream-dim"
                        dangerouslySetInnerHTML={{ __html: activeLesson.body_html }}
                      />
                    ) : (
                      <p className="italic text-cream-dim">Click to add lesson content…</p>
                    )}
                    <span className="mt-2 flex items-center gap-1.5 text-xs text-cream-dim opacity-0 transition-opacity group-hover:opacity-100">
                      <Pencil size={12} /> Click to edit
                    </span>
                  </button>
                ) : activeLesson.body_html ? (
                  <div
                    className="mentorship-content-body leading-relaxed text-cream-dim"
                    dangerouslySetInnerHTML={{ __html: activeLesson.body_html }}
                  />
                ) : (
                  <p className="italic text-cream-dim/60">No written content for this lesson.</p>
                )}
              </div>

              {/* Admin toolbar */}
              {isAdmin && (
                <div
                  className="mb-6 flex flex-wrap items-center gap-2 border px-4 py-3"
                  style={{ borderColor: 'rgba(201,149,58,0.15)', background: 'rgba(15,5,9,0.6)' }}
                >
                  <span className="mr-auto text-xs font-semibold uppercase tracking-widest text-cream-dim">
                    Lesson tools
                  </span>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => pdfRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <Paperclip size={14} />} PDF
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => imageRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />} Photo
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      setInlineAdd(inlineAdd === 'video' ? null : 'video');
                      setNewVideoUrl(activeLesson.video_url ?? '');
                    }}
                  >
                    <PlayCircle size={14} /> Vimeo
                  </Button>
                  <div className="mx-1 h-5 w-px bg-gold/15" />
                  {activeLesson.published ? (
                    <>
                      <Badge tone="success">Published</Badge>
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={unpublishLesson}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />} Unpublish
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={publishLesson} disabled={saving}>
                      {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Publish
                    </Button>
                  )}
                  <div className="mx-1 h-5 w-px bg-gold/15" />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={deleteLesson}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} Delete
                  </Button>
                </div>
              )}

              {/* Interactive tool */}
              {activeLesson.lesson_type === 'tool' && (() => {
                const ToolComponent = getToolComponent(activeLesson.tool_id);
                return ToolComponent ? (
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Zap size={14} className="text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Interactive Tool</span>
                    </div>
                    <ToolComponent />
                  </div>
                ) : (
                  <div className="mb-6 border border-gold/15 bg-luxcard p-6 text-sm text-cream-dim italic">
                    {isAdmin ? 'Select an interactive tool in the lesson editor to display it here.' : 'Interactive tool coming soon.'}
                  </div>
                );
              })()}

              {/* Attached media */}
              {(activeLesson.pdf_url || activeLesson.video_url || activeLesson.image_url) && (
                <div
                  className="flex flex-col gap-5 border-t pt-6"
                  style={{ borderColor: 'rgba(201,149,58,0.1)' }}
                >
                  {activeLesson.image_url && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-cream-dim">Photo</p>
                        {isAdmin && (
                          <button
                            onClick={removeImage}
                            className="text-cream-dim hover:text-error-soft"
                            title="Remove"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      <img
                        src={activeLesson.image_url}
                        alt="Lesson"
                        className="w-full rounded-xl border border-gold/15 object-cover"
                      />
                    </div>
                  )}

                  {activeLesson.pdf_url && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-cream-dim">
                          Attached PDF
                        </p>
                        {isAdmin && (
                          <button
                            onClick={removePdf}
                            className="text-cream-dim hover:text-error-soft"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div
                        className="inline-flex items-center gap-3 border px-4 py-3"
                        style={{
                          borderColor: 'rgba(201,149,58,0.15)',
                          background: 'rgba(15,5,9,0.6)',
                        }}
                      >
                        <FileText size={16} className="text-gold" />
                        <a
                          href={activeLesson.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm text-cream hover:text-gold"
                        >
                          <Download size={14} /> Download PDF Guide
                        </a>
                      </div>
                    </div>
                  )}

                  {activeLesson.video_url && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-cream-dim">Video</p>
                        {isAdmin && (
                          <button
                            onClick={removeVideo}
                            className="text-cream-dim hover:text-error-soft"
                            title="Remove"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      {embedUrl ? (
                        <div className="overflow-hidden rounded-xl border border-gold/15 bg-black">
                          <div className="relative aspect-video w-full">
                            <iframe
                              src={embedUrl}
                              title={activeLesson.title}
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 h-full w-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error-soft">
                          <PlayCircle size={16} />
                          Could not embed this video URL. Check that it's a valid Vimeo link.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <BookOpen className="opacity-20" size={36} style={{ color: '#C9953A' }} />
              <p className="font-lux text-xl text-cream">No lesson selected</p>
              <p className="max-w-xs text-sm text-cream-dim">
                Choose a lesson from the sidebar{isAdmin ? ', or click "Lesson" above to add one.' : '.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
